import jsPDF from "jspdf";
import { ImplementationPlan } from "@/types/implementation";
import { isValidAnalysisSourceUrl, sanitizeAnalysisUrl } from "./urlValidation";
import { CREDIBILITY_STANDARD, CREDIBILITY_BODY, CREDIBILITY_FOOTER } from "@/components/scoring/ScoreCredibilityStatement";
import { generatePdfFilename, setPdfMetadata } from "./pdfMetadata";

// Branding options for white-label PDFs
export interface PdfBranding {
  logoUrl?: string | null;
  footerText?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
}

// Premium color palette (RGB values) - Consulting-grade aesthetic
const colors = {
  // Primary brand colors
  primary: [30, 64, 175], // Deep blue - authority
  primaryLight: [239, 246, 255], // Light blue background
  primaryDark: [23, 37, 84], // Navy
  primaryMid: [59, 130, 246], // Bright blue for accents
  
  // Success/positive colors
  success: [22, 163, 74], // Emerald green
  successLight: [240, 253, 244],
  successDark: [21, 128, 61],
  
  // Warning/attention colors
  warning: [217, 119, 6], // Amber
  warningLight: [254, 252, 232],
  
  // Accent colors
  accent: [124, 58, 237], // Violet
  accentLight: [245, 243, 255],
  
  // Text colors
  textPrimary: [15, 23, 42], // Slate 900 - Strong contrast
  textSecondary: [51, 65, 85], // Slate 700
  textMuted: [100, 116, 139], // Slate 500
  textLight: [148, 163, 184], // Slate 400
  
  // Backgrounds
  cardBg: [248, 250, 252], // Slate 50
  cardBgAlt: [241, 245, 249], // Slate 100
  border: [226, 232, 240], // Slate 200
  borderLight: [241, 245, 249], // Slate 100
  white: [255, 255, 255],
  
  // Premium gold accent
  gold: [180, 140, 50],
  goldLight: [255, 251, 235],
};

export function generateImplementationPdf(plan: ImplementationPlan, url: string, branding?: PdfBranding) {
  // GUARDRAIL: Validate that URL is not a Lovable/deployment URL
  const validatedUrl = isValidAnalysisSourceUrl(url) ? url : sanitizeAnalysisUrl(url, "Original website URL unavailable");
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let currentPage = 1;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > 270) {
      addFooter();
      doc.addPage();
      currentPage++;
      y = 25;
    }
  };

  // Determine if white-label mode is active (agency branding provided)
  const isWhiteLabel = Boolean(branding?.logoUrl || branding?.footerText);
  
  // Simplified footer - no repetitive credibility badge on every page
  // Credibility statement appears only once in the dedicated methodology section
  const addFooter = () => {
    // Subtle top line
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    
    // CONFIDENTIAL on left
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("CONFIDENTIAL", margin, pageHeight - 8);
    
    // Page number on right
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text(String(currentPage), pageWidth - margin, pageHeight - 8, { align: "right" });
  };

  // ============ COVER PAGE ============
  // Dark navy background for cover
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.rect(0, 0, pageWidth, pageHeight, "F");
  
  // Subtle gradient overlay at top
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 8, "F");
  
  // Brand logo - only shown if explicitly provided via branding prop
  const logoY = 35;
  if (branding?.logoUrl) {
    try {
      doc.addImage(branding.logoUrl, "PNG", margin, logoY, 40, 40);
    } catch (e) {
      // Logo failed to load - show URL as plain text instead
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text(validatedUrl, margin, logoY + 10);
    }
  } else {
    // No logo provided - show client URL as plain text
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    doc.text(validatedUrl, margin, logoY + 10);
  }
  
  // Main title
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Implementation", margin, 115);
  doc.text("Strategy Pack", margin, 130);
  
  // Accent line
  doc.setFillColor(colors.gold[0], colors.gold[1], colors.gold[2]);
  doc.rect(margin, 140, 60, 3, "F");
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.text("A Comprehensive Website Transformation Blueprint", margin, 155);
  doc.text("Based on Criteria-Driven Performance Analysis", margin, 165);
  
  // Property details card
  const cardY = 190;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, cardY, contentWidth, 50, 4, 4, "F");
  
  // Card content
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("ANALYZED PROPERTY", margin + 12, cardY + 15);
  
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  const displayUrl = validatedUrl.length > 55 ? validatedUrl.substring(0, 55) + "..." : validatedUrl;
  doc.text(displayUrl, margin + 12, cardY + 28);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(`Prepared: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 12, cardY + 40);
  
  // Confidential note
  doc.setFontSize(8);
  doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  doc.text("CONFIDENTIAL - Prepared for client review", margin, pageHeight - 25);
  
  // ============ PAGE 2: EXECUTIVE SUMMARY ============
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Page header bar
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 4, "F");
  
  // Executive Summary title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text("Executive Summary", margin, y + 10);
  
  // Accent underline
  doc.setFillColor(colors.gold[0], colors.gold[1], colors.gold[2]);
  doc.rect(margin, y + 15, 45, 2, "F");
  
  y = 55;
  
  // Summary intro paragraph
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const summaryIntro = "This Implementation Strategy Pack contains comprehensive, ready-to-apply recommendations designed to transform your website from its current state into a high-converting, trust-building digital asset. Every recommendation is based on proven conversion optimization principles and industry best practices.";
  const introLines = doc.splitTextToSize(summaryIntro, contentWidth);
  introLines.forEach((line: string, i: number) => {
    doc.text(line, margin, y + i * 6);
  });
  y += introLines.length * 6 + 12;
  
  // Three key sections in cards
  const summaryCards = [
    {
      title: "What Was Holding This Website Back",
      icon: "!",
      color: colors.warning,
      bgColor: colors.warningLight,
      points: [
        "Unclear value proposition failing to differentiate from competitors",
        "Missing trust signals reducing visitor confidence",
        "Weak call-to-action placement reducing conversion opportunities",
        "SEO gaps limiting organic visibility and traffic potential"
      ]
    },
    {
      title: "What This Strategy Changes",
      icon: "+",
      color: colors.success,
      bgColor: colors.successLight,
      points: [
        "Crystal-clear messaging that speaks directly to customer pain points",
        "Strategic CTA placement optimized for maximum engagement",
        "Trust elements positioned to build credibility at key decision moments",
        "SEO foundations designed for long-term organic growth"
      ]
    },
    {
      title: "Why This Matters for Your Business",
      icon: "$",
      color: colors.primary,
      bgColor: colors.primaryLight,
      points: [
        "Higher conversion rates from the same traffic volume",
        "Increased customer trust leading to faster buying decisions",
        "Better search visibility driving qualified organic leads",
        "Professional presence that justifies premium pricing"
      ]
    }
  ];
  
  summaryCards.forEach((card) => {
    addPageIfNeeded(55);
    
    // Card container
    doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
    doc.roundedRect(margin, y, contentWidth, 50, 4, 4, "F");
    
    // Left accent bar
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.roundedRect(margin, y, 4, 50, 2, 2, "F");
    
    // Icon circle
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.circle(margin + 16, y + 12, 6, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(card.icon, margin + 16, y + 14.5, { align: "center" });
    
    // Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(card.title, margin + 28, y + 14);
    
    // Points
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    card.points.forEach((point, i) => {
      const bulletY = y + 24 + i * 6;
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.circle(margin + 14, bulletY - 1.5, 1.5, "F");
      doc.text(point, margin + 20, bulletY);
    });
    
    y += 58;
  });
  
  // Value proposition box
  addPageIfNeeded(30);
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("THE BOTTOM LINE", margin + 12, y + 11);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const bottomLine = "Implement these recommendations to transform visitor uncertainty into customer confidence.";
  doc.text(bottomLine, margin + 12, y + 21);
  
  y += 40;
  addFooter();
  
  // ============ HELPER FUNCTIONS ============
  
  // Premium section header
  const addPremiumSectionHeader = (title: string, subtitle: string, iconLetter: string) => {
    addPageIfNeeded(45);
    
    // Section divider line
    if (y > 40) {
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, y - 8, pageWidth - margin, y - 8);
    }
    
    // Icon circle with letter
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 10, y + 8, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(iconLetter, margin + 10, y + 11, { align: "center" });
    
    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
    doc.text(title, margin + 24, y + 10);
    
    // Subtitle (why it matters)
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    const subLines = doc.splitTextToSize(subtitle, contentWidth - 30);
    subLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 24, y + 18 + i * 4);
    });
    
    y += 30 + (subLines.length - 1) * 4;
  };
  
  // Recommendation card with impact statement
  const addRecommendationCard = (label: string, content: string, impact?: string) => {
    doc.setFontSize(10);
    const contentLines = doc.splitTextToSize(content, contentWidth - 24);
    const impactLines = impact ? doc.splitTextToSize(impact, contentWidth - 30) : [];
    const blockHeight = 18 + contentLines.length * 5 + (impact ? 12 + impactLines.length * 4 : 0);
    addPageIfNeeded(blockHeight);
    
    // Card background
    doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, blockHeight, 3, 3, "FD");
    
    // Label badge
    doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
    doc.roundedRect(margin + 8, y + 6, 50, 8, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(label.toUpperCase(), margin + 12, y + 11);
    
    // Content
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    contentLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 12, y + 22 + i * 5);
    });
    
    // Impact statement
    if (impact) {
      const impactY = y + 22 + contentLines.length * 5 + 6;
      doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
      doc.roundedRect(margin + 8, impactY - 3, contentWidth - 16, 10 + impactLines.length * 4, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.text("BUSINESS IMPACT:", margin + 12, impactY + 3);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
      impactLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 50, impactY + 3 + i * 4);
      });
    }
    
    y += blockHeight + 6;
  };
  
  // CTA highlight card
  const addCTACard = (label: string, text: string) => {
    addPageIfNeeded(28);
    
    // Card with gradient-like effect
    doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
    doc.roundedRect(margin, y, contentWidth, 24, 4, 4, "F");
    
    // Left accent
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.roundedRect(margin, y, 5, 24, 2, 2, "F");
    
    // Arrow indicator
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 18, y + 12, 5, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(">", margin + 18, y + 14.5, { align: "center" });
    
    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(label.toUpperCase(), margin + 30, y + 8);
    
    // Text
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    const lines = doc.splitTextToSize(text, contentWidth - 45);
    doc.text(lines[0], margin + 30, y + 18);
    
    y += 30;
  };
  
  // Bullet item with context
  const addConsultantBullet = (text: string, bulletColor: number[] = colors.primary) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - 20);
    const blockHeight = lines.length * 5 + 4;
    addPageIfNeeded(blockHeight);
    
    // Bullet point
    doc.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
    doc.circle(margin + 6, y + 1, 2, "F");
    
    // Text
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    lines.forEach((line: string, i: number) => {
      doc.text(line, margin + 14, y + 3 + i * 5);
    });
    y += blockHeight;
  };
  
  // Priority numbered item
  const addPriorityItem = (num: number, text: string, isPriority: boolean = false) => {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, contentWidth - 26);
    const blockHeight = lines.length * 5 + 10;
    addPageIfNeeded(blockHeight);
    
    // Number badge
    const badgeColor = isPriority ? colors.warning : colors.primaryMid;
    doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    doc.circle(margin + 8, y + 5, 6, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(num.toString(), margin + 8, y + 7.5, { align: "center" });
    
    // Text
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    lines.forEach((line: string, i: number) => {
      doc.text(line, margin + 20, y + 6 + i * 5);
    });
    y += blockHeight;
  };
  
  // Service card with visual polish - FULL description rendering (no truncation)
  const addServiceCardPremium = (serviceName: string, description: string, cta: string) => {
    // Calculate actual height needed for full description
    doc.setFontSize(9);
    const descLines = doc.splitTextToSize(description, contentWidth - 24);
    const descHeight = descLines.length * 5;
    const cardHeight = Math.max(46, 24 + descHeight + 16); // 24 for name, 16 for CTA section
    
    addPageIfNeeded(cardHeight + 8);
    
    // Card with shadow effect (multiple rectangles)
    doc.setFillColor(colors.cardBgAlt[0], colors.cardBgAlt[1], colors.cardBgAlt[2]);
    doc.roundedRect(margin + 1, y + 1, contentWidth, cardHeight, 4, 4, "F");
    doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 4, 4, "FD");
    
    // Service name
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(serviceName, margin + 12, y + 12);
    
    // Description - render ALL lines (no truncation)
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    descLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 12, y + 21 + i * 5);
    });
    
    // CTA recommendation badge - positioned after description
    const ctaY = y + 21 + descHeight + 4;
    doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
    doc.roundedRect(margin + 12, ctaY, 70, 8, 2, 2, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.text("RECOMMENDED CTA: " + cta, margin + 15, ctaY + 5);
    
    y += cardHeight + 8;
  };
  
  // ============ PAGE 3+: DETAILED RECOMMENDATIONS ============
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Page header
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 4, "F");
  
  // ============ HERO SECTION ============
  addPremiumSectionHeader(
    "Hero Section Strategy",
    "Your hero section is the first impression visitors get. These recommendations are designed to immediately communicate value and drive action.",
    "1"
  );
  
  addRecommendationCard(
    "Primary Headline",
    plan.heroSection.headline,
    "Clear headlines increase visitor engagement by establishing immediate relevance."
  );
  
  addRecommendationCard(
    "Supporting Subheadline",
    plan.heroSection.subheadline,
    "Subheadlines reduce bounce rates by providing essential context."
  );
  
  // Supporting bullets section
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Value Proposition Bullets", margin + 4, y);
  y += 8;
  
  plan.heroSection.supportingBullets.forEach((bullet) => {
    addConsultantBullet(bullet, colors.success);
  });
  y += 8;
  
  addCTACard("Primary Call-to-Action", plan.heroSection.primaryCTA);
  addCTACard("Secondary Call-to-Action", plan.heroSection.secondaryCTA);
  y += 8;
  
  // ============ KEY PAGES COPY ============
  addPremiumSectionHeader(
    "Key Pages Content Strategy",
    "Strategic messaging across your core pages creates a cohesive journey that builds trust and guides visitors toward conversion.",
    "2"
  );
  
  // Homepage
  addPageIfNeeded(15);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Homepage", margin + 4, y);
  y += 8;
  
  addRecommendationCard("Introduction Copy", plan.keyPages.home.intro);
  addRecommendationCard("Services Overview", plan.keyPages.home.servicesOverview);
  
  // Why Choose Us
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Differentiators (Why Choose Us)", margin + 4, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("These points address customer objections and build competitive advantage", margin + 4, y + 6);
  y += 14;
  
  plan.keyPages.home.whyChooseUs.forEach((item) => {
    addConsultantBullet(item, colors.success);
  });
  y += 6;
  
  // Trust Elements
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Trust Elements", margin + 4, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Strategic credibility signals that reduce buyer hesitation", margin + 4, y + 6);
  y += 14;
  
  plan.keyPages.home.trustElements.forEach((item) => {
    addConsultantBullet(item, colors.warning);
  });
  y += 10;
  
  // Services Page
  if (plan.keyPages.servicesPage.sections.length > 0) {
    addPageIfNeeded(15);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text("Services Page", margin + 4, y);
    y += 10;
    
    plan.keyPages.servicesPage.sections.forEach((service) => {
      addServiceCardPremium(service.serviceName, service.shortDescription, service.idealCTA);
    });
  }
  
  // About Page
  addPageIfNeeded(15);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("About Page", margin + 4, y);
  y += 8;
  
  addRecommendationCard("About Headline", plan.keyPages.aboutPage.headline);
  addRecommendationCard("About Body Copy", plan.keyPages.aboutPage.body, "Humanized brand storytelling builds emotional connection and trust.");
  
  // Contact Page
  addPageIfNeeded(15);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Contact Page", margin + 4, y);
  y += 8;
  
  addRecommendationCard("Contact Headline", plan.keyPages.contactPage.headline);
  addRecommendationCard("Contact Body Copy", plan.keyPages.contactPage.body);
  y += 8;
  
  // ============ FORMS & CTAS ============
  addPremiumSectionHeader(
    "Conversion Architecture",
    "Strategic form design and CTA placement directly impact lead generation. These specifications are optimized for maximum conversion.",
    "3"
  );
  
  // Phone number highlight
  addPageIfNeeded(32);
  doc.setFillColor(colors.warningLight[0], colors.warningLight[1], colors.warningLight[2]);
  doc.roundedRect(margin, y, contentWidth, 28, 4, 4, "F");
  doc.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.roundedRect(margin, y, 5, 28, 2, 2, "F");
  
  // Phone icon
  doc.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.circle(margin + 18, y + 14, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("P", margin + 18, y + 16.5, { align: "center" });
  
  doc.setFontSize(8);
  doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CLICK-TO-CALL PHONE NUMBER", margin + 30, y + 10);
  
  doc.setFontSize(16);
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(plan.formsAndCTAs.primaryPhoneNumber, margin + 30, y + 22);
  y += 36;
  
  // Form fields
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Contact Form Specification", margin + 4, y);
  y += 8;
  
  addRecommendationCard("Required Fields", plan.formsAndCTAs.contactFormSpec.fields.join("  |  "));
  addRecommendationCard("Form Notes", plan.formsAndCTAs.contactFormSpec.notes, "Simplified forms reduce friction and increase submission rates.");
  
  // CTA Buttons
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Recommended CTA Button Copy", margin + 4, y);
  y += 8;
  
  plan.formsAndCTAs.ctaButtons.forEach((cta) => {
    addConsultantBullet(cta, colors.accent);
  });
  y += 6;
  
  // Placement Guidelines
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Strategic CTA Placement Guidelines", margin + 4, y);
  y += 8;
  
  plan.formsAndCTAs.placementGuidelines.forEach((guide) => {
    addConsultantBullet(guide);
  });
  y += 10;
  
  // ============ SEO SETUP ============
  addPremiumSectionHeader(
    "Search Visibility Foundation",
    "These SEO specifications establish the technical foundation for organic search performance and local visibility.",
    "4"
  );
  
  addRecommendationCard("Homepage Title Tag", plan.seoSetup.home.title, "Optimized title tags improve click-through rates from search results.");
  addRecommendationCard("Homepage Meta Description", plan.seoSetup.home.metaDescription);
  addRecommendationCard("Homepage H1 Tag", plan.seoSetup.home.h1);
  
  // Other SEO suggestions
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Additional SEO Recommendations", margin + 4, y);
  y += 8;
  
  plan.seoSetup.otherSuggestions.forEach((sug) => {
    addConsultantBullet(sug, colors.success);
  });
  y += 6;
  
  // Image alt text
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Image Alt Text Examples", margin + 4, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Descriptive alt text improves accessibility and image search rankings", margin + 4, y + 6);
  y += 14;
  
  plan.seoSetup.imageAltTextExamples.forEach((ex) => {
    // Calculate height for full alt text (no truncation)
    doc.setFontSize(8);
    const altTextValue = 'alt="' + (ex.altText ?? '') + '"';
    const altLines = doc.splitTextToSize(altTextValue, contentWidth - 16);
    const cardHeight = 18 + altLines.length * 4;
    
    addPageIfNeeded(cardHeight + 4);
    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.roundedRect(margin, y - 2, contentWidth, cardHeight, 2, 2, "F");
    
    // Image type label
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(ex.forImageType + ":", margin + 8, y + 6);
    
    // Alt text - render ALL lines with word wrap using Helvetica (not Courier for better embedding)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    altLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 8, y + 14 + i * 4);
    });
    
    y += cardHeight + 4;
  });
  y += 8;
  
  // ============ DESIGN & LAYOUT ============
  addPremiumSectionHeader(
    "Visual Design Recommendations",
    "Strategic design choices influence perception of professionalism and trustworthiness. These recommendations align visual presentation with business goals.",
    "5"
  );
  
  // Color palette
  addPageIfNeeded(45);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Recommended Color Palette", margin + 4, y);
  y += 10;
  
  // Color swatches - vertical stacking layout (no truncation)
  const colorValues = [
    { label: "Primary", value: plan.designAndLayout.colorPaletteSuggestion.primary },
    { label: "Secondary", value: plan.designAndLayout.colorPaletteSuggestion.secondary },
    { label: "Accent", value: plan.designAndLayout.colorPaletteSuggestion.accent },
  ];
  
  colorValues.forEach((color, i) => {
    addPageIfNeeded(38);
    
    // Parse hex and description from value (format: "#HEXCODE - Description")
    const parts = color.value.split(" - ");
    const hexCode = parts[0] || color.value;
    const description = parts[1] || "";
    
    // Card background
    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.roundedRect(margin, y, contentWidth, 32, 3, 3, "F");
    
    // Color circle (placeholder - actual hex would need parsing)
    doc.setFillColor(colors.primaryMid[0], colors.primaryMid[1], colors.primaryMid[2]);
    doc.circle(margin + 18, y + 16, 10, "F");
    
    // Label
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(color.label.toUpperCase(), margin + 35, y + 10);
    
    // Hex code
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(hexCode, margin + 35, y + 19);
    
    // Description - full text (no truncation)
    if (description) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(description, margin + 35, y + 27);
    }
    
    y += 38;
  });
  
  // Layout changes
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Layout Improvements", margin + 4, y);
  y += 8;
  
  plan.designAndLayout.layoutChanges.forEach((change) => {
    addConsultantBullet(change);
  });
  y += 10;
  
  // ============ TECHNICAL FIXES ============
  addPremiumSectionHeader(
    "Technical Implementation Tasks",
    "These technical improvements address performance, security, and functionality issues that impact user experience and search rankings.",
    "6"
  );
  
  // Tasks
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Required Technical Tasks", margin + 4, y);
  y += 8;
  
  plan.technicalFixes.tasks.forEach((task) => {
    addConsultantBullet(task, colors.warning);
  });
  y += 6;
  
  // Priority order
  addPageIfNeeded(15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Implementation Priority Order", margin + 4, y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Address these items in sequence for optimal results", margin + 4, y + 6);
  y += 14;
  
  plan.technicalFixes.priorityOrder.forEach((priority, i) => {
    addPriorityItem(i + 1, priority, true);
  });
  y += 10;
  
  // ============ EXECUTION CHECKLIST ============
  addPremiumSectionHeader(
    "Execution Checklist",
    "A complete action item list to ensure systematic implementation of all recommendations.",
    "7"
  );
  
  // Checklist summary card
  addPageIfNeeded(24);
  doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
  doc.roundedRect(margin, y, contentWidth, 20, 4, 4, "F");
  doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.roundedRect(margin, y, 5, 20, 2, 2, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.text(`${plan.executionChecklist.length} Action Items`, margin + 14, y + 13);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
  doc.text("Complete these items to fully implement this strategy", margin + 65, y + 13);
  y += 28;
  
  plan.executionChecklist.forEach((item, i) => {
    addPriorityItem(i + 1, item);
  });
  y += 10;
  
  // ============ WHAT THIS UNLOCKS SECTION ============
  addPageIfNeeded(100);
  
  // Full-width accent band
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.rect(0, y - 5, pageWidth, 80, "F");
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("What These Improvements Unlock", margin, y + 12);
  
  doc.setFillColor(colors.gold[0], colors.gold[1], colors.gold[2]);
  doc.rect(margin, y + 17, 50, 2, "F");
  
  const unlockPoints = [
    "Reduced friction: Visitors find what they need faster and convert more easily",
    "Increased confidence: Professional presentation justifies premium pricing",
    "Higher conversion likelihood: Strategic CTAs capture leads at decision moments",
    "Better first impressions: Clear messaging establishes expertise in seconds",
    "Long-term organic growth: SEO foundation compounds visibility over time"
  ];
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(255, 255, 255);
  
  unlockPoints.forEach((point, i) => {
    const pointY = y + 28 + i * 10;
    doc.setFillColor(colors.gold[0], colors.gold[1], colors.gold[2]);
    doc.circle(margin + 6, pointY - 1, 2, "F");
    doc.text(point, margin + 14, pointY);
  });
  
  y += 90;
  
  // ============ SCORE CREDIBILITY STATEMENT ============
  addPageIfNeeded(70);
  
  // Section header
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 4, 4, "F");
  
  // Shield icon
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.circle(margin + 15, y + 11, 7, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("S", margin + 15, y + 14, { align: "center" }); // S for Shield
  
  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text(CREDIBILITY_STANDARD.intro, margin + 28, y + 14);
  y += 30;
  
  // Body text - the canonical credibility statement
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const credBodyLines = doc.splitTextToSize(CREDIBILITY_BODY, contentWidth - 10);
  credBodyLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 5, y + i * 5);
  });
  y += credBodyLines.length * 5 + 12;
  
  // Footer card
  addPageIfNeeded(22);
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  const credFooterLines = doc.splitTextToSize(CREDIBILITY_FOOTER, contentWidth - 20);
  const credFooterHeight = credFooterLines.length * 5 + 14;
  doc.roundedRect(margin, y, contentWidth, credFooterHeight, 4, 4, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  credFooterLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 10, y + 10 + i * 5);
  });
  y += credFooterHeight + 15;
  
  // NOT SCORABLE explanation
  addPageIfNeeded(35);
  doc.setFillColor(colors.warningLight[0], colors.warningLight[1], colors.warningLight[2]);
  doc.roundedRect(margin, y, contentWidth, 30, 4, 4, "F");
  doc.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.roundedRect(margin, y, 5, 30, 2, 2, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.text("ABOUT NOT SCORABLE RESULTS", margin + 12, y + 10);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const notScorableText = "NOT SCORABLE is not a negative score. It indicates access or rendering limitations at the time of analysis. This ensures scores represent genuine performance, not guesswork.";
  const notScorableLines = doc.splitTextToSize(notScorableText, contentWidth - 20);
  notScorableLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 12, y + 18 + i * 4);
  });
  y += 40;
  
  // NOTE: Lovable Website Rebuild Prompts removed from PDF
  // The prompt is available in the UI only, not in client-facing PDF exports
  
  // ============ FINAL FOOTER ============
  addFooter();
  
  // Set PDF metadata for white-label support
  const metadataOptions = {
    clientDomain: validatedUrl,
    agencyName: branding?.footerText || undefined,
    isWhiteLabel,
    reportType: "implementation" as const,
  };
  setPdfMetadata(doc, metadataOptions);
  
  // Generate white-label friendly filename
  const filename = generatePdfFilename(metadataOptions);
  doc.save(filename);
}
