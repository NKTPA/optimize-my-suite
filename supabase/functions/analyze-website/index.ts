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


const ANALYSIS_PROMPT = `
You are a senior CRO (conversion rate optimization) expert, web designer, and local SEO specialist focused on small HOME-SERVICES businesses (HVAC, plumbing, roofing, electrical, landscaping, med spa, dental, etc.).

You receive:
- Basic business category and location (if detectable from the site)
- Extracted website data:
  - title, metaDescription
  - headings (H1, H2, H3)
  - main body text
  - phoneNumbers, emails
  - CTA buttons (text + href)
  - forms (fields, actions)
  - images (src, alt, approxSize)
  - scripts (urls)

TASK:
1) Analyze the site as if you were hired to increase LEADS (calls, form fills, bookings).
2) Be brutally honest but respectful.
3) Write at a 7th–8th grade reading level. Avoid jargon.
4) Focus on QUICK, PRACTICAL fixes, not theory.
5) Tailor your advice to home-services: urgent jobs, local customers, trust, and speed.

OUTPUT:
Return ONLY a valid JSON object with the following shape (no extra commentary):

{
  "summary": {
    "overallScore": number,
    "overview": "string",
    "quickWins": ["string", "string", "string"]
  },
  "messaging": {
    "score": number,
    "findings": ["string", "string"],
    "recommendedHeadline": "string",
    "recommendedSubheadline": "string",
    "elevatorPitch": "string"
  },
  "conversion": {
    "score": number,
    "findings": ["string", "string"],
    "recommendations": ["string", "string"],
    "sampleButtons": ["string", "string"]
  },
  "designUx": {
    "score": number,
    "findings": ["string", "string"],
    "recommendations": ["string", "string"]
  },
  "mobile": {
    "score": number,
    "findings": ["string", "string"],
    "recommendations": ["string", "string"]
  },
  "performance": {
    "score": number,
    "findings": ["string", "string"],
    "heavyImages": ["string"],
    "recommendations": ["string", "string"]
  },
  "seo": {
    "score": number,
    "findings": ["string", "string"],
    "recommendedTitle": "string",
    "recommendedMetaDescription": "string",
    "recommendedH1": "string",
    "keywords": ["string", "string", "string", "string", "string"],
    "checklist": ["string", "string"]
  },
  "trust": {
    "score": number,
    "findings": ["string", "string"],
    "whyChooseUs": ["string", "string", "string"],
    "testimonialsBlock": "string"
  },
  "technical": {
    "findings": ["string", "string"],
    "recommendations": ["string", "string"]
  },
  "aiServicePitch": {
    "paragraph": "string",
    "bullets": ["string", "string", "string"]
  }
}

- Use scores on a 0–100 scale.
- If some data is missing (for example, no meta description), explain that and still give a recommendation.
- Always assume the goal is: “Get more phone calls, quote requests, and booked jobs from this website.”
`;


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

    // Fetch the website HTML with multiple user agents if needed
    let html: string;
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    ];
    
    let lastError: Error | null = null;
    
    for (const userAgent of userAgents) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
          },
          redirect: "follow",
        });

        if (response.ok) {
          html = await response.text();
          console.log("Fetched HTML length:", html.length, "with UA:", userAgent.slice(0, 30));
          break;
        } else if (response.status === 403 || response.status === 503) {
          console.log(`Got ${response.status} with UA: ${userAgent.slice(0, 30)}, trying next...`);
          lastError = new Error(`Website returned ${response.status}`);
          continue;
        } else {
          throw new Error(`Failed to fetch website: ${response.status}`);
        }
      } catch (fetchError) {
        console.log(`Fetch failed with UA: ${userAgent.slice(0, 30)}:`, fetchError);
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        continue;
      }
    }
    
    if (!html!) {
      console.error("All fetch attempts failed:", lastError);
      return new Response(
        JSON.stringify({ error: "Could not access this website. The site may have bot protection enabled. Please check the URL and try again." }),
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
      let jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to extract JSON from potential wrapping text
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      // Fix common JSON issues
      jsonContent = jsonContent
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
        .replace(/[\x00-\x1F\x7F]/g, ' '); // Remove control characters
      
      analysisResult = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw content:", content.slice(0, 1000));
      
      // Return a minimal valid result instead of failing completely
      analysisResult = {
        summary: {
          overallScore: 50,
          overview: "Analysis partially completed. Some data could not be parsed.",
          quickWins: ["Review website manually for specific recommendations"]
        },
        messaging: { score: 50, findings: ["Could not fully analyze"], recommendedHeadline: "", recommendedSubheadline: "", elevatorPitch: "" },
        conversion: { score: 50, findings: ["Could not fully analyze"], recommendations: [], sampleButtons: [] },
        designUx: { score: 50, findings: ["Could not fully analyze"], recommendations: [] },
        mobile: { score: 50, findings: ["Could not fully analyze"], recommendations: [] },
        performance: { score: 50, findings: ["Could not fully analyze"], heavyImages: [], recommendations: [] },
        seo: { score: 50, findings: ["Could not fully analyze"], recommendedTitle: "", recommendedMetaDescription: "", recommendedH1: "", keywords: [], checklist: [] },
        trust: { score: 50, findings: ["Could not fully analyze"], whyChooseUs: [], testimonialsBlock: "" },
        technical: { findings: ["Could not fully analyze"], recommendations: [] },
        aiServicePitch: { paragraph: "", bullets: [] },
        parseWarning: "Some analysis data could not be parsed correctly"
      };
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
