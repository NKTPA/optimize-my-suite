import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Owner email from secrets (server-side only)
const getOwnerEmail = () => Deno.env.get("OWNER_EMAIL")?.toLowerCase();

// Plan limits for packs
const PLAN_LIMITS: Record<string, number> = {
  starter: 25,
  pro: 150,
  scale: 500,
};

const IMPLEMENTATION_PROMPT = `
You are an expert web developer and digital marketing specialist who implements websites for small HOME-SERVICES businesses (HVAC, plumbing, roofing, electrical, landscaping, med spa, dental, etc.).

You receive:
1) A comprehensive website analysis (JSON) with scores and findings across messaging, conversion, design, mobile, performance, SEO, trust, and technical sections.
2) Optionally, extracted data from the original website (title, phone, headings, etc.).

TASK:
Based on the analysis findings and recommendations, produce a CONCRETE, READY-TO-APPLY "Implementation Pack" that a developer or copywriter can use to rebuild or improve the website.

This is NOT a report—it's an actionable blueprint. Write actual copy, not placeholders. Be specific.

OUTPUT:
Return ONLY a valid JSON object with this exact shape (no extra commentary):

{
  "heroSection": {
    "headline": "The main hero headline (attention-grabbing, benefit-focused)",
    "subheadline": "Supporting statement that reinforces the value proposition",
    "supportingBullets": ["Bullet 1", "Bullet 2", "Bullet 3"],
    "primaryCTA": "Main CTA button text",
    "secondaryCTA": "Secondary CTA button text"
  },
  "keyPages": {
    "home": {
      "intro": "Opening paragraph for the homepage (2-3 sentences)",
      "servicesOverview": "Brief services overview paragraph",
      "whyChooseUs": ["Reason 1", "Reason 2", "Reason 3"],
      "trustElements": ["Trust element 1", "Trust element 2"]
    },
    "servicesPage": {
      "sections": [
        {
          "serviceName": "Service Name",
          "shortDescription": "Brief description of the service",
          "idealCTA": "CTA for this service"
        }
      ]
    },
    "aboutPage": {
      "headline": "About page headline",
      "body": "About page body copy (2-3 paragraphs)"
    },
    "contactPage": {
      "headline": "Contact page headline",
      "body": "Contact page intro text"
    }
  },
  "formsAndCTAs": {
    "primaryPhoneNumber": "The main phone number to display",
    "contactFormSpec": {
      "fields": ["Name", "Phone", "Email", "Service Needed", "Message"],
      "notes": "Notes about form behavior, validation, etc."
    },
    "ctaButtons": ["CTA 1", "CTA 2", "CTA 3"],
    "placementGuidelines": ["Where to place CTAs", "Button styling tips"]
  },
  "seoSetup": {
    "home": {
      "title": "SEO-optimized page title (under 60 chars)",
      "metaDescription": "Meta description (under 160 chars)",
      "h1": "Main H1 heading"
    },
    "otherSuggestions": ["SEO tip 1", "SEO tip 2"],
    "imageAltTextExamples": [
      { "forImageType": "Hero image", "altText": "Example alt text" }
    ]
  },
  "designAndLayout": {
    "colorPaletteSuggestion": {
      "primary": "#HEX - description",
      "secondary": "#HEX - description",
      "accent": "#HEX - description"
    },
    "layoutChanges": ["Layout change 1", "Layout change 2", "Layout change 3"]
  },
  "technicalFixes": {
    "tasks": ["Technical task 1", "Technical task 2", "Technical task 3"],
    "priorityOrder": ["Priority 1", "Priority 2", "Priority 3"]
  },
  "executionChecklist": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ..."
  ]
}

GUIDELINES:
- Write REAL copy, not "insert headline here" placeholders.
- Keep headlines punchy and benefit-focused.
- All CTAs should be action-oriented (verbs).
- Make services specific to the business type detected from the analysis.
- SEO titles should include location and service keywords if available.
- Execution checklist should be in priority order.
- Be concise but complete.
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client with user's token for authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.email);

    // Check if owner (bypass limits)
    const ownerEmail = getOwnerEmail();
    const isOwner = ownerEmail ? user.email?.toLowerCase() === ownerEmail : false;

    // Create service role client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's workspace - first try as owner, then as member
    let workspace;
    
    // Try to find workspace where user is owner
    const { data: ownedWorkspace, error: ownedError } = await supabaseAdmin
      .from("workspaces")
      .select("id, plan, subscription_status, trial_ends_at")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (ownedWorkspace) {
      workspace = ownedWorkspace;
    } else {
      // Try to find workspace where user is a member
      const { data: membership, error: memberError } = await supabaseAdmin
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership) {
        const { data: memberWorkspace, error: wsError } = await supabaseAdmin
          .from("workspaces")
          .select("id, plan, subscription_status, trial_ends_at")
          .eq("id", membership.workspace_id)
          .single();
        
        if (memberWorkspace) {
          workspace = memberWorkspace;
        }
      }
    }

    if (!workspace) {
      console.error("Workspace not found for user:", user.id);
      return new Response(
        JSON.stringify({ error: "Workspace not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription status (skip for owner)
    if (!isOwner) {
      const now = new Date();
      const trialEndsAt = workspace.trial_ends_at ? new Date(workspace.trial_ends_at) : null;
      const isTrialExpired = trialEndsAt && now > trialEndsAt;
      const isActiveSubscription = workspace.subscription_status === "active";

      if (isTrialExpired && !isActiveSubscription) {
        console.log("Subscription inactive for workspace:", workspace.id);
        return new Response(
          JSON.stringify({ error: "Your trial has expired. Please upgrade to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get current usage
    const { data: usage, error: usageError } = await supabaseAdmin
      .from("workspace_usage")
      .select("packs_used")
      .eq("workspace_id", workspace.id)
      .single();

    if (usageError) {
      console.error("Usage fetch error:", usageError.message);
    }

    const packsUsed = usage?.packs_used || 0;
    const planLimit = PLAN_LIMITS[workspace.plan] || PLAN_LIMITS.starter;

    // Check usage limit (skip for owner)
    if (!isOwner && packsUsed >= planLimit) {
      console.log("Pack limit exceeded:", packsUsed, "/", planLimit);
      return new Response(
        JSON.stringify({ error: "Monthly pack limit reached. Please upgrade your plan." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { analysisResult, extractedData, url } = await req.json();

    if (!analysisResult) {
      return new Response(
        JSON.stringify({ error: "Analysis result is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating implementation plan for:", url || "unknown URL");

    // Call AI for implementation plan
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    const userContent = `Generate an implementation plan based on this website analysis:

