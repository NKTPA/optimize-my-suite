// ============================================================================
// Business Type Template System
// Maps business types to industry-specific template packs with guardrails
// ============================================================================

export type BusinessType =
  | "Women's Boutique"
  | "Fashion Retail"
  | "Restaurant"
  | "Cafe/Coffee Shop"
  | "Salon/Spa"
  | "Med Spa"
  | "Dental"
  | "HVAC"
  | "Plumbing"
  | "Electrical"
  | "Roofing"
  | "Landscaping"
  | "Pest Control"
  | "Cleaning"
  | "Fitness/Gym"
  | "Photography"
  | "Real Estate"
  | "Other";

export interface TemplatePack {
  type: "retail" | "restaurant" | "beauty" | "medical" | "home-services" | "fitness" | "creative" | "generic";
  navigation: string[];
  heroStyle: {
    primaryCTA: string;
    secondaryCTA: string;
    suggestedBullets: string[];
  };
  sections: string[];
  forbiddenKeywords: string[];
  requiredKeywords: string[];
  suggestedCTAs: string[];
  websiteGoal: string;
  industryLabel: string;
}

// Template packs by business category
const RETAIL_TEMPLATE: TemplatePack = {
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
  sections: [
    "Featured Collections",
    "New Arrivals",
    "Best Sellers",
    "Brand Story",
    "Customer Reviews",
    "Store Location & Hours",
    "Newsletter Signup",
    "Instagram/Lookbook Gallery"
  ],
  forbiddenKeywords: [
    "HVAC", "estimate", "licensed", "insured", "technicians", "emergency service",
    "plumbing", "electrical", "roofing", "repair", "installation service",
    "free estimate", "service call", "24/7 emergency", "heating", "cooling"
  ],
  requiredKeywords: ["Shop", "Collections", "New Arrivals", "Best Sellers", "Style"],
  suggestedCTAs: ["Shop Now", "Shop New Arrivals", "Browse Collections", "View Lookbook", "Get Directions", "Visit Boutique"],
  websiteGoal: "Drive online and in-store sales",
  industryLabel: "Boutique"
};

const RESTAURANT_TEMPLATE: TemplatePack = {
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
  sections: [
    "Featured Dishes",
    "Full Menu",
    "Chef's Specials",
    "Our Story",
    "Customer Reviews",
    "Location & Hours",
    "Reservations",
    "Private Events"
  ],
  forbiddenKeywords: [
    "HVAC", "estimate", "licensed", "insured", "technicians",
    "plumbing", "electrical", "roofing", "free estimate"
  ],
  requiredKeywords: ["Menu", "Reservations", "Dining", "Cuisine"],
  suggestedCTAs: ["View Menu", "Make Reservation", "Order Online", "Book Private Event"],
  websiteGoal: "Increase reservations and orders",
  industryLabel: "Restaurant"
};

const BEAUTY_TEMPLATE: TemplatePack = {
  type: "beauty",
  navigation: ["Home", "Services", "Book Appointment", "Gallery", "About", "Contact"],
  heroStyle: {
    primaryCTA: "Book Appointment",
    secondaryCTA: "View Services",
    suggestedBullets: [
      "Experienced stylists and technicians",
      "Premium products and treatments",
      "Relaxing atmosphere",
      "Personalized consultations"
    ],
  },
  sections: [
    "Services Menu",
    "Meet Our Team",
    "Before & After Gallery",
    "Client Testimonials",
    "Our Philosophy",
    "Book Online",
    "Special Offers"
  ],
  forbiddenKeywords: [
    "HVAC", "plumbing", "electrical", "roofing", "free estimate",
    "emergency service", "technicians", "installation"
  ],
  requiredKeywords: ["Book", "Appointment", "Services", "Treatment"],
  suggestedCTAs: ["Book Now", "Book Appointment", "View Services", "See Gallery"],
  websiteGoal: "Drive appointment bookings",
  industryLabel: "Salon & Spa"
};

