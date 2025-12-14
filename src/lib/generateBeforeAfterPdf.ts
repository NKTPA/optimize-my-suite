import jsPDF from "jspdf";
import { AnalysisResult, isNotScorable, detectLovablePlaceholder } from "@/types/analysis";
import { CREDIBILITY_BODY, CREDIBILITY_FOOTER } from "@/components/scoring/ScoreCredibilityStatement";

export interface BeforeAfterPdfBranding {
  logoUrl?: string | null;
  footerText?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
}

export interface BeforeAfterPdfData {
  originalUrl: string;
  optimizedUrl: string;
  originalResults: AnalysisResult;
  optimizedResults: AnalysisResult;
  agencyName?: string;
  clientName?: string;
  branding?: BeforeAfterPdfBranding;
}

// Premium executive color palette (RGB values)
const colors = {
  // Primary brand - deep sophisticated blue
  primary: [30, 58, 138] as const,
  primaryLight: [239, 246, 255] as const,
  primaryDark: [23, 37, 84] as const,
  
  // Success - confident green
  success: [16, 185, 129] as const,
  successLight: [209, 250, 229] as const,
  successDark: [5, 150, 105] as const,
  successVibrant: [34, 197, 94] as const,
  
  // Before - muted slate
  beforeBg: [241, 245, 249] as const,
  beforeAccent: [100, 116, 139] as const,
  beforeText: [71, 85, 105] as const,
  
  // After - vibrant success
  afterBg: [209, 250, 229] as const,
  afterAccent: [16, 185, 129] as const,
  
  // Neutral palette
  white: [255, 255, 255] as const,
  neutral50: [248, 250, 252] as const,
  neutral100: [241, 245, 249] as const,
  neutral200: [226, 232, 240] as const,
  neutral300: [203, 213, 225] as const,
  neutral400: [148, 163, 184] as const,
  neutral500: [100, 116, 139] as const,
  neutral600: [71, 85, 105] as const,
  neutral700: [51, 65, 85] as const,
  neutral800: [30, 41, 59] as const,
  neutral900: [15, 23, 42] as const,
  
  // Text hierarchy
  textPrimary: [15, 23, 42] as const,
  textSecondary: [51, 65, 85] as const,
  textMuted: [100, 116, 139] as const,
  
  // Amber for NOT SCORABLE
  amber: [180, 83, 9] as const,
  amberLight: [254, 243, 199] as const,
  
  // Gradients (simulated with solid)
  heroGradientStart: [5, 150, 105] as const,
  heroGradientEnd: [16, 185, 129] as const,
};

// Check if result is NOT SCORABLE
function getNotScorableStatus(results: AnalysisResult): { notScorable: boolean; reason: string } {
  if (isNotScorable(results)) {
    const reasonMap: Record<string, string> = {
      auth_gate: "Authentication required",
      insufficient_html: "Insufficient content",
      blocked_fetch: "Access blocked",
      redirect_loop: "Redirect loop",
      placeholder_page: "Placeholder page",
      js_only_shell: "JavaScript-only",
      login_required: "Login required",
    };
    return { 
      notScorable: true, 
      reason: reasonMap[results.notScorable?.reason || ""] || "Could not be evaluated"
    };
  }
  
  if (detectLovablePlaceholder(results)) {
    return { notScorable: true, reason: "Preview environment" };
  }
  
  return { notScorable: false, reason: "" };
}

// Generate business-outcome-focused category impacts
function generateCategoryImpact(category: string, delta: number): { improvement: string; outcome: string } | null {
  if (delta < 3) return null;
  
  const impacts: Record<string, { improvement: string; outcome: string }> = {
    "Messaging": {
      improvement: "Clearer value proposition",
      outcome: "Better first impressions, lower bounce rate"
    },
    "Conversion": {
      improvement: "Stronger CTAs and forms",
      outcome: "More leads and customer inquiries"
    },
    "Design & UX": {
      improvement: "Polished visual experience",
      outcome: "Longer visit duration, more engagement"
    },
    "SEO": {
      improvement: "Optimized for search",
      outcome: "Higher visibility, more organic traffic"
    },
    "Performance": {
      improvement: "Faster load times",
      outcome: "Better user experience, less abandonment"
    },
    "Trust": {
      improvement: "Added credibility signals",
      outcome: "Higher confidence, more conversions"
    },
    "Mobile": {
      improvement: "Mobile-optimized layout",
      outcome: "Better mobile user experience"
    }
  };
  
  return impacts[category] || null;
}

// Get qualitative description for a category
function getCategoryQualitativeDescription(category: string, score: number | undefined, isNotScorable: boolean): string {
  if (isNotScorable || score === undefined) return "Not evaluated";
  
  const descriptions: Record<string, { low: string; mid: string; high: string }> = {
    "Messaging": { low: "Unclear", mid: "Basic", high: "Clear & focused" },
    "Conversion": { low: "Weak", mid: "Basic CTAs", high: "Optimized" },
    "Design & UX": { low: "Dated", mid: "Functional", high: "Polished" },
    "SEO": { low: "Poor", mid: "Basic", high: "Search-ready" },
    "Performance": { low: "Slow", mid: "Average", high: "Fast" },
    "Trust": { low: "Minimal", mid: "Some", high: "Strong" },
    "Mobile": { low: "Poor", mid: "Usable", high: "Optimized" }
  };
  
  const desc = descriptions[category] || { low: "Weak", mid: "OK", high: "Strong" };
  
  if (score < 40) return desc.low;
  if (score < 70) return desc.mid;
  return desc.high;
}

// Get section data sorted by delta (largest improvement first)
function getSortedSections(
  original: AnalysisResult, 
  optimized: AnalysisResult,
  originalStatus: { notScorable: boolean },
  optimizedStatus: { notScorable: boolean }
) {
  const sections = [
    { name: "Messaging", beforeScore: original.messaging?.score, afterScore: optimized.messaging?.score },
    { name: "Conversion", beforeScore: original.conversion?.score, afterScore: optimized.conversion?.score },
    { name: "Design & UX", beforeScore: original.designUx?.score, afterScore: optimized.designUx?.score },
    { name: "SEO", beforeScore: original.seo?.score, afterScore: optimized.seo?.score },
    { name: "Performance", beforeScore: original.performance?.score, afterScore: optimized.performance?.score },
    { name: "Trust", beforeScore: original.trust?.score, afterScore: optimized.trust?.score },
  ];
  
  return sections
    .map(s => {
      const beforeNotScorable = originalStatus.notScorable || s.beforeScore === undefined;
      const afterNotScorable = optimizedStatus.notScorable || s.afterScore === undefined;
      const delta = (!beforeNotScorable && !afterNotScorable) ? (s.afterScore! - s.beforeScore!) : 0;
      return { ...s, delta, beforeNotScorable, afterNotScorable };
    })
    .sort((a, b) => b.delta - a.delta);
}

// Helper to draw text with proper bounds checking
function drawText(
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  options?: { align?: "left" | "center" | "right"; maxWidth?: number }
) {
  const align = options?.align || "left";
  const maxWidth = options?.maxWidth;
  
  let displayText = text;
  if (maxWidth) {
    const textWidth = doc.getTextWidth(text);
    if (textWidth > maxWidth) {
      // Truncate with ellipsis
      let truncated = text;
      while (doc.getTextWidth(truncated + "...") > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      displayText = truncated + "...";
    }
  }
  
  doc.text(displayText, x, y, { align });
}

// Truncate URL for display
function truncateUrl(url: string, maxLength: number): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
}

