import { ImplementationPlan } from "@/types/implementation";
import { isValidAnalysisSourceUrl, sanitizeAnalysisUrl } from "./urlValidation";

/**
 * Generates a comprehensive Lovable rebuild prompt from an Implementation Pack
 * This prompt can be copy-pasted directly into Lovable to rebuild a website
 * 
 * CRITICAL: The URL must be the original analyzed customer domain, never a Lovable
 * preview URL or deployment URL. This function validates and sanitizes the URL.
 */
export function generateLovableRebuildPrompt(plan: ImplementationPlan, url: string): string {
  // GUARDRAIL: Validate that URL is not a Lovable/deployment URL
  if (!isValidAnalysisSourceUrl(url)) {
    console.error("[Lovable Prompt] BLOCKED: Attempted to use contaminated URL:", url);
    // Use sanitized fallback - this will show an error message instead of wrong URL
    url = sanitizeAnalysisUrl(url, "[ERROR: Original website URL not available - do not use this prompt]");
  }
  const services = plan.keyPages.servicesPage?.sections
    ?.map((s) => s.serviceName)
    .join(", ") || "various services";

  const prompt = `Build a modern, conversion-focused, mobile-first website for a local service business.

## Business Context
- Original website: ${url}
- Primary Services: ${services}
- Phone: ${plan.formsAndCTAs.primaryPhoneNumber}

## Hero Section
Create a compelling hero with:
- Headline: "${plan.heroSection.headline}"
- Subheadline: "${plan.heroSection.subheadline}"
- Key selling points: ${plan.heroSection.supportingBullets.join("; ")}
- Primary CTA button: "${plan.heroSection.primaryCTA}"
- Secondary CTA: "${plan.heroSection.secondaryCTA}"

## Page Structure & Content

### Homepage
${plan.keyPages.home.intro}

Services overview: ${plan.keyPages.home.servicesOverview}

"Why Choose Us" section with these points:
${plan.keyPages.home.whyChooseUs.map((item) => `- ${item}`).join("\n")}

Trust elements to include:
${plan.keyPages.home.trustElements.map((item) => `- ${item}`).join("\n")}

### About Page
- Headline: "${plan.keyPages.aboutPage.headline}"
- Content: ${plan.keyPages.aboutPage.body}

### Contact Page
- Headline: "${plan.keyPages.contactPage.headline}"
- Intro: ${plan.keyPages.contactPage.body}

### Services Page
Include sections for:
${plan.keyPages.servicesPage?.sections?.map((s) => `- ${s.serviceName}: ${s.shortDescription} (CTA: "${s.idealCTA}")`).join("\n") || "- List all primary services with descriptions and CTAs"}

## Conversion Elements
- Prominent phone number: ${plan.formsAndCTAs.primaryPhoneNumber}
- Contact form fields: ${plan.formsAndCTAs.contactFormSpec.fields.join(", ")}
- Form notes: ${plan.formsAndCTAs.contactFormSpec.notes}
- CTA buttons throughout: ${plan.formsAndCTAs.ctaButtons.join(", ")}
- Placement: ${plan.formsAndCTAs.placementGuidelines.join("; ")}

## SEO Requirements
- Title tag: "${plan.seoSetup.home.title}"
- Meta description: "${plan.seoSetup.home.metaDescription}"
- H1: "${plan.seoSetup.home.h1}"
- Additional SEO: ${plan.seoSetup.otherSuggestions.join("; ")}

## Design & UX
Color palette:
- Primary: ${plan.designAndLayout.colorPaletteSuggestion.primary}
- Secondary: ${plan.designAndLayout.colorPaletteSuggestion.secondary}
- Accent: ${plan.designAndLayout.colorPaletteSuggestion.accent}

Layout requirements:
${plan.designAndLayout.layoutChanges.map((c) => `- ${c}`).join("\n")}

## Technical Requirements
${plan.technicalFixes.tasks.map((t) => `- ${t}`).join("\n")}

## Design Principles
- Mobile-first responsive design (375-430px primary breakpoint)
- Fast loading with lazy-loaded images
- Accessible with proper contrast and semantic HTML
- Modern, clean aesthetic with professional imagery placeholders
- Smooth animations and micro-interactions
- Sticky header with CTA
- Trust badges and social proof sections
- Clear visual hierarchy

Make this look like a premium $4000+ agency-built website, not a template.`;

  return prompt;
}