const MEDICAL_TEMPLATE: TemplatePack = {
  type: "medical",
  navigation: ["Home", "Services", "About", "Patient Info", "Before & After", "Contact"],
  heroStyle: {
    primaryCTA: "Schedule Consultation",
    secondaryCTA: "View Treatments",
    suggestedBullets: [
      "Board-certified specialists",
      "State-of-the-art facilities",
      "Personalized treatment plans",
      "Comfortable, caring environment"
    ],
  },
  sections: [
    "Our Services",
    "Meet the Team",
    "Patient Testimonials",
    "Before & After Results",
    "Patient Resources",
    "Insurance & Payment",
    "FAQ"
  ],
  forbiddenKeywords: [
    "HVAC", "plumbing", "electrical", "roofing", "landscaping"
  ],
  requiredKeywords: ["Consultation", "Treatment", "Care", "Patient"],
  suggestedCTAs: ["Schedule Consultation", "Book Appointment", "Call Now", "View Treatments"],
  websiteGoal: "Generate patient consultations",
  industryLabel: "Healthcare"
};

const HOME_SERVICES_TEMPLATE: TemplatePack = {
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
  sections: [
    "Our Services",
    "Why Choose Us",
    "Service Gallery",
    "Customer Reviews",
    "Service Area",
    "FAQ",
    "Contact Form"
  ],
  forbiddenKeywords: [],
  requiredKeywords: ["Service", "Estimate", "Licensed", "Guaranteed"],
  suggestedCTAs: ["Get Free Estimate", "Call Now", "Schedule Service", "Request Quote"],
  websiteGoal: "Get more leads",
  industryLabel: "Home Services"
};

const FITNESS_TEMPLATE: TemplatePack = {
  type: "fitness",
  navigation: ["Home", "Classes", "Membership", "Trainers", "Schedule", "Contact"],
  heroStyle: {
    primaryCTA: "Start Free Trial",
    secondaryCTA: "View Classes",
    suggestedBullets: [
      "Expert certified trainers",
      "Variety of class options",
      "Flexible membership plans",
      "State-of-the-art equipment"
    ],
  },
  sections: [
    "Classes & Programs",
    "Membership Options",
    "Meet Our Trainers",
    "Class Schedule",
    "Success Stories",
    "Facility Tour",
    "Join Today"
  ],
  forbiddenKeywords: [
    "HVAC", "plumbing", "electrical", "roofing", "free estimate"
  ],
  requiredKeywords: ["Classes", "Membership", "Training", "Fitness"],
  suggestedCTAs: ["Start Free Trial", "Join Now", "View Classes", "Book Session"],
  websiteGoal: "Drive membership signups",
  industryLabel: "Fitness"
};

const CREATIVE_TEMPLATE: TemplatePack = {
  type: "creative",
  navigation: ["Home", "Portfolio", "Services", "About", "Pricing", "Contact"],
  heroStyle: {
    primaryCTA: "View Portfolio",
    secondaryCTA: "Book Session",
    suggestedBullets: [
      "Award-winning creative work",
      "Personalized experience",
      "Professional quality",
      "Fast turnaround available"
    ],
  },
  sections: [
    "Portfolio Gallery",
    "Services & Packages",
    "About the Artist",
    "Client Testimonials",
    "Pricing",
    "Booking Info",
    "FAQ"
  ],
  forbiddenKeywords: [
    "HVAC", "plumbing", "electrical", "roofing", "free estimate",
    "licensed", "insured", "technicians"
  ],
  requiredKeywords: ["Portfolio", "Creative", "Session", "Book"],
  suggestedCTAs: ["View Portfolio", "Book Session", "Get Quote", "Contact"],
  websiteGoal: "Drive bookings and inquiries",
  industryLabel: "Creative Services"
};

