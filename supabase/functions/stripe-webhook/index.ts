import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    let event: Stripe.Event;
    
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (verifyErr) {
        const errMessage = verifyErr instanceof Error ? verifyErr.message : String(verifyErr);
        logStep("Webhook signature verification failed", { error: errMessage });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      event = JSON.parse(body);
      logStep("Processing without signature verification (dev mode)");
    }

    logStep("Event type", { type: event.type });

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;
        
        const email = customer.email;
        if (!email) {
          logStep("No email found for customer", { customerId });
          break;
        }

        // Find user by email
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users?.users?.find(u => u.email === email);
        
        if (!user) {
          logStep("No user found for email", { email });
          break;
        }

        // Determine plan from price
        const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0;
        let plan = "starter";
        if (priceAmount > 15000) plan = "scale";
        else if (priceAmount > 5000) plan = "pro";

        // Update workspace
        const { data: workspace, error: wsError } = await supabaseClient
          .from("workspaces")
          .update({
            plan,
            subscription_status: subscription.status,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000).toISOString() 
              : null,
          })
          .eq("owner_id", user.id)
          .select()
          .single();

        if (wsError) {
          logStep("Error updating workspace", { error: wsError.message });
        } else {
          logStep("Workspace updated", { workspaceId: workspace?.id, plan });
        }

        // Reset usage on new billing period
        if (event.type === "customer.subscription.updated") {
          const previousPeriodEnd = (event.data.previous_attributes as any)?.current_period_end;
          if (previousPeriodEnd && previousPeriodEnd !== subscription.current_period_end) {
            logStep("Billing period changed, resetting usage");
            
            const { error: usageError } = await supabaseClient
              .from("workspace_usage")
              .update({
                analyses_used: 0,
                packs_used: 0,
                period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              })
              .eq("workspace_id", workspace?.id);

            if (usageError) {
              logStep("Error resetting usage", { error: usageError.message });
            } else {
              logStep("Usage reset successfully");
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        // Get customer email
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) break;
        
        const email = customer.email;
        if (!email) break;

        // Find user by email
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users?.users?.find(u => u.email === email);
        if (!user) break;

        // Update workspace to free/canceled
        await supabaseClient
          .from("workspaces")
          .update({
            plan: "starter",
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("owner_id", user.id);

        logStep("Subscription canceled, workspace updated");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        logStep("Payment failed", { customerId, invoiceId: invoice.id });
        
        // Could update workspace status or send notification
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
