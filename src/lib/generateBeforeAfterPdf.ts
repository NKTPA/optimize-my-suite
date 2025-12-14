import jsPDF from "jspdf";
import { AnalysisResult, isNotScorable, detectLovablePlaceholder } from "@/types/analysis";

export interface BeforeAfterPdfData {
  originalUrl: string;
  optimizedUrl: string;
  originalResults: AnalysisResult;
  optimizedResults: AnalysisResult;
  agencyName?: string;
  clientName?: string;
}

// Premium executive color palette (RGB values)
const colors = {
  // Primary brand - deep sophisticated blue
  primary: [30, 64, 175] as number[],
  primaryLight: [239, 246, 255] as number[],
  primaryDark: [23, 37, 84] as number[],
  
  // Success - confident green
  success: [22, 163, 74] as number[],
  successLight: [220, 252, 231] as number[],
  successDark: [21, 128, 61] as number[],
  successMuted: [187, 247, 208] as number[],
  
  // Before - muted slate/gray
  beforeBg: [241, 245, 249] as number[],
  beforeAccent: [100, 116, 139] as number[],
  beforeMuted: [148, 163, 184] as number[],
  
  // After - vibrant success
  afterBg: [220, 252, 231] as number[],
  afterAccent: [22, 163, 74] as number[],
  
  // Neutral palette
  neutral50: [248, 250, 252] as number[],
  neutral100: [241, 245, 249] as number[],
  neutral200: [226, 232, 240] as number[],
  neutral300: [203, 213, 225] as number[],
  neutral400: [148, 163, 184] as number[],
  neutral500: [100, 116, 139] as number[],
  neutral600: [71, 85, 105] as number[],
  neutral700: [51, 65, 85] as number[],
  neutral800: [30, 41, 59] as number[],
  neutral900: [15, 23, 42] as number[],
  
  // Text hierarchy
  textPrimary: [15, 23, 42] as number[],
  textSecondary: [51, 65, 85] as number[],
  textMuted: [100, 116, 139] as number[],
  textLight: [148, 163, 184] as number[],
  
  // Amber for NOT SCORABLE (never red)
  amber: [180, 83, 9] as number[],
  amberLight: [254, 243, 199] as number[],
  amberMuted: [253, 230, 138] as number[],
  
  // Utility
  white: [255, 255, 255] as number[],
  border: [226, 232, 240] as number[],
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
  if (delta < 5) return null;
  
  const impacts: Record<string, { improvement: string; outcome: string }> = {
    "Messaging": {
      improvement: "Clearer value proposition and headline",
      outcome: "Increases first-impression clarity and reduces bounce rate"
    },
    "Conversion": {
      improvement: "Stronger CTAs and lead capture forms",
      outcome: "Improves visitor-to-lead conversion paths"
    },
    "Design & UX": {
      improvement: "Enhanced visual hierarchy and user experience",
      outcome: "Keeps visitors engaged longer and exploring more pages"
    },
    "SEO": {
      improvement: "Optimized metadata and content structure",
      outcome: "Increases organic search visibility and qualified traffic"
    },
    "Performance": {
      improvement: "Faster load times and optimized assets",
      outcome: "Reduces abandonment and improves user satisfaction"
    },
    "Trust": {
      improvement: "Added credibility signals and social proof",
      outcome: "Reduces friction and increases contact form submissions"
    },
    "Mobile": {
      improvement: "Responsive design and mobile-first layout",
      outcome: "Captures on-the-go users and local mobile searches"
    }
  };
  
  return impacts[category] || null;
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

// Truncate URL for display
function truncateUrl(url: string, maxLength: number): string {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength - 3) + "...";
}

