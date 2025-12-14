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
    // Return error message instead of generating a broken prompt
    return `ERROR: Cannot generate rebuild prompt.

The URL "${url}" appears to be a Lovable preview/deployment URL, not the original customer website.

REQUIRED ACTION:
1. Use the original customer domain URL (e.g., customersite.com)
2. Re-run the analysis on the original website
3. Generate the Implementation Pack from that analysis
4. Then generate this rebuild prompt

This guardrail prevents rebuilding from preview URLs that may contain placeholder content.`;
  }

  const services = plan.keyPages.servicesPage?.sections
    ?.map((s) => s.serviceName)
    .join(", ") || "various services";

  const prompt = `Build a modern, conversion-focused, mobile-first website for a local service business.

## Business Context
- Original website: ${url}
- Primary Services: ${services}
- Phone: ${plan.formsAndCTAs.primaryPhoneNumber}

## MANDATORY ABOVE-THE-FOLD ELEMENTS
These elements MUST appear above the fold on the homepage:

1. **H1 Headline**: "${plan.heroSection.headline}"
2. **Subheadline**: "${plan.heroSection.subheadline}"
3. **Service Area**: Display prominently (city/region served)
4. **Tap-to-Call Primary CTA**: "${plan.heroSection.primaryCTA}" with phone number ${plan.formsAndCTAs.primaryPhoneNumber}
5. **Secondary CTA**: "${plan.heroSection.secondaryCTA}"
6. **Short Lead Form** (max 4 fields): Name, Phone, Service Needed, [Optional: Message]

## Hero Section Details
- Key selling points (display as badges or bullets):
${plan.heroSection.supportingBullets.map((b) => `  - ${b}`).join("\n")}

## Page Structure & Content

### Homepage
${plan.keyPages.home.intro}

**Services Overview (3-5 cards with internal links)**:
${plan.keyPages.home.servicesOverview}

${plan.keyPages.servicesPage?.sections?.map((s) => `- **${s.serviceName}**: ${s.shortDescription} → Link to service page`).join("\n") || "- List all primary services with descriptions and CTAs"}

**"Why Choose Us" Trust Block**:
${plan.keyPages.home.whyChooseUs.map((item) => `- ${item}`).join("\n")}

**Reviews/Testimonials Block**:
${plan.keyPages.home.trustElements.map((item) => `- ${item}`).join("\n")}

[PLACEHOLDER: Add 3-5 real customer testimonials with names and locations]

**FAQ Section** (minimum 5 questions):
[PLACEHOLDER: Add industry-specific FAQs based on common customer questions]

### About Page
- Headline: "${plan.keyPages.aboutPage.headline}"
- Content: ${plan.keyPages.aboutPage.body}

### Contact Page
- Headline: "${plan.keyPages.contactPage.headline}"
- Intro: ${plan.keyPages.contactPage.body}

### Services Page
Include individual sections for each service:
${plan.keyPages.servicesPage?.sections?.map((s) => `- **${s.serviceName}**: ${s.shortDescription} (CTA: "${s.idealCTA}")`).join("\n") || "- List all primary services with detailed descriptions"}

## Conversion Elements
- **Prominent phone number** (tap-to-call): ${plan.formsAndCTAs.primaryPhoneNumber}
- **Contact form fields**: ${plan.formsAndCTAs.contactFormSpec.fields.join(", ")}
- **Form notes**: ${plan.formsAndCTAs.contactFormSpec.notes}
- **CTA buttons throughout**: ${plan.formsAndCTAs.ctaButtons.join(", ")}
- **Placement guidelines**: ${plan.formsAndCTAs.placementGuidelines.join("; ")}

## SEO Requirements
- **Title tag** (unique, under 60 chars): "${plan.seoSetup.home.title}"
- **Meta description** (under 160 chars): "${plan.seoSetup.home.metaDescription}"
- **H1** (one per page, keyword-rich): "${plan.seoSetup.home.h1}"
- **Additional SEO**: ${plan.seoSetup.otherSuggestions.join("; ")}
- **Image alt text**: Every image MUST have descriptive alt text

## LocalBusiness Schema (JSON-LD)
Add structured data to the homepage:
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "[PLACEHOLDER: Business Name]",
  "description": "${plan.seoSetup.home.metaDescription}",
  "telephone": "${plan.formsAndCTAs.primaryPhoneNumber}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[PLACEHOLDER: Street Address]",
    "addressLocality": "[PLACEHOLDER: City]",
    "addressRegion": "[PLACEHOLDER: State]",
    "postalCode": "[PLACEHOLDER: ZIP]"
  },
  "areaServed": "[PLACEHOLDER: Service Area]",
  "priceRange": "[PLACEHOLDER: $$ or $$$]"
}
\`\`\`

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
- Clear internal linking structure between pages

## POST-BUILD SELF-CHECK (Verify Before Publishing)
Run through this checklist after building:

□ H1 heading is present and contains main keyword + location
□ Phone number is visible above the fold and clickable (tap-to-call)
□ Lead form is present above the fold and submits correctly
□ All service cards link to relevant sections/pages
□ "Why Choose Us" section is visible on homepage
□ Testimonials section is present (even with placeholders)
□ FAQ section is present with at least 5 questions
□ LocalBusiness schema is in the page head
□ All images have descriptive alt text
□ Title tag is unique and under 60 characters
□ Meta description is under 160 characters
□ No authentication gate on homepage (publicly accessible)
□ Mobile responsive - test on 375px viewport
□ All CTAs have clear action text (not "Click Here")

Make this look like a premium $4000+ agency-built website, not a template.`;

  return prompt;
}