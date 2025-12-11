import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract data from HTML
function extractDataFromHtml(html: string, url: string) {
  const getMetaContent = (name: string) => {
    const match = html.match(new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
                  html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i'));
    return match ? match[1] : '';
  };

  const getTagContent = (tag: string) => {
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
    return match ? match[1].trim() : '';
  };

  const getAllTags = (tag: string) => {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (match[1].trim()) matches.push(match[1].trim());
    }
    return matches;
  };

  // Extract title
  const title = getTagContent('title');

  // Extract meta description
  const metaDescription = getMetaContent('description');

  // Extract headings
  const h1s = getAllTags('h1');
  const h2s = getAllTags('h2');

  // Extract phone numbers
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  const phoneNumbers = [...new Set(html.match(phoneRegex) || [])];

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = [...new Set(html.match(emailRegex) || [])].filter(e => !e.includes('example.com'));

  // Extract CTA buttons
  const ctaPatterns = /(?:call|book|schedule|contact|quote|estimate|get started|free|request)[^<]*(?:<\/(?:a|button)>)/gi;
  const ctaMatches = html.match(ctaPatterns) || [];
  const ctaButtons = ctaMatches.map(m => m.replace(/<[^>]*>/g, '').trim()).filter(Boolean).slice(0, 10);

  // Check for forms
  const hasForm = /<form[^>]*>/i.test(html);
  const formFields = (html.match(/<input[^>]*name=["']([^"']+)["']/gi) || [])
    .map(m => {
      const match = m.match(/name=["']([^"']+)["']/i);
      return match ? match[1] : '';
    })
    .filter(Boolean);

  // Extract images
  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)?["'])?/gi;
  const images: { src: string; alt: string }[] = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null && images.length < 20) {
    images.push({
      src: imgMatch[1],
      alt: imgMatch[2] || '',
    });
  }

  // Count images missing alt text
  const imagesWithoutAlt = images.filter(img => !img.alt).length;

  // Extract script count
  const scriptMatches = html.match(/<script[^>]*src=["'][^"']+["']/gi) || [];
  const externalScripts = scriptMatches.length;

  // Check for SSL
  const hasSSL = url.startsWith('https://');

  // Check for viewport meta
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

  // Check for favicon
  const hasFavicon = /<link[^>]*rel=["'](?:icon|shortcut icon)["']/i.test(html);

  // Extract body text (simplified)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const bodyText = bodyHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);

  // Try to extract business info
  const addressPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)[^<]{0,100}/gi;
  const addresses = html.match(addressPattern) || [];

  return {
    title,
    metaDescription,
    headings: { h1s, h2s },
    phoneNumbers,
    emails,
    ctaButtons,
    forms: { hasForm, fields: formFields },
    images: {
      count: images.length,
      withoutAlt: imagesWithoutAlt,
      samples: images.slice(0, 5),
    },
    externalScripts,
    technical: {
      hasSSL,
      hasViewport,
      hasFavicon,
    },
    bodyTextPreview: bodyText.slice(0, 1500),
    addresses,
  };
}

const ANALYSIS_PROMPT = `You are an expert website conversion consultant specializing in home services businesses (HVAC, plumbing, electrical, roofing, dental, med spa). Analyze the following website data and provide actionable, specific recommendations.

The analysis must be practical and written for a busy contractor or office manager who doesn't know web development. Be specific - don't say "improve your headline" - instead provide an actual better headline.

Return a JSON object with EXACTLY this structure (no markdown, just valid JSON):

{
  "summary": {
    "overallScore": <number 0-100>,
    "overview": "<2 sentence summary of main findings>",
    "quickWins": ["<fix 1 that can be done in 24h>", "<fix 2>", "<fix 3>"]
  },
  "messaging": {
    "score": <number 0-100>,
    "findings": [{"type": "success|warning|error|info", "text": "<finding>"}],
    "recommendedHeadline": "<specific headline for this business>",
    "recommendedSubheadline": "<specific subheadline>",
    "elevatorPitch": "<2-3 sentence pitch for this business>"
  },
  "conversion": {
    "score": <number 0-100>,
    "findings": [{"type": "success|warning|error|info", "text": "<finding>"}],
    "recommendations": ["<specific recommendation>"],
    "sampleButtons": ["<CTA text 1>", "<CTA text 2>", "<CTA text 3>"]
  },
  "designUx": {
    "score": <number 0-100>,
    "findings": [{"type": "success|warning|error|info", "text": "<finding>"}],
    "recommendations": ["<specific design tweak>"]
  },
  "mobile": {
    "score": <number 0-100>,
    "findings": [{"type": "success|warning|error|info", "text": "<finding>"}],
    "recommendations": ["<mobile-specific fix>"]
  },
  "performance": {
    "score": <number 0-100>,
    "findings": [{"type": "success|warning|error|info", "text": "<finding>"}],
    "heavyImages": ["<image filename if any heavy images detected>"],
    "recommendations": ["<performance recommendation>"]
  },
  "seo": {
    "score": <number 0-100>,
    "findings": [{"type": "success|warning|error|info", "text": "<finding>"}],
    "recommendedTitle": "<better title tag, 45-60 chars>",
    "recommendedMetaDescription": "<better meta desc, 120-155 chars>",
    "recommendedH1": "<better H1>",
    "keywords": ["<keyword phrase 1>", "<keyword phrase 2>", "<keyword phrase 3>", "<keyword phrase 4>", "<keyword phrase 5>"],
    "checklist": ["<local SEO action item>"]
  },
  "trust": {
    "score": <number 0-100>,
    "findings": [{"type": "success|warning|error|info", "text": "<finding>"}],
    "whyChooseUs": ["<bullet point 1>", "<bullet point 2>", "<bullet point 3>"],
    "testimonialsBlock": "<description of recommended testimonials section>"
  },
  "technical": {
    "findings": [{"type": "success|warning|error|info", "text": "<finding>"}],
    "recommendations": ["<technical recommendation>"]
  },
  "aiServicePitch": {
    "paragraph": "<1-2 sentences about how AI call answering would help THIS specific business>",
    "bullets": ["<benefit 1: faster response>", "<benefit 2: 24/7 coverage>", "<benefit 3: automatic booking>"]
  }
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing URL:", url);

    // Fetch the website HTML
    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status}`);
      }

      html = await response.text();
      console.log("Fetched HTML length:", html.length);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Could not access this website. Please check the URL and try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract data from HTML
    const extractedData = extractDataFromHtml(html, url);
    console.log("Extracted data:", JSON.stringify(extractedData, null, 2).slice(0, 500));

    // Call AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          {
            role: "user",
            content: `Analyze this website: ${url}

Extracted Data:
${JSON.stringify(extractedData, null, 2)}

Provide a comprehensive analysis with specific, actionable recommendations for this home services business. Return ONLY valid JSON matching the specified structure.`,
          },
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
      
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No analysis generated");
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      const jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", content.slice(0, 500));
      throw new Error("Failed to parse analysis results");
    }

    console.log("Analysis complete for:", url);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
