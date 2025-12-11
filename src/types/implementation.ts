export interface ImplementationPlan {
  heroSection: {
    headline: string;
    subheadline: string;
    supportingBullets: string[];
    primaryCTA: string;
    secondaryCTA: string;
  };
  keyPages: {
    home: {
      intro: string;
      servicesOverview: string;
      whyChooseUs: string[];
      trustElements: string[];
    };
    servicesPage: {
      sections: Array<{
        serviceName: string;
        shortDescription: string;
        idealCTA: string;
      }>;
    };
    aboutPage: {
      headline: string;
      body: string;
    };
    contactPage: {
      headline: string;
      body: string;
    };
  };
  formsAndCTAs: {
    primaryPhoneNumber: string;
    contactFormSpec: {
      fields: string[];
      notes: string;
    };
    ctaButtons: string[];
    placementGuidelines: string[];
  };
  seoSetup: {
    home: {
      title: string;
      metaDescription: string;
      h1: string;
    };
    otherSuggestions: string[];
    imageAltTextExamples: Array<{
      forImageType: string;
      altText: string;
    }>;
  };
  designAndLayout: {
    colorPaletteSuggestion: {
      primary: string;
      secondary: string;
      accent: string;
    };
    layoutChanges: string[];
  };
  technicalFixes: {
    tasks: string[];
    priorityOrder: string[];
  };
  executionChecklist: string[];
}