export function generateBeforeAfterPdf(data: BeforeAfterPdfData) {
  const { originalUrl, optimizedUrl, originalResults, optimizedResults, agencyName, clientName, branding } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;
  let currentPage = 1;

  const originalStatus = getNotScorableStatus(originalResults);
  const optimizedStatus = getNotScorableStatus(optimizedResults);
  const canCompare = !originalStatus.notScorable && !optimizedStatus.notScorable;
  
  const overallDelta = canCompare 
    ? optimizedResults.summary.overallScore - originalResults.summary.overallScore 
    : 0;

  // Credibility badge text (always shown for methodology transparency)
  const CREDIBILITY_BADGE = "Objective, criteria-based scoring. No manual adjustments. Same methodology before and after.";
  
  // Determine if white-label mode is active (agency branding provided)
  const isWhiteLabel = Boolean(branding?.logoUrl || branding?.footerText || agencyName);

  // Professional footer
  const addFooter = () => {
    const footerY = pageHeight - 12;
    
    // Credibility badge line (above main footer)
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textMuted);
    doc.text(CREDIBILITY_BADGE, pageWidth / 2, footerY - 10, { align: "center" });
    
    doc.setDrawColor(...colors.neutral200);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textMuted);
    
    // Footer text - white-label logic
    const footerText = branding?.footerText 
      ? branding.footerText 
      : (isWhiteLabel ? "" : "OptimizeMySuite");
    if (footerText) {
      doc.text(footerText, margin, footerY);
    }
    
    const dateStr = new Date().toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
    doc.text(dateStr, pageWidth / 2, footerY, { align: "center" });
    doc.text(`${currentPage}`, pageWidth - margin, footerY, { align: "right" });
  };

  // ════════════════════════════════════════════════════════════════
  // PAGE 1: EXECUTIVE COVER
  // ════════════════════════════════════════════════════════════════
  
  // Subtle header accent line
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 4, "F");
  
  y = 50;
  
  // Main headline
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textPrimary);
  doc.text("Website Performance", pageWidth / 2, y, { align: "center" });
  
  doc.setFontSize(32);
  doc.text("Transformation", pageWidth / 2, y + 12, { align: "center" });
  
  // Subtitle
  y += 30;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textMuted);
  doc.text("Objective improvement measured using consistent scoring criteria", pageWidth / 2, y, { align: "center" });
  
  y += 30;
  
  // ═══════ HERO SCORE COMPARISON ═══════
  if (canCompare) {
    const beforeScore = originalResults.summary.overallScore;
    const afterScore = optimizedResults.summary.overallScore;
    
    // Score comparison layout
    const boxWidth = 70;
    const boxHeight = 80;
    const spacing = 25;
    const startX = (pageWidth - (boxWidth * 2 + spacing)) / 2;
    
    // BEFORE score box
    doc.setFillColor(...colors.beforeBg);
    doc.roundedRect(startX, y, boxWidth, boxHeight, 8, 8, "F");
    doc.setDrawColor(...colors.neutral300);
    doc.setLineWidth(1);
    doc.roundedRect(startX, y, boxWidth, boxHeight, 8, 8, "S");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.beforeText);
    doc.text("BEFORE", startX + boxWidth / 2, y + 18, { align: "center" });
    
    doc.setFontSize(42);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.neutral500);
    doc.text(beforeScore.toString(), startX + boxWidth / 2, y + 55, { align: "center" });
    
    // AFTER score box
    const afterX = startX + boxWidth + spacing;
    doc.setFillColor(...colors.afterBg);
    doc.roundedRect(afterX, y, boxWidth, boxHeight, 8, 8, "F");
    doc.setDrawColor(...colors.success);
    doc.setLineWidth(2);
    doc.roundedRect(afterX, y, boxWidth, boxHeight, 8, 8, "S");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.successDark);
    doc.text("AFTER", afterX + boxWidth / 2, y + 18, { align: "center" });
    
    doc.setFontSize(42);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.successDark);
    doc.text(afterScore.toString(), afterX + boxWidth / 2, y + 55, { align: "center" });
    
    y += boxHeight + 15;
    
    // Delta badge - the hero element
    const deltaSign = overallDelta > 0 ? "+" : "";
    const deltaBadgeWidth = 140;
    const deltaBadgeHeight = 40;
    const deltaBadgeX = (pageWidth - deltaBadgeWidth) / 2;
    
    doc.setFillColor(...colors.success);
    doc.roundedRect(deltaBadgeX, y, deltaBadgeWidth, deltaBadgeHeight, 8, 8, "F");
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${deltaSign}${overallDelta} POINT IMPROVEMENT`, pageWidth / 2, y + 26, { align: "center" });
    
    y += deltaBadgeHeight + 20;
    
  } else {
    // Cannot compare - amber notice
    doc.setFillColor(...colors.amberLight);
    doc.roundedRect(margin + 20, y, contentWidth - 40, 50, 8, 8, "F");
    doc.setDrawColor(...colors.amber);
    doc.setLineWidth(1);
    doc.roundedRect(margin + 20, y, contentWidth - 40, 50, 8, 8, "S");
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.amber);
    doc.text("Comparison Limited", pageWidth / 2, y + 22, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.neutral600);
    doc.text("One or both pages could not be evaluated", pageWidth / 2, y + 38, { align: "center" });
    
    y += 70;
  }
  
  // ═══════ URL SECTION ═══════
  const urlSectionPadding = 15;
  const urlBoxHeight = 30;
  
  // Before URL
  doc.setFillColor(...colors.neutral100);
  doc.roundedRect(margin, y, contentWidth, urlBoxHeight, 6, 6, "F");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.beforeText);
  doc.text("ORIGINAL WEBSITE", margin + 12, y + 12);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textSecondary);
  drawText(doc, originalUrl, margin + 12, y + 22, { maxWidth: contentWidth - 24 });
  
  y += urlBoxHeight + 8;
  
  // After URL
  doc.setFillColor(...colors.successLight);
  doc.roundedRect(margin, y, contentWidth, urlBoxHeight, 6, 6, "F");
  doc.setDrawColor(...colors.success);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, y, contentWidth, urlBoxHeight, 6, 6, "S");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.successDark);
  doc.text("OPTIMIZED WEBSITE", margin + 12, y + 12);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textSecondary);
  drawText(doc, optimizedUrl, margin + 12, y + 22, { maxWidth: contentWidth - 24 });
  
  y += urlBoxHeight + 20;
  
  // Credibility line
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textMuted);
  doc.text("Same methodology  •  No manual adjustments  •  Measurable results", pageWidth / 2, y, { align: "center" });
  
  // Client info
  if (clientName || agencyName) {
    y += 20;
    if (clientName) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.textSecondary);
      doc.text(`Prepared for: ${clientName}`, pageWidth / 2, y, { align: "center" });
      y += 12;
    }
    if (agencyName) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...colors.textMuted);
      doc.text(`By: ${agencyName}`, pageWidth / 2, y, { align: "center" });
    }
  }
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 2: CATEGORY IMPROVEMENTS
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  
  // Header accent
  doc.setFillColor(...colors.success);
  doc.rect(0, 0, pageWidth, 4, "F");
  
  y = 25;
  
  // Page title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textPrimary);
  doc.text("Where the Biggest Gains Were Made", margin, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textMuted);
  doc.text("Categories ranked by improvement", margin, y + 12);
  
  y += 30;
  
  // Get sorted sections
  const sortedSections = getSortedSections(originalResults, optimizedResults, originalStatus, optimizedStatus);
  
  // Table header
  doc.setFillColor(...colors.neutral100);
  doc.rect(margin, y, contentWidth, 18, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textSecondary);
  doc.text("Category", margin + 10, y + 12);
  doc.text("Before", margin + 95, y + 12, { align: "center" });
  doc.text("After", margin + 130, y + 12, { align: "center" });
  doc.text("Improvement", pageWidth - margin - 30, y + 12, { align: "center" });
  
  y += 18;
  
  // Category rows
  const rowHeight = 32;
  
  sortedSections.forEach((section, index) => {
    const rowY = y + (index * rowHeight);
    const isEven = index % 2 === 0;
    
    // Row background
    if (isEven) {
      doc.setFillColor(...colors.white);
    } else {
      doc.setFillColor(...colors.neutral50);
    }
    doc.rect(margin, rowY, contentWidth, rowHeight, "F");
    
    // Bottom border
    doc.setDrawColor(...colors.neutral200);
    doc.setLineWidth(0.3);
    doc.line(margin, rowY + rowHeight, margin + contentWidth, rowY + rowHeight);
    
    // Category name
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.textPrimary);
    doc.text(section.name, margin + 10, rowY + 20);
    
    // Before score
    if (!section.beforeNotScorable && section.beforeScore !== undefined) {
      doc.setFillColor(...colors.beforeBg);
      doc.roundedRect(margin + 80, rowY + 8, 30, 18, 4, 4, "F");
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.neutral500);
      doc.text(section.beforeScore.toString(), margin + 95, rowY + 20, { align: "center" });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(...colors.amber);
      doc.text("N/A", margin + 95, rowY + 20, { align: "center" });
    }
    
    // After score
    if (!section.afterNotScorable && section.afterScore !== undefined) {
      doc.setFillColor(...colors.successLight);
      doc.roundedRect(margin + 115, rowY + 8, 30, 18, 4, 4, "F");
      doc.setDrawColor(...colors.success);
      doc.setLineWidth(1);
      doc.roundedRect(margin + 115, rowY + 8, 30, 18, 4, 4, "S");
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.successDark);
      doc.text(section.afterScore.toString(), margin + 130, rowY + 20, { align: "center" });
    } else {
      doc.setFontSize(10);
      doc.setTextColor(...colors.amber);
      doc.text("N/A", margin + 130, rowY + 20, { align: "center" });
    }
    
    // Delta badge
    if (!section.beforeNotScorable && !section.afterNotScorable) {
      const delta = section.delta;
      const badgeX = pageWidth - margin - 50;
      
      if (delta > 0) {
        doc.setFillColor(...colors.success);
        doc.roundedRect(badgeX, rowY + 8, 40, 18, 4, 4, "F");
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(`+${delta}`, badgeX + 20, rowY + 20, { align: "center" });
      } else if (delta < 0) {
        doc.setFillColor(...colors.neutral300);
        doc.roundedRect(badgeX, rowY + 8, 40, 18, 4, 4, "F");
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.neutral600);
        doc.text(`${delta}`, badgeX + 20, rowY + 20, { align: "center" });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(...colors.textMuted);
        doc.text("—", badgeX + 20, rowY + 20, { align: "center" });
      }
    }
  });
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 3: BUSINESS IMPACT
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  
  // Header accent
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 4, "F");
  
  y = 25;
  
  // Page title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textPrimary);
  doc.text("What These Improvements Unlock", margin, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textMuted);
  doc.text("Business outcomes from measurable quality gains", margin, y + 12);
  
  y += 35;
  
  // Impact cards
  let hasImpacts = false;
  const cardHeight = 55;
  const cardSpacing = 8;
  
  sortedSections.forEach((section) => {
    const impact = generateCategoryImpact(section.name, section.delta);
    if (!impact) return;
    
    hasImpacts = true;
    
    // Check if we need a new page
    if (y + cardHeight > pageHeight - 30) {
      addFooter();
      doc.addPage();
      currentPage++;
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 4, "F");
      y = 25;
    }
    
    // Card background
    doc.setFillColor(...colors.neutral50);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 6, 6, "F");
    
    // Left accent bar
    doc.setFillColor(...colors.success);
    doc.roundedRect(margin, y, 4, cardHeight, 2, 2, "F");
    
    // Category name with delta
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.textPrimary);
    doc.text(section.name, margin + 15, y + 18);
    
    // Delta pill
    const nameWidth = doc.getTextWidth(section.name);
    doc.setFillColor(...colors.successLight);
    doc.roundedRect(margin + 18 + nameWidth, y + 8, 30, 15, 7, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.successDark);
    doc.text(`+${section.delta}`, margin + 33 + nameWidth, y + 18, { align: "center" });
    
    // Improvement description
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.textSecondary);
    doc.text(impact.improvement, margin + 15, y + 34);
    
    // Business outcome
    doc.setFontSize(10);
    doc.setTextColor(...colors.textMuted);
    doc.text(impact.outcome, margin + 15, y + 46);
    
    y += cardHeight + cardSpacing;
  });
  
  if (!hasImpacts) {
    doc.setFillColor(...colors.amberLight);
    doc.roundedRect(margin, y, contentWidth, 40, 6, 6, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.amber);
    doc.text("Limited improvement data available", pageWidth / 2, y + 24, { align: "center" });
  }
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 4: QUALITATIVE SUMMARY
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  
  // Header accent
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 4, "F");
  
  y = 25;
  
  // Page title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textPrimary);
  doc.text("Before vs After Summary", margin, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textMuted);
  doc.text("Plain-language comparison", margin, y + 12);
  
  y += 35;
  
  // Table header
  const col1Width = 60;
  const col2Width = (contentWidth - col1Width) / 2;
  
  doc.setFillColor(...colors.neutral100);
  doc.rect(margin, y, contentWidth, 20, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textSecondary);
  doc.text("Area", margin + 12, y + 13);
  doc.text("Before", margin + col1Width + col2Width / 2, y + 13, { align: "center" });
  doc.text("After", margin + col1Width + col2Width + col2Width / 2, y + 13, { align: "center" });
  
  y += 20;
  
  // Table rows
  const tableRowHeight = 26;
  
  sortedSections.forEach((section, index) => {
    const rowBg = index % 2 === 0 ? colors.white : colors.neutral50;
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, contentWidth, tableRowHeight, "F");
    
    // Border
    doc.setDrawColor(...colors.neutral200);
    doc.setLineWidth(0.3);
    doc.line(margin, y + tableRowHeight, margin + contentWidth, y + tableRowHeight);
    
    // Area name
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.textPrimary);
    doc.text(section.name, margin + 12, y + 16);
    
    // Before description
    const beforeDesc = getCategoryQualitativeDescription(section.name, section.beforeScore, section.beforeNotScorable);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...colors.beforeText);
    doc.text(beforeDesc, margin + col1Width + col2Width / 2, y + 16, { align: "center" });
    
    // After description
    const afterDesc = getCategoryQualitativeDescription(section.name, section.afterScore, section.afterNotScorable);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.successDark);
    doc.text(afterDesc, margin + col1Width + col2Width + col2Width / 2, y + 16, { align: "center" });
    
    y += tableRowHeight;
  });
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 5: SCORE METHODOLOGY
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  
  // Header accent
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 4, "F");
  
  y = 25;
  
  // Page title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textPrimary);
  doc.text("How to Read These Scores", margin, y);
  
  y += 25;
  
  // Methodology section
  doc.setFillColor(...colors.primaryLight);
  doc.roundedRect(margin, y, contentWidth, 85, 6, 6, "F");
  doc.setFillColor(...colors.primary);
  doc.roundedRect(margin, y, 4, 85, 2, 2, "F");
  
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.primary);
  doc.text("Scoring Methodology & Credibility", margin + 15, y + 20);
  
  // Canonical credibility body text
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textSecondary);
  
  const credBodyLines = doc.splitTextToSize(CREDIBILITY_BODY, contentWidth - 30);
  let credY = y + 35;
  credBodyLines.forEach((line: string) => {
    doc.text(line, margin + 15, credY);
    credY += 5;
  });
  
  // Footer line
  credY += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...colors.textMuted);
  doc.text(CREDIBILITY_FOOTER, margin + 15, credY);
  
  y += 90;
  
  // NOT SCORABLE section
  doc.setFillColor(...colors.amberLight);
  doc.roundedRect(margin, y, contentWidth, 75, 6, 6, "F");
  doc.setFillColor(...colors.amber);
  doc.roundedRect(margin, y, 4, 75, 2, 2, "F");
  
  // Badge
  doc.setFillColor(...colors.amber);
  doc.roundedRect(margin + 15, y + 12, 80, 18, 4, 4, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NOT SCORABLE", margin + 55, y + 24, { align: "center" });
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.neutral700);
  doc.text("does not mean poor performance", margin + 102, y + 24);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.neutral600);
  doc.text("It means the page could not be accessed publicly at the time of analysis.", margin + 15, y + 48);
  doc.text("Scores are never guessed or estimated.", margin + 15, y + 62);
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 6: CLOSING
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  
  // Header accent
  doc.setFillColor(...colors.success);
  doc.rect(0, 0, pageWidth, 4, "F");
  
  y = 50;
  
  // Closing headline
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...colors.textPrimary);
  doc.text("What This Means Going Forward", pageWidth / 2, y, { align: "center" });
  
  y += 30;
  
  // Key takeaways
  doc.setFillColor(...colors.neutral50);
  doc.roundedRect(margin + 15, y, contentWidth - 30, 90, 8, 8, "F");
  
  const takeaways = [
    "Measurable gains in clarity, structure, and performance",
    "Continued optimization compounds results over time",
    "Same scoring system tracks future progress",
    "Foundation for ongoing website improvement"
  ];
  
  let takeawayY = y + 22;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...colors.textSecondary);
  
  takeaways.forEach((takeaway) => {
    doc.setFillColor(...colors.success);
    doc.circle(margin + 30, takeawayY - 2, 2.5, "F");
    doc.text(takeaway, margin + 40, takeawayY);
    takeawayY += 18;
  });
  
  y += 110;
  
  // Final delta callout
  if (canCompare && overallDelta > 0) {
    doc.setFillColor(...colors.successLight);
    doc.roundedRect(margin + 25, y, contentWidth - 50, 40, 8, 8, "F");
    doc.setDrawColor(...colors.success);
    doc.setLineWidth(1.5);
    doc.roundedRect(margin + 25, y, contentWidth - 50, 40, 8, 8, "S");
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...colors.successDark);
    doc.text(`+${overallDelta} Point Improvement Achieved`, pageWidth / 2, y + 25, { align: "center" });
  }
  
  addFooter();

  // Save
  const filename = `website-transformation-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
