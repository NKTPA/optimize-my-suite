import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      businessName,
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

    console.log('Generating blueprint for:', businessName);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a website copywriter and UX strategist specializing in home services businesses. Generate a complete website blueprint in JSON format.

The blueprint must include:
1. Hero section with headline, subheadline, 3-4 bullet points, primary CTA, secondary CTA, and offer badge if applicable
2. Navigation labels (typically: Home, Services, About, Gallery, FAQ, Contact)
3. Content for each page with SEO titles and meta descriptions
4. Technical recommendations

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

    const userPrompt = `Create a website blueprint for the following business:

Business Name: ${businessName}
Industry: ${industry}
Location: ${location}
Primary Services: ${primaryServices || 'Not specified'}
Target Customers: ${targetCustomers || 'General consumers'}
Unique Selling Points: ${uniqueSellingPoints || 'Not specified'}
Brand Voice: ${brandVoice}
Phone: ${mainPhone || 'Not provided'}
Email: ${contactEmail || 'Not provided'}
Special Offer: ${specialOffer || 'None'}
Website Goal: ${websiteGoal || 'Get more leads'}

Generate compelling, conversion-focused copy that speaks to local customers in ${location}. Make headlines punchy and benefit-driven. Include local SEO keywords naturally.`;

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

    console.log('Blueprint generated successfully for:', businessName);

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
