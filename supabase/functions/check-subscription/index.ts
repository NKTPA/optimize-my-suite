import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Price ID to plan mapping
const PRICE_TO_PLAN: Record<string, { plan: string; limit: number }> = {
  "price_1Sdg76JDZeHuCLwazGgchPkh": { plan: "starter", limit: 25 },
  "price_1Sdg7gJDZeHuCLwardbQggEZ": { plan: "pro", limit: 150 },
  "price_1Sdg80JDZeHuCLwaVVp0uBbh": { plan: "scale", limit: 500 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's workspace
    const { data: workspace, error: workspaceError } = await supabaseClient
      .from("workspaces")
      .select("id, plan, subscription_status, stripe_customer_id, stripe_subscription_id")
      .eq("owner_id", user.id)
      .single();

    if (workspaceError) {
      logStep("Error fetching workspace", { error: workspaceError.message });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: workspace?.plan || "starter",
        subscription_status: workspace?.subscription_status || "trialing",
        subscription_end: null,
        usage_limit: 25,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    let hasActiveSub = subscriptions.data.length > 0;
    let plan = "starter";
    let subscriptionStatus = "inactive";
    let subscriptionEnd = null;
    let subscriptionId = null;
    let usageLimit = 25;
    let currentPeriodStart = null;
    let currentPeriodEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionId = subscription.id;
      subscriptionStatus = subscription.status;
      currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
      currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      subscriptionEnd = currentPeriodEnd;
      
      const priceId = subscription.items.data[0]?.price?.id;
      
      // Match price ID to plan
      if (priceId && PRICE_TO_PLAN[priceId]) {
        plan = PRICE_TO_PLAN[priceId].plan;
        usageLimit = PRICE_TO_PLAN[priceId].limit;
      } else {
        // Fallback: determine plan based on price amount
        const price = subscription.items.data[0]?.price;
        const amount = price?.unit_amount || 0;
        
        if (amount <= 5000) {
          plan = "starter";
          usageLimit = 25;
        } else if (amount <= 15000) {
          plan = "pro";
          usageLimit = 150;
        } else {
          plan = "scale";
          usageLimit = 500;
        }
      }
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        plan,
        priceId,
        endDate: subscriptionEnd 
      });

      // Sync subscription data to workspace
      if (workspace?.id) {
        const { error: updateError } = await supabaseClient
          .from("workspaces")
          .update({
            plan,
            subscription_status: subscriptionStatus,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("id", workspace.id);

        if (updateError) {
          logStep("Error updating workspace", { error: updateError.message });
        } else {
          logStep("Workspace subscription synced", { workspaceId: workspace.id, plan });
        }
      }
    } else {
      // Check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });

      if (trialingSubscriptions.data.length > 0) {
        const subscription = trialingSubscriptions.data[0];
        subscriptionId = subscription.id;
        subscriptionStatus = "trialing";
        hasActiveSub = true;
        
        const priceId = subscription.items.data[0]?.price?.id;
        if (priceId && PRICE_TO_PLAN[priceId]) {
          plan = PRICE_TO_PLAN[priceId].plan;
          usageLimit = PRICE_TO_PLAN[priceId].limit;
        }
        
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        logStep("Trialing subscription found", { subscriptionId, plan });

        // Sync trialing subscription to workspace
        if (workspace?.id) {
          await supabaseClient
            .from("workspaces")
            .update({
              plan,
              subscription_status: "trialing",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", workspace.id);
        }
      } else {
        logStep("No active subscription found");
        subscriptionStatus = "inactive";
        
        // Update workspace to reflect inactive status
        if (workspace?.id && workspace.subscription_status !== "trialing") {
          await supabaseClient
            .from("workspaces")
            .update({
              subscription_status: "inactive",
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", workspace.id);
        }
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      subscription_status: subscriptionStatus,
      subscription_end: subscriptionEnd,
      usage_limit: usageLimit,
      stripe_customer_id: customerId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
