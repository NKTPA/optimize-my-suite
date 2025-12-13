import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Owner email from secrets (server-side only)
const getOwnerEmail = () => Deno.env.get("OWNER_EMAIL")?.toLowerCase();

// Plan limits for analyses (blueprints count as analyses)
const PLAN_LIMITS: Record<string, number> = {
  starter: 25,
  pro: 150,
  scale: 500,
};

// Business type template configurations
const TEMPLATE_CONFIGS: Record<string, {
  type: string;
  navigation: string[];
  heroStyle: {
    primaryCTA: string;
    secondaryCTA: string;
    suggestedBullets: string[];
  };
  sections: string[];
  forbiddenKeywords: string[];
  requiredKeywords: string[];
  websiteGoal: string;
  industryLabel: string;
}> = {
  "Women's Boutique": {
    type: "retail",
    navigation: ["Home", "Shop", "New Arrivals", "Collections", "About", "Contact"],
    heroStyle: {
      primaryCTA: "Shop New Arrivals",
      secondaryCTA: "Browse Collections",
      suggestedBullets: [
        "Curated collections for every style",
        "Free shipping on orders over $75",
        "Easy returns within 30 days",
        "New arrivals every week"
      ],
    },
    sections: ["Featured Collections", "New Arrivals", "Best Sellers", "Brand Story", "Customer Reviews", "Store Location & Hours", "Newsletter Signup", "Instagram Gallery"],
    forbiddenKeywords: ["HVAC", "estimate", "licensed", "insured", "technicians", "emergency service", "plumbing", "electrical", "roofing", "repair", "installation service", "free estimate", "service call", "24/7 emergency", "heating", "cooling"],
    requiredKeywords: ["Shop", "Collections", "Arrivals", "Style"],
    websiteGoal: "Drive online and in-store sales",
    industryLabel: "Boutique"
  },
  "Fashion Retail": {
    type: "retail",
    navigation: ["Home", "Shop", "New Arrivals", "Collections", "About", "Contact"],
    heroStyle: {
      primaryCTA: "Shop Now",
      secondaryCTA: "View Collections",
      suggestedBullets: [
        "Curated fashion for every occasion",
        "Free shipping on orders over $50",
        "Easy 30-day returns",
        "New styles weekly"
      ],
    },
    sections: ["Featured Products", "New Arrivals", "Best Sellers", "About Us", "Reviews", "Store Info"],
    forbiddenKeywords: ["HVAC", "estimate", "licensed", "insured", "technicians", "emergency", "plumbing", "electrical", "roofing", "free estimate"],
    requiredKeywords: ["Shop", "Style", "Collection"],
    websiteGoal: "Drive online sales",
    industryLabel: "Fashion"
  },
  "Restaurant": {
    type: "restaurant",
    navigation: ["Home", "Menu", "Reservations", "About", "Gallery", "Contact"],
    heroStyle: {
      primaryCTA: "View Menu",
      secondaryCTA: "Make Reservation",
      suggestedBullets: [
        "Fresh, locally-sourced ingredients",
        "Award-winning chef",
        "Private dining available",
        "Takeout & delivery options"
      ],
    },
    sections: ["Featured Dishes", "Full Menu", "Our Story", "Customer Reviews", "Location & Hours", "Reservations"],
    forbiddenKeywords: ["HVAC", "estimate", "licensed", "insured", "technicians", "plumbing", "electrical", "roofing", "free estimate"],
    requiredKeywords: ["Menu", "Reservation", "Dining"],
    websiteGoal: "Increase reservations and orders",
    industryLabel: "Restaurant"
  },
  "Med Spa": {
    type: "medical",
    navigation: ["Home", "Services", "About", "Before & After", "Patient Info", "Contact"],
    heroStyle: {
      primaryCTA: "Schedule Consultation",
      secondaryCTA: "View Treatments",
      suggestedBullets: [
        "Board-certified specialists",
        "State-of-the-art facilities",
        "Personalized treatment plans",
        "Complimentary consultations"
      ],
    },
    sections: ["Our Services", "Meet the Team", "Before & After", "Patient Testimonials", "FAQ"],
    forbiddenKeywords: ["HVAC", "plumbing", "electrical", "roofing", "landscaping"],
    requiredKeywords: ["Consultation", "Treatment", "Care"],
    websiteGoal: "Generate patient consultations",
    industryLabel: "Med Spa"
  },
  "Dental": {
    type: "medical",
    navigation: ["Home", "Services", "About", "Patient Info", "Testimonials", "Contact"],
    heroStyle: {
      primaryCTA: "Schedule Appointment",
      secondaryCTA: "View Services",
      suggestedBullets: [
        "Gentle, compassionate care",
        "Modern dental technology",
        "Family-friendly practice",
        "Flexible payment options"
      ],
    },
    sections: ["Our Services", "Meet the Team", "Patient Testimonials", "New Patient Info", "Insurance & Payment", "FAQ"],
    forbiddenKeywords: ["HVAC", "plumbing", "electrical", "roofing"],
    requiredKeywords: ["Appointment", "Dental", "Care"],
    websiteGoal: "Generate patient appointments",
    industryLabel: "Dental"
  },
  "HVAC": {
    type: "home-services",
    navigation: ["Home", "Services", "About", "Gallery", "FAQ", "Contact"],
    heroStyle: {
      primaryCTA: "Get Free Estimate",
      secondaryCTA: "View Services",
      suggestedBullets: [
        "Licensed & insured professionals",
        "24/7 emergency service available",
        "Satisfaction guaranteed",
        "Locally owned and operated"
      ],
    },
    sections: ["Our Services", "Why Choose Us", "Service Gallery", "Customer Reviews", "Service Area", "FAQ"],
    forbiddenKeywords: [],
    requiredKeywords: ["Service", "Estimate", "Licensed"],
    websiteGoal: "Get more leads",
    industryLabel: "HVAC"
  },
  "default": {
    type: "generic",
    navigation: ["Home", "Services", "About", "Gallery", "FAQ", "Contact"],
    heroStyle: {
      primaryCTA: "Get Started",
      secondaryCTA: "Learn More",
      suggestedBullets: [
        "Professional service",
        "Experienced team",
        "Customer satisfaction guaranteed",
        "Competitive pricing"
      ],
    },
    sections: ["Our Services", "About Us", "Gallery", "Testimonials", "FAQ", "Contact"],
    forbiddenKeywords: [],
    requiredKeywords: [],
    websiteGoal: "Generate leads",
    industryLabel: "Business"
  }
};

