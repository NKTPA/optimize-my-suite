export interface BlueprintFormData {
  businessName: string;
  industry: string;
  location: string;
  primaryServices: string;
  targetCustomers: string;
  uniqueSellingPoints: string;
  brandVoice: "Friendly" | "Professional" | "Luxury" | "High-energy";
  mainPhone: string;
  contactEmail: string;
  specialOffer: string;
  websiteGoal: string;
}

export interface BlueprintHero {
  headline: string;
  subheadline: string;
  bullets: string[];
  primaryCTA: string;
  secondaryCTA: string;
  offerBadge?: string;
}

export interface BlueprintPage {
  title: string;
  seoTitle: string;
  metaDescription: string;
  sections: {
    name: string;
    content: string;
  }[];
}

export interface WebsiteBlueprint {
  hero: BlueprintHero;
  navigation: string[];
  pages: {
    home: BlueprintPage;
    services: BlueprintPage;
    about: BlueprintPage;
    gallery: BlueprintPage;
    faq: BlueprintPage;
    contact: BlueprintPage;
  };
  technical: {
    layout: string;
    performance: string[];
    accessibility: string[];
  };
}
