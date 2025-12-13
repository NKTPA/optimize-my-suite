import { supabase } from "@/integrations/supabase/client";

export interface ServiceImage {
  url: string;
  alt: string;
}

export interface ServiceImagesResponse {
  serviceType: string;
  images: ServiceImage[];
  source: 'api' | 'fallback';
}

// In-memory cache for fetched images
const imageCache = new Map<string, { data: ServiceImagesResponse; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Infer service type from business content
 */
export function inferServiceType(content: {
  businessName?: string;
  headline?: string;
  services?: string[];
  industry?: string;
}): string {
  const { businessName = '', headline = '', services = [], industry = '' } = content;
  
  // Combine all text for analysis
  const allText = [businessName, headline, industry, ...services]
    .join(' ')
    .toLowerCase();
  
  // Priority keywords for each service type
  const serviceKeywords: Record<string, string[]> = {
    'hvac': ['hvac', 'air conditioning', 'ac ', 'a/c', 'heating', 'cooling', 'furnace', 'ductwork', 'climate', 'thermostat'],
    'plumbing': ['plumb', 'pipe', 'drain', 'water heater', 'faucet', 'toilet', 'sewer', 'leak'],
    'electrical': ['electric', 'wiring', 'outlet', 'panel', 'lighting', 'circuit', 'voltage'],
    'roofing': ['roof', 'shingle', 'gutter', 'leak repair'],
    'landscaping': ['landscap', 'lawn', 'garden', 'tree', 'shrub', 'yard', 'mow', 'outdoor'],
    'pest control': ['pest', 'extermina', 'bug', 'rodent', 'termite', 'insect'],
    'dental': ['dental', 'dentist', 'teeth', 'orthodont', 'oral'],
    'med spa': ['med spa', 'medspa', 'medical spa', 'botox', 'facial', 'aesthetic', 'cosmetic', 'laser', 'skin'],
    'garage door': ['garage', 'overhead door', 'door repair'],
  };
  
  // Find the best match
  let bestMatch = 'home services';
  let highestScore = 0;
  
  for (const [serviceType, keywords] of Object.entries(serviceKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (allText.includes(keyword)) {
        score += keyword.length; // Longer matches are more specific
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = serviceType;
    }
  }
  
  return bestMatch;
}

/**
 * Fetch service-specific images from the backend
 */
export async function fetchServiceImages(
  serviceType: string,
  count: number = 8
): Promise<ServiceImagesResponse> {
  const cacheKey = `${serviceType.toLowerCase()}-${count}`;
  
  // Check cache first
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached images for ${serviceType}`);
    return cached.data;
  }
  
  try {
    console.log(`Fetching images for ${serviceType}...`);
    
    const { data, error } = await supabase.functions.invoke('fetch-service-images', {
      body: null,
      method: 'GET',
    });
    
    // Since invoke doesn't support query params well, we'll call directly
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-service-images?serviceType=${encodeURIComponent(serviceType)}&count=${count}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.status}`);
    }
    
    const result: ServiceImagesResponse = await response.json();
    
    // Cache the result
    imageCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    console.log(`Fetched ${result.images.length} images for ${serviceType} from ${result.source}`);
    return result;
  } catch (error) {
    console.error('Error fetching service images:', error);
    
    // Return fallback on error
    return {
      serviceType: serviceType.toLowerCase(),
      images: getLocalFallbackImages(serviceType, count),
      source: 'fallback',
    };
  }
}

/**
 * Local fallback images when API is unavailable
 */
function getLocalFallbackImages(serviceType: string, count: number): ServiceImage[] {
  const fallbacks: Record<string, ServiceImage[]> = {
    'hvac': [
      { url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=85", alt: "HVAC technician working on air conditioning system" },
      { url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1200&q=85", alt: "Outdoor AC condenser unit installation" },
      { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Professional technician with HVAC equipment" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", alt: "Air conditioning maintenance service" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85", alt: "Modern home with climate control" },
      { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=85", alt: "Comfortable home interior with AC" },
      { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85", alt: "Climate controlled living space" },
      { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=85", alt: "Quality home HVAC service" },
    ],
    'plumbing': [
      { url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1200&q=85", alt: "Professional plumber fixing pipes" },
      { url: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=85", alt: "Plumbing repair service" },
      { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=85", alt: "Modern bathroom plumbing" },
      { url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=85", alt: "Kitchen sink and faucet installation" },
      { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Professional plumber at work" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", alt: "Plumbing system maintenance" },
    ],
    'electrical': [
      { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=85", alt: "Electrician working on electrical panel" },
      { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Professional electrician with tools" },
      { url: "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=1200&q=85", alt: "Electrical wiring installation" },
      { url: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=1200&q=85", alt: "Modern electrical work" },
      { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=85", alt: "Lighting installation service" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", alt: "Electrical system maintenance" },
    ],
    'default': [
      { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=85", alt: "Professional home service technician" },
      { url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85", alt: "Quality home services" },
      { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=85", alt: "Modern home maintenance" },
      { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=85", alt: "Professional service work" },
      { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=85", alt: "Home improvement project" },
      { url: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=85", alt: "Quality home care" },
    ],
  };
  
  const normalizedType = serviceType.toLowerCase();
  const images = fallbacks[normalizedType] || fallbacks['default'];
  return images.slice(0, count);
}

/**
 * Get a specific image by purpose
 */
export function getImageByPurpose(
  images: ServiceImage[],
  purpose: 'hero' | 'about' | 'service' | 'gallery',
  index: number = 0
): ServiceImage {
  const purposeIndexes: Record<string, number[]> = {
    hero: [0, 1],
    about: [2, 3],
    service: [3, 4, 5, 6],
    gallery: [0, 1, 2, 3, 4, 5, 6, 7],
  };
  
  const indexes = purposeIndexes[purpose] || [0];
  const targetIndex = indexes[index % indexes.length];
  
  return images[targetIndex % images.length] || images[0];
}

/**
 * Clear the image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}