URL: ${url || "Not provided"}

ANALYSIS RESULTS:
${JSON.stringify(analysisResult, null, 2)}

${extractedData ? `EXTRACTED WEBSITE DATA:
${JSON.stringify(extractedData, null, 2)}` : ""}

Based on the analysis findings, create a concrete, ready-to-implement plan with actual copy and specific recommendations. Return ONLY valid JSON matching the specified structure.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: IMPLEMENTATION_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service quota exceeded. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No implementation plan generated");
    }

    // Parse the JSON response
    let implementationPlan;
    try {
      const jsonContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      implementationPlan = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", content.slice(0, 500));
      throw new Error("Failed to parse implementation plan");
    }

    // Increment usage counter server-side (skip for owner)
    if (!isOwner) {
      const { error: updateError } = await supabaseAdmin
        .from("workspace_usage")
        .update({ 
          packs_used: packsUsed + 1,
          updated_at: new Date().toISOString()
        })
        .eq("workspace_id", workspace.id);

      if (updateError) {
        console.error("Failed to update usage:", updateError.message);
        // Continue anyway - don't fail the request over usage tracking
      } else {
        console.log("Usage incremented to:", packsUsed + 1);
      }
    }

    console.log("Implementation plan generated successfully");

    return new Response(JSON.stringify(implementationPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Implementation plan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Generation failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
