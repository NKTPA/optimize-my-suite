import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Owner email from secrets (server-side only)
const getOwnerEmail = () => Deno.env.get("OWNER_EMAIL")?.toLowerCase();

// Curated fallback images by service type - high-quality, relevant images
const fallbackImages: Record<string, Array<{ url: string; alt: string }>> = {
  hvac: [
    { url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=85", alt: "HVAC technician working on air conditioning system" },
    { url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=85", alt: "Outdoor AC condenser unit installation" },
    { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Professional technician with HVAC equipment" },
    { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", alt: "Air conditioning maintenance service" },
    { url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=85", alt: "HVAC system repair and diagnostics" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85", alt: "Modern home with climate control" },
    { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=85", alt: "Comfortable home interior with AC" },
    { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85", alt: "Climate controlled living space" },
  ],
  plumbing: [
    { url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=85", alt: "Professional plumber fixing pipes" },
    { url: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=85", alt: "Plumbing repair service" },
    { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", alt: "Technician working on plumbing system" },
    { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=85", alt: "Modern bathroom plumbing" },
    { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=85", alt: "Kitchen sink and faucet installation" },
    { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Professional plumber at work" },
  ],
  electrical: [
    { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=85", alt: "Electrician working on electrical panel" },
    { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", alt: "Electrical system maintenance" },
    { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Professional electrician with tools" },
    { url: "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=1200&q=85", alt: "Electrical wiring installation" },
    { url: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=1200&q=85", alt: "Modern electrical work" },
    { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85", alt: "Lighting installation service" },
  ],
  roofing: [
    { url: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=1200&q=85", alt: "Roofer installing shingles" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85", alt: "Modern home roofing" },
    { url: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&q=85", alt: "Professional roofing installation" },
    { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=85", alt: "Beautiful home with new roof" },
    { url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=85", alt: "Residential roofing project" },
    { url: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=85", alt: "Quality roof craftsmanship" },
  ],
  landscaping: [
    { url: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1200&q=85", alt: "Professional landscaping service" },
    { url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=85", alt: "Beautiful garden design" },
    { url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1200&q=85", alt: "Lawn maintenance and care" },
    { url: "https://images.unsplash.com/photo-1598902108854-10e335adac99?w=1200&q=85", alt: "Outdoor landscape project" },
    { url: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1200&q=85", alt: "Garden maintenance work" },
    { url: "https://images.unsplash.com/photo-1560749003-f4b1e17e2dff?w=1200&q=85", alt: "Professional lawn care" },
  ],
  "pest control": [
    { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Pest control technician at work" },
    { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", alt: "Professional pest treatment" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85", alt: "Home pest prevention" },
    { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85", alt: "Safe home environment" },
    { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=85", alt: "Clean and pest-free living" },
    { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=85", alt: "Protected home interior" },
  ],
  dental: [
    { url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=85", alt: "Professional dental care" },
    { url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&q=85", alt: "Modern dental clinic" },
    { url: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1200&q=85", alt: "Dental treatment room" },
    { url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=85", alt: "Dental examination" },
    { url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&q=85", alt: "Healthy smile dental care" },
    { url: "https://images.unsplash.com/photo-1445527815219-ecbfec67492e?w=1200&q=85", alt: "Professional dentistry" },
  ],
  "med spa": [
    { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&q=85", alt: "Relaxing spa treatment" },
    { url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=85", alt: "Professional spa services" },
    { url: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1200&q=85", alt: "Medical spa treatment room" },
    { url: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&q=85", alt: "Luxury spa experience" },
    { url: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=85", alt: "Beauty and wellness" },
    { url: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&q=85", alt: "Rejuvenation services" },
  ],
  "garage door": [
    { url: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1200&q=85", alt: "Modern garage door installation" },
    { url: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=85", alt: "Residential garage service" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85", alt: "Home with quality garage" },
    { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=85", alt: "Beautiful home exterior" },
    { url: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1200&q=85", alt: "Quality garage door" },
    { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Garage door technician" },
  ],
  default: [
    { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Professional home service technician" },
    { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", alt: "Quality home services" },
    { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85", alt: "Modern home maintenance" },
    { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85", alt: "Professional service work" },
    { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=85", alt: "Home improvement project" },
    { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=85", alt: "Quality home care" },
  ],
};

// Map common variations to standard keys
function normalizeServiceType(serviceType: string): string {
  const normalized = serviceType.toLowerCase().trim();
  
  const mappings: Record<string, string> = {
    'hvac': 'hvac',
    'air conditioning': 'hvac',
    'ac': 'hvac',
    'heating': 'hvac',
    'cooling': 'hvac',
    'plumbing': 'plumbing',
    'plumber': 'plumbing',
    'electrical': 'electrical',
    'electrician': 'electrical',
    'roofing': 'roofing',
    'roofer': 'roofing',
    'roof': 'roofing',
    'landscaping': 'landscaping',
    'lawn care': 'landscaping',
    'lawn': 'landscaping',
    'garden': 'landscaping',
    'pest control': 'pest control',
    'exterminator': 'pest control',
    'pest': 'pest control',
    'dental': 'dental',
    'dentist': 'dental',
    'med spa': 'med spa',
    'medspa': 'med spa',
    'medical spa': 'med spa',
    'spa': 'med spa',
    'garage door': 'garage door',
    'garage': 'garage door',
  };
  
  // Check direct mapping first
  if (mappings[normalized]) {
    return mappings[normalized];
  }
  
  // Check if any key is contained in the input
  for (const [key, value] of Object.entries(mappings)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return 'default';
}

async function fetchFromUnsplash(query: string, count: number, accessKey: string): Promise<Array<{ url: string; alt: string }>> {
  console.log(`Fetching from Unsplash: query="${query}", count=${count}`);
  
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=${count}`,
    {
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
      },
    }
  );
  
  if (!response.ok) {
    console.error(`Unsplash API error: ${response.status}`);
    throw new Error(`Unsplash API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.results.map((photo: any) => ({
    url: photo.urls.regular || photo.urls.full,
    alt: photo.alt_description || `${query} professional service`,
  }));
}

async function fetchFromPexels(query: string, count: number, apiKey: string): Promise<Array<{ url: string; alt: string }>> {
  console.log(`Fetching from Pexels: query="${query}", count=${count}`);
  
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=${count}`,
    {
      headers: {
        'Authorization': apiKey,
      },
    }
  );
  
  if (!response.ok) {
    console.error(`Pexels API error: ${response.status}`);
    throw new Error(`Pexels API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return data.photos.map((photo: any) => ({
    url: photo.src.large || photo.src.original,
    alt: photo.alt || `${query} professional service`,
  }));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========================================
    // AUTHENTICATION CHECK
    // ========================================
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

    // ========================================
    // IMAGE FETCHING LOGIC
    // ========================================
    const url = new URL(req.url);
    const serviceType = url.searchParams.get('serviceType') || 'home services';
    const count = Math.min(parseInt(url.searchParams.get('count') || '8'), 20);
    
    console.log(`Fetching images for serviceType="${serviceType}", count=${count}`);
    
    const normalizedType = normalizeServiceType(serviceType);
    console.log(`Normalized service type: ${normalizedType}`);
    
    const unsplashKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
    const pexelsKey = Deno.env.get('PEXELS_API_KEY');
    
    let images: Array<{ url: string; alt: string }> = [];
    
    // Build search query based on service type
    const searchQueries: Record<string, string> = {
      'hvac': 'HVAC technician air conditioning repair',
      'plumbing': 'plumber pipes repair professional',
      'electrical': 'electrician wiring installation',
      'roofing': 'roofer shingles installation',
      'landscaping': 'landscaping lawn garden maintenance',
      'pest control': 'pest control home service',
      'dental': 'dental clinic professional care',
      'med spa': 'medical spa treatment wellness',
      'garage door': 'garage door installation repair',
      'default': 'home services professional technician',
    };
    
    const query = searchQueries[normalizedType] || searchQueries['default'];
    
    // Try Unsplash first
    if (unsplashKey) {
      try {
        images = await fetchFromUnsplash(query, count, unsplashKey);
        console.log(`Successfully fetched ${images.length} images from Unsplash`);
      } catch (error) {
        console.error('Unsplash fetch failed:', error);
      }
    }
    
    // Try Pexels if Unsplash failed or not configured
    if (images.length === 0 && pexelsKey) {
      try {
        images = await fetchFromPexels(query, count, pexelsKey);
        console.log(`Successfully fetched ${images.length} images from Pexels`);
      } catch (error) {
        console.error('Pexels fetch failed:', error);
      }
    }
    
    // Use fallback images if APIs failed or not configured
    if (images.length === 0) {
      console.log('Using fallback images');
      const fallbackList = fallbackImages[normalizedType] || fallbackImages['default'];
      images = fallbackList.slice(0, count);
    }
    
    return new Response(
      JSON.stringify({
        serviceType: normalizedType,
        images,
        source: images.length > 0 && (unsplashKey || pexelsKey) ? 'api' : 'fallback',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-service-images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        serviceType: 'default',
        images: fallbackImages['default'].slice(0, 6),
        source: 'fallback',
      }),
      {
        status: 200, // Return 200 with fallbacks instead of error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