// Home services types that share HVAC template
const HOME_SERVICES_TYPES = ["Plumbing", "Electrical", "Roofing", "Landscaping", "Pest Control", "Cleaning"];

function getTemplateConfig(businessType: string) {
  if (HOME_SERVICES_TYPES.includes(businessType)) {
    return { ...TEMPLATE_CONFIGS["HVAC"], industryLabel: businessType };
  }
  return TEMPLATE_CONFIGS[businessType] || TEMPLATE_CONFIGS["default"];
}

// Validate generated content
function validateContent(content: string, businessType: string): { valid: boolean; errors: string[] } {
  const template = getTemplateConfig(businessType);
  const errors: string[] = [];
  const contentLower = content.toLowerCase();
  
  for (const keyword of template.forbiddenKeywords) {
    if (contentLower.includes(keyword.toLowerCase())) {
      errors.push(`Contains forbidden keyword: "${keyword}"`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Sanitize HTML from content
function sanitizeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/?b>/gi, "")
    .replace(/<\/?strong>/gi, "")
    .replace(/<\/?i>/gi, "")
    .replace(/<\/?em>/gi, "")
    .replace(/<\/?u>/gi, "")
    .replace(/<\/?span[^>]*>/gi, "")
    .replace(/<\/?div[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?ul[^>]*>/gi, "\n")
    .replace(/<\/?ol[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Recursively sanitize all string content in the blueprint
function sanitizeBlueprint(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === "string") {
      result[key] = sanitizeHtml(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === "string" ? sanitizeHtml(item) : 
        typeof item === "object" && item !== null ? sanitizeBlueprint(item as Record<string, unknown>) : item
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeBlueprint(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    // Get user's workspace
    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .select("id, plan, subscription_status, trial_ends_at")
      .eq("owner_id", user.id)
      .single();

    if (workspaceError || !workspace) {
      console.error("Workspace not found:", workspaceError?.message);
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

    // Get current usage (blueprints count as analyses)
    const { data: usage, error: usageError } = await supabaseAdmin
      .from("workspace_usage")
      .select("analyses_used")
      .eq("workspace_id", workspace.id)
      .single();

    if (usageError) {
      console.error("Usage fetch error:", usageError.message);
    }

    const analysesUsed = usage?.analyses_used || 0;
    const planLimit = PLAN_LIMITS[workspace.plan] || PLAN_LIMITS.starter;

    // Check usage limit (skip for owner)
    if (!isOwner && analysesUsed >= planLimit) {
      console.log("Analysis limit exceeded:", analysesUsed, "/", planLimit);
      return new Response(
        JSON.stringify({ error: "Monthly analysis limit reached. Please upgrade your plan." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const {
      businessName,
      businessType,
      industry,
      location,
      primaryServices,
      targetCustomers,
      uniqueSellingPoints,
      brandVoice,
      mainPhone,
      contactEmail,
      specialOffer,
      websiteGoal
    } = await req.json();

    console.log('Generating blueprint for:', businessName, 'Type:', businessType);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get template configuration for business type
    const template = getTemplateConfig(businessType || industry || "default");

    const systemPrompt = `You are a website copywriter and UX strategist. Generate a complete website blueprint in JSON format.

CRITICAL BUSINESS TYPE: ${businessType || industry || "General Business"}
TEMPLATE TYPE: ${template.type}

STRICT REQUIREMENTS FOR THIS BUSINESS TYPE:
1. Navigation MUST use: ${template.navigation.join(", ")}
2. Primary CTA should be: "${template.heroStyle.primaryCTA}"
3. Secondary CTA should be: "${template.heroStyle.secondaryCTA}"
4. Include sections for: ${template.sections.join(", ")}

${template.forbiddenKeywords.length > 0 ? `
FORBIDDEN CONTENT - DO NOT USE ANY OF THESE:
${template.forbiddenKeywords.map(k => `- "${k}"`).join("\n")}
` : ''}

${template.requiredKeywords.length > 0 ? `
REQUIRED - Must include at least one of these concepts:
${template.requiredKeywords.map(k => `- "${k}"`).join("\n")}
` : ''}

IMPORTANT FORMATTING RULES:
- Do NOT use HTML tags in any content (no <p>, <br>, <b>, etc.)
- Use plain text only
- For bullet points in FAQ answers, use "• " prefix

Respond ONLY with valid JSON matching this structure:
{
  "hero": {
    "headline": "string",
    "subheadline": "string", 
    "bullets": ["string"],
    "primaryCTA": "string",
    "secondaryCTA": "string",
    "offerBadge": "string or null"
  },
  "navigation": ["string"],
  "pages": {
    "home": { "title": "string", "seoTitle": "string", "metaDescription": "string", "sections": [{"name": "string", "content": "string"}] },
    "services": { "title": "string", "seoTitle": "string", "metaDescription": "string", "sections": [{"name": "string", "content": "string"}] },
    "about": { "title": "string", "seoTitle": "string", "metaDescription": "string", "sections": [{"name": "string", "content": "string"}] },
    "gallery": { "title": "string", "seoTitle": "string", "metaDescription": "string", "sections": [{"name": "string", "content": "string"}] },
    "faq": { "title": "string", "seoTitle": "string", "metaDescription": "string", "sections": [{"name": "string", "content": "string"}] },
    "contact": { "title": "string", "seoTitle": "string", "metaDescription": "string", "sections": [{"name": "string", "content": "string"}] }
  },
  "technical": {
    "layout": "string",
    "performance": ["string"],
    "accessibility": ["string"]
  }
}`;

    const userPrompt = `Create a website blueprint for the following ${template.industryLabel} business:

Business Name: ${businessName}
Business Type: ${businessType || industry}
Location: ${location}
Primary Products/Services: ${primaryServices || 'Not specified'}
Target Customers: ${targetCustomers || 'General consumers'}
Unique Selling Points: ${uniqueSellingPoints || 'Not specified'}
Brand Voice: ${brandVoice}
Phone: ${mainPhone || 'Not provided'}
Email: ${contactEmail || 'Not provided'}
Special Offer: ${specialOffer || 'None'}
Website Goal: ${websiteGoal || template.websiteGoal}

Generate compelling, conversion-focused copy specifically for a ${template.industryLabel} business in ${location}. 
Make headlines punchy and benefit-driven. Include local SEO keywords naturally.

Remember:
- Use the navigation structure: ${template.navigation.join(", ")}
- Primary CTA: "${template.heroStyle.primaryCTA}"
- DO NOT include any content about: ${template.forbiddenKeywords.slice(0, 5).join(", ")}${template.forbiddenKeywords.length > 5 ? ' (and similar home-service terms)' : ''}
- This is a ${template.type} website, NOT a home services website${template.type === 'retail' ? ' - focus on shopping, products, collections' : ''}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate blueprint');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from AI');
    }

    // Parse JSON from response, handling markdown code blocks
    let blueprint;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      blueprint = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse blueprint response');
    }

    // Sanitize all HTML from the blueprint
    blueprint = sanitizeBlueprint(blueprint);

    // Validate the generated content
    const contentString = JSON.stringify(blueprint);
    const validation = validateContent(contentString, businessType || industry);
    
    if (!validation.valid) {
      console.warn('Blueprint validation warnings for', businessName, ':', validation.errors);
      // Log but don't fail - the sanitization should have helped
    }

    // Increment usage counter server-side (skip for owner)
    if (!isOwner) {
      const { error: updateError } = await supabaseAdmin
        .from("workspace_usage")
        .update({ 
          analyses_used: analysesUsed + 1,
          updated_at: new Date().toISOString()
        })
        .eq("workspace_id", workspace.id);

      if (updateError) {
        console.error("Failed to update usage:", updateError.message);
        // Continue anyway - don't fail the request over usage tracking
      } else {
        console.log("Usage incremented to:", analysesUsed + 1);
      }
    }

    console.log('Blueprint generated successfully for:', businessName, 'Type:', businessType);

    return new Response(JSON.stringify(blueprint), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-website-blueprint:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate blueprint' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