const GENERIC_TEMPLATE: TemplatePack = {
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
  sections: [
    "Our Services",
    "About Us",
    "Gallery",
    "Testimonials",
    "FAQ",
    "Contact"
  ],
  forbiddenKeywords: [],
  requiredKeywords: [],
  suggestedCTAs: ["Get Started", "Contact Us", "Learn More", "Get Quote"],
  websiteGoal: "Generate leads",
  industryLabel: "Business"
};

// Map business types to template packs
export const BUSINESS_TYPE_TEMPLATES: Record<BusinessType, TemplatePack> = {
  "Women's Boutique": RETAIL_TEMPLATE,
  "Fashion Retail": RETAIL_TEMPLATE,
  "Restaurant": RESTAURANT_TEMPLATE,
  "Cafe/Coffee Shop": RESTAURANT_TEMPLATE,
  "Salon/Spa": BEAUTY_TEMPLATE,
  "Med Spa": MEDICAL_TEMPLATE,
  "Dental": MEDICAL_TEMPLATE,
  "HVAC": HOME_SERVICES_TEMPLATE,
  "Plumbing": HOME_SERVICES_TEMPLATE,
  "Electrical": HOME_SERVICES_TEMPLATE,
  "Roofing": HOME_SERVICES_TEMPLATE,
  "Landscaping": HOME_SERVICES_TEMPLATE,
  "Pest Control": HOME_SERVICES_TEMPLATE,
  "Cleaning": HOME_SERVICES_TEMPLATE,
  "Fitness/Gym": FITNESS_TEMPLATE,
  "Photography": CREATIVE_TEMPLATE,
  "Real Estate": GENERIC_TEMPLATE,
  "Other": GENERIC_TEMPLATE,
};

// Get template pack for a business type
export function getTemplatePack(businessType: BusinessType): TemplatePack {
  return BUSINESS_TYPE_TEMPLATES[businessType] || GENERIC_TEMPLATE;
}

// Validate generated content against template guardrails
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateGeneratedContent(
  content: string,
  businessType: BusinessType
): ValidationResult {
  const template = getTemplatePack(businessType);
  const errors: string[] = [];
  const warnings: string[] = [];
  const contentLower = content.toLowerCase();

  // Check for forbidden keywords
  for (const keyword of template.forbiddenKeywords) {
    if (contentLower.includes(keyword.toLowerCase())) {
      errors.push(`Contains forbidden keyword for ${businessType}: "${keyword}"`);
    }
  }

  // Check for required keywords (at least one must be present)
  if (template.requiredKeywords.length > 0) {
    const hasRequiredKeyword = template.requiredKeywords.some(
      keyword => contentLower.includes(keyword.toLowerCase())
    );
    if (!hasRequiredKeyword) {
      warnings.push(
        `Missing expected keywords for ${businessType}. Expected at least one of: ${template.requiredKeywords.join(", ")}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Sanitize HTML content - remove HTML tags and clean up formatting
export function sanitizeContent(content: string): string {
  if (!content) return "";
  
  // Remove HTML tags
  let sanitized = content
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
    .replace(/<\/?ul[^>]*>/gi, "\n")
    .replace(/<\/?ol[^>]*>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, ""); // Remove any remaining tags
  
  // Clean up whitespace
  sanitized = sanitized
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  return sanitized;
}

// Check if content contains HTML tags (for validation/warning)
export function containsHtmlTags(content: string): boolean {
  return /<[^>]+>/.test(content);
}

// All available business types for the selector
export const BUSINESS_TYPES: BusinessType[] = [
  "Women's Boutique",
  "Fashion Retail",
  "Restaurant",
  "Cafe/Coffee Shop",
  "Salon/Spa",
  "Med Spa",
  "Dental",
  "HVAC",
  "Plumbing",
  "Electrical",
  "Roofing",
  "Landscaping",
  "Pest Control",
  "Cleaning",
  "Fitness/Gym",
  "Photography",
  "Real Estate",
  "Other",
];