export function generateBeforeAfterPdf(data: BeforeAfterPdfData) {
  const { originalUrl, optimizedUrl, originalResults, optimizedResults, agencyName, clientName } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;
  let currentPage = 1;

  const originalStatus = getNotScorableStatus(originalResults);
  const optimizedStatus = getNotScorableStatus(optimizedResults);
  const canCompare = !originalStatus.notScorable && !optimizedStatus.notScorable;
  
  const overallDelta = canCompare 
    ? optimizedResults.summary.overallScore - originalResults.summary.overallScore 
    : 0;

  const addFooter = () => {
    doc.setDrawColor(colors.neutral200[0], colors.neutral200[1], colors.neutral200[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Generated by OptimizeMySuite", margin, pageHeight - 10);
    
    const dateStr = new Date().toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
    doc.text(dateStr, pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  // ════════════════════════════════════════════════════════════════
  // PAGE 1: EXECUTIVE IMPACT SUMMARY (HERO PAGE)
  // ════════════════════════════════════════════════════════════════
  
  // Full-bleed dark header
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.rect(0, 0, pageWidth, 75, "F");
  
  // Subtle gradient accent line
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 73, pageWidth, 2, "F");
  
  // Main headline - large, confident typography
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Website Performance", margin, 35);
  doc.text("Transformation", margin, 52);
  
  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 230);
  doc.text("Measured improvement using the same objective scoring system", margin, 66);
  
  y = 95;
  
  // ═══════ HERO DELTA CALLOUT - THE CENTERPIECE ═══════
  if (canCompare) {
    const beforeScore = originalResults.summary.overallScore;
    const afterScore = optimizedResults.summary.overallScore;
    const deltaSign = overallDelta > 0 ? "+" : "";
    
    // Score transformation display: BEFORE → AFTER
    const sectionWidth = contentWidth / 3;
    const scoreY = y + 10;
    
    // BEFORE score block
    doc.setFillColor(colors.beforeBg[0], colors.beforeBg[1], colors.beforeBg[2]);
    doc.roundedRect(margin, y, sectionWidth - 5, 65, 6, 6, "F");
    doc.setDrawColor(colors.neutral300[0], colors.neutral300[1], colors.neutral300[2]);
    doc.setLineWidth(1);
    doc.roundedRect(margin, y, sectionWidth - 5, 65, 6, 6, "S");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
    doc.text("BEFORE", margin + (sectionWidth - 5) / 2, scoreY, { align: "center" });
    
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.neutral500[0], colors.neutral500[1], colors.neutral500[2]);
    doc.text(beforeScore.toString(), margin + (sectionWidth - 5) / 2, scoreY + 35, { align: "center" });
    
    // Arrow and DELTA in center
    const centerX = margin + sectionWidth;
    
    // Large arrow
    doc.setFillColor(colors.neutral400[0], colors.neutral400[1], colors.neutral400[2]);
    // Arrow shape pointing right
    doc.triangle(centerX + 8, y + 32, centerX + 22, y + 32, centerX + 15, y + 22, "F");
    doc.rect(centerX + 11, y + 32, 8, 15, "F");
    
    // AFTER score block
    const afterBlockX = margin + sectionWidth * 2 + 5;
    doc.setFillColor(colors.afterBg[0], colors.afterBg[1], colors.afterBg[2]);
    doc.roundedRect(afterBlockX, y, sectionWidth - 5, 65, 6, 6, "F");
    doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.setLineWidth(2);
    doc.roundedRect(afterBlockX, y, sectionWidth - 5, 65, 6, 6, "S");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.afterAccent[0], colors.afterAccent[1], colors.afterAccent[2]);
    doc.text("AFTER", afterBlockX + (sectionWidth - 5) / 2, scoreY, { align: "center" });
    
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
    doc.text(afterScore.toString(), afterBlockX + (sectionWidth - 5) / 2, scoreY + 35, { align: "center" });
    
    y += 80;
    
    // ═══════ MASSIVE IMPROVEMENT BADGE ═══════
    const badgeWidth = 160;
    const badgeHeight = 48;
    const badgeX = (pageWidth - badgeWidth) / 2;
    
    // Green gradient effect via layered rects
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 10, 10, "F");
    
    // Lighter inner highlight
    doc.setFillColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
    doc.roundedRect(badgeX + 3, y + 3, badgeWidth - 6, badgeHeight - 6, 8, 8, "F");
    
    // Delta text - HUGE and dominant
    doc.setFontSize(34);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${deltaSign}${overallDelta}`, badgeX + 50, y + 33, { align: "center" });
    
    // "POINT IMPROVEMENT" label
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("POINT", badgeX + 85, y + 22);
    doc.text("IMPROVEMENT", badgeX + 85, y + 35);
    
    y += badgeHeight + 25;
    
  } else {
    // Cannot compare state - professional amber notice
    doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
    doc.roundedRect(margin + 20, y, contentWidth - 40, 50, 8, 8, "F");
    doc.setDrawColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.setLineWidth(1);
    doc.roundedRect(margin + 20, y, contentWidth - 40, 50, 8, 8, "S");
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.text("Score Comparison Limited", pageWidth / 2, y + 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.neutral600[0], colors.neutral600[1], colors.neutral600[2]);
    doc.text("One or both pages could not be fully evaluated at time of analysis", pageWidth / 2, y + 35, { align: "center" });
    
    y += 65;
  }
  
  // ═══════ URL INFORMATION ═══════
  const urlBlockHeight = 28;
  
  // Before URL
  doc.setFillColor(colors.neutral100[0], colors.neutral100[1], colors.neutral100[2]);
  doc.roundedRect(margin, y, contentWidth, urlBlockHeight, 4, 4, "F");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
  doc.text("ORIGINAL WEBSITE", margin + 10, y + 10);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text(truncateUrl(originalUrl, 75), margin + 10, y + 21);
  
  y += urlBlockHeight + 6;
  
  // After URL
  doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
  doc.roundedRect(margin, y, contentWidth, urlBlockHeight, 4, 4, "F");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.afterAccent[0], colors.afterAccent[1], colors.afterAccent[2]);
  doc.text("OPTIMIZED WEBSITE", margin + 10, y + 10);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text(truncateUrl(optimizedUrl, 75), margin + 10, y + 21);
  
  y += urlBlockHeight + 15;
  
  // ═══════ CREDIBILITY LINE ═══════
  doc.setFillColor(colors.neutral50[0], colors.neutral50[1], colors.neutral50[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 4, 4, "F");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Same scoring methodology  •  No manual adjustments  •  Measurable gains", pageWidth / 2, y + 13, { align: "center" });
  
  y += 30;
  
  // Client/Agency info
  if (clientName || agencyName) {
    doc.setFontSize(9);
    if (clientName) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(`Prepared for: ${clientName}`, margin, y);
      y += 12;
    }
    if (agencyName) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(`Agency: ${agencyName}`, margin, y);
    }
  }
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 2: WHERE THE BIGGEST GAINS WERE MADE
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Page header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Where the Biggest Gains Were Made", margin, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Categories ranked by improvement magnitude", margin, y + 14);
  
  y += 35;
  
  // Get sorted sections (largest delta first)
  const sortedSections = getSortedSections(originalResults, optimizedResults, originalStatus, optimizedStatus);
  
  const rowHeight = 38;
  const barMaxWidth = 100;
  const barHeight = 14;
  
  sortedSections.forEach((section) => {
    // Category container
    doc.setFillColor(colors.neutral50[0], colors.neutral50[1], colors.neutral50[2]);
    doc.roundedRect(margin, y, contentWidth, rowHeight, 6, 6, "F");
    
    // Category name - large and bold
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(section.name, margin + 10, y + 14);
    
    // Score cards side by side
    const cardStartX = margin + 75;
    const scoreCardWidth = 45;
    const scoreCardHeight = 26;
    const cardY = y + 6;
    
    // BEFORE score card (gray)
    doc.setFillColor(colors.beforeBg[0], colors.beforeBg[1], colors.beforeBg[2]);
    doc.roundedRect(cardStartX, cardY, scoreCardWidth, scoreCardHeight, 4, 4, "F");
    
    if (!section.beforeNotScorable) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
      doc.text(section.beforeScore!.toString(), cardStartX + scoreCardWidth / 2, cardY + 17, { align: "center" });
    } else {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.text("N/A", cardStartX + scoreCardWidth / 2, cardY + 17, { align: "center" });
    }
    
    // AFTER score card (green)
    const afterCardX = cardStartX + scoreCardWidth + 8;
    doc.setFillColor(colors.afterBg[0], colors.afterBg[1], colors.afterBg[2]);
    doc.roundedRect(afterCardX, cardY, scoreCardWidth, scoreCardHeight, 4, 4, "F");
    doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.setLineWidth(1.5);
    doc.roundedRect(afterCardX, cardY, scoreCardWidth, scoreCardHeight, 4, 4, "S");
    
    if (!section.afterNotScorable) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
      doc.text(section.afterScore!.toString(), afterCardX + scoreCardWidth / 2, cardY + 17, { align: "center" });
    } else {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.text("N/A", afterCardX + scoreCardWidth / 2, cardY + 17, { align: "center" });
    }
    
    // BIG DELTA CALLOUT on the right
    const deltaX = pageWidth - margin - 50;
    
    if (!section.beforeNotScorable && !section.afterNotScorable) {
      const delta = section.delta;
      
      if (delta > 0) {
        // Positive delta - green badge
        doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
        doc.roundedRect(deltaX, cardY, 45, scoreCardHeight, 4, 4, "F");
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(`+${delta}`, deltaX + 22, cardY + 17, { align: "center" });
      } else if (delta < 0) {
        // Negative delta - muted
        doc.setFillColor(colors.neutral300[0], colors.neutral300[1], colors.neutral300[2]);
        doc.roundedRect(deltaX, cardY, 45, scoreCardHeight, 4, 4, "F");
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.neutral600[0], colors.neutral600[1], colors.neutral600[2]);
        doc.text(`${delta}`, deltaX + 22, cardY + 17, { align: "center" });
      } else {
        // No change
        doc.setFillColor(colors.neutral200[0], colors.neutral200[1], colors.neutral200[2]);
        doc.roundedRect(deltaX, cardY, 45, scoreCardHeight, 4, 4, "F");
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text("—", deltaX + 22, cardY + 17, { align: "center" });
      }
    }
    
    y += rowHeight + 6;
  });
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 3: WHAT THESE IMPROVEMENTS UNLOCK (BUSINESS FRAMING)
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Page header with accent
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, y - 5, 6, 30, 2, 2, "F");
  
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("What These Improvements Unlock", margin + 15, y + 5);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Business outcomes from measurable website quality gains", margin + 15, y + 18);
  
  y += 40;
  
  // Generate impact cards for each category with meaningful delta
  sortedSections.forEach((section) => {
    if (section.delta < 5) return; // Only show meaningful improvements
    
    const impact = generateCategoryImpact(section.name, section.delta);
    if (!impact) return;
    
    // Impact card
    doc.setFillColor(colors.neutral50[0], colors.neutral50[1], colors.neutral50[2]);
    doc.roundedRect(margin, y, contentWidth, 45, 6, 6, "F");
    
    // Left accent bar (green gradient effect)
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.roundedRect(margin, y, 5, 45, 2, 2, "F");
    
    // Category + delta badge
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(section.name, margin + 15, y + 14);
    
    // Delta pill
    doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
    const pillX = margin + 15 + doc.getTextWidth(section.name) + 8;
    doc.roundedRect(pillX, y + 5, 30, 14, 7, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
    doc.text(`+${section.delta}`, pillX + 15, y + 14, { align: "center" });
    
    // Improvement statement
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(impact.improvement, margin + 15, y + 28);
    
    // Business outcome - italicized
    doc.setFont("helvetica", "italic");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(impact.outcome, margin + 15, y + 40);
    
    y += 52;
  });
  
  // If no meaningful improvements
  if (!sortedSections.some(s => s.delta >= 5)) {
    doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
    doc.roundedRect(margin, y, contentWidth, 40, 6, 6, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.text("Unable to generate impact summary due to limited improvement data", pageWidth / 2, y + 24, { align: "center" });
  }
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 4: BEFORE VS AFTER BREAKDOWN (CLEAN COMPARISON)
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Page header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Before vs After Breakdown", margin, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Side-by-side category comparison", margin, y + 14);
  
  y += 35;
  
  // Column headers
  const colWidth = (contentWidth - 10) / 2;
  
  // BEFORE header
  doc.setFillColor(colors.beforeBg[0], colors.beforeBg[1], colors.beforeBg[2]);
  doc.roundedRect(margin, y, colWidth, 22, 4, 4, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
  doc.text("BEFORE", margin + colWidth / 2, y + 14, { align: "center" });
  
  // AFTER header
  const afterColX = margin + colWidth + 10;
  doc.setFillColor(colors.afterBg[0], colors.afterBg[1], colors.afterBg[2]);
  doc.roundedRect(afterColX, y, colWidth, 22, 4, 4, "F");
  doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.setLineWidth(1.5);
  doc.roundedRect(afterColX, y, colWidth, 22, 4, 4, "S");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.afterAccent[0], colors.afterAccent[1], colors.afterAccent[2]);
  doc.text("AFTER", afterColX + colWidth / 2, y + 14, { align: "center" });
  
  y += 30;
  
  // Category rows
  sortedSections.forEach((section) => {
    // Category label
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(section.name, margin, y);
    
    y += 8;
    
    const cardHeight = 32;
    
    // BEFORE card
    doc.setFillColor(colors.neutral100[0], colors.neutral100[1], colors.neutral100[2]);
    doc.roundedRect(margin, y, colWidth, cardHeight, 4, 4, "F");
    
    if (!section.beforeNotScorable) {
      // Large score
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.neutral500[0], colors.neutral500[1], colors.neutral500[2]);
      doc.text(section.beforeScore!.toString(), margin + 15, y + 22);
      
      // Brief note
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text("Original score", margin + 45, y + 20);
    } else {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.text("NOT SCORABLE", margin + colWidth / 2, y + 20, { align: "center" });
    }
    
    // AFTER card
    doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
    doc.roundedRect(afterColX, y, colWidth, cardHeight, 4, 4, "F");
    
    if (!section.afterNotScorable) {
      // Large score
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
      doc.text(section.afterScore!.toString(), afterColX + 15, y + 22);
      
      // Delta note
      if (!section.beforeNotScorable) {
        const delta = section.delta;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        if (delta > 0) {
          doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
          doc.text(`+${delta} improvement`, afterColX + 45, y + 20);
        } else if (delta < 0) {
          doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
          doc.text(`${delta} change`, afterColX + 45, y + 20);
        } else {
          doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
          doc.text("No change", afterColX + 45, y + 20);
        }
      }
    } else {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.text("NOT SCORABLE", afterColX + colWidth / 2, y + 20, { align: "center" });
    }
    
    y += cardHeight + 10;
  });
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 5: SCORE CREDIBILITY & NOT SCORABLE EXPLANATION
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Page header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("How to Read These Scores", margin, y);
  
  y += 25;
  
  // Credibility section
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  doc.roundedRect(margin, y, contentWidth, 80, 6, 6, "F");
  
  // Left accent
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, y, 5, 80, 2, 2, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Scoring Methodology", margin + 15, y + 18);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  
  const credibilityPoints = [
    "Scores are based on objective, criteria-based analysis of website content",
    "Both before and after analyses use identical evaluation methodology",
    "No manual adjustments or subjective modifications are applied",
    "Results reflect measurable improvements in website quality metrics"
  ];
  
  let pointY = y + 32;
  credibilityPoints.forEach((point) => {
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.circle(margin + 20, pointY - 2, 2, "F");
    doc.text(point, margin + 28, pointY);
    pointY += 12;
  });
  
  y += 95;
  
  // NOT SCORABLE explanation section
  doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
  doc.roundedRect(margin, y, contentWidth, 75, 6, 6, "F");
  
  // Amber accent
  doc.setFillColor(colors.amber[0], colors.amber[1], colors.amber[2]);
  doc.roundedRect(margin, y, 5, 75, 2, 2, "F");
  
  // NOT SCORABLE badge
  doc.setFillColor(colors.amber[0], colors.amber[1], colors.amber[2]);
  doc.roundedRect(margin + 15, y + 12, 85, 18, 4, 4, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NOT SCORABLE", margin + 57, y + 24, { align: "center" });
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.neutral700[0], colors.neutral700[1], colors.neutral700[2]);
  doc.text("does not mean poor performance", margin + 108, y + 24);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.neutral600[0], colors.neutral600[1], colors.neutral600[2]);
  doc.text("It means the page could not be accessed publicly at the time of analysis.", margin + 15, y + 45);
  doc.text("Common causes include authentication gates, private staging environments,", margin + 15, y + 57);
  doc.text("or temporary access restrictions. Scores are never guessed or penalized.", margin + 15, y + 69);
  
  y += 95;
  
  // Final trust statement
  doc.setFillColor(colors.neutral50[0], colors.neutral50[1], colors.neutral50[2]);
  doc.roundedRect(margin, y, contentWidth, 35, 6, 6, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("This report provides an objective comparison based on standardized criteria.", pageWidth / 2, y + 15, { align: "center" });
  doc.text("The methodology ensures consistent, reliable measurement of improvement.", pageWidth / 2, y + 27, { align: "center" });
  
  addFooter();

  // Save
  const filename = `website-transformation-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
