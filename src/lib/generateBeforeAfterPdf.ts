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

// Premium color palette (RGB values)
const colors = {
  // Primary brand colors - deep blue gradient
  primary: [37, 99, 235] as number[],
  primaryLight: [239, 246, 255] as number[],
  primaryDark: [30, 64, 175] as number[],
  primaryGradientEnd: [59, 130, 246] as number[],
  
  // Success colors - confident green
  success: [22, 163, 74] as number[],
  successLight: [220, 252, 231] as number[],
  successDark: [21, 128, 61] as number[],
  successVibrant: [34, 197, 94] as number[],
  
  // Neutral colors
  neutral: [148, 163, 184] as number[],
  neutralLight: [248, 250, 252] as number[],
  neutralMuted: [203, 213, 225] as number[],
  neutralDark: [100, 116, 139] as number[],
  
  // Text colors
  textPrimary: [15, 23, 42] as number[],
  textSecondary: [51, 65, 85] as number[],
  textMuted: [148, 163, 184] as number[],
  
  // Backgrounds
  cardBg: [248, 250, 252] as number[],
  border: [226, 232, 240] as number[],
  white: [255, 255, 255] as number[],
  
  // Before/After specific
  beforeBg: [241, 245, 249] as number[],
  beforeAccent: [100, 116, 139] as number[],
  afterBg: [236, 253, 245] as number[],
  afterAccent: [22, 163, 74] as number[],
  
  // Amber for NOT SCORABLE
  amber: [217, 119, 6] as number[],
  amberLight: [254, 243, 199] as number[],
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

// Generate business-outcome-focused improvements
function generateBusinessImpact(
  original: AnalysisResult, 
  optimized: AnalysisResult,
  originalStatus: { notScorable: boolean },
  optimizedStatus: { notScorable: boolean }
): string[] {
  if (originalStatus.notScorable || optimizedStatus.notScorable) {
    if (originalStatus.notScorable && !optimizedStatus.notScorable) {
      return ["Website is now publicly accessible and ready for search indexing"];
    }
    return [];
  }
  
  const impacts: string[] = [];
  
  // Messaging impact
  const msgDelta = optimized.messaging.score - original.messaging.score;
  if (msgDelta >= 10) {
    impacts.push("Clearer messaging increases first-impression clarity and reduces bounce rate");
  }
  
  // Conversion impact
  const convDelta = optimized.conversion.score - original.conversion.score;
  if (convDelta >= 10) {
    impacts.push("Stronger CTAs and lead forms improve visitor-to-lead conversion paths");
  }
  
  // SEO impact
  const seoDelta = optimized.seo.score - original.seo.score;
  if (seoDelta >= 10) {
    impacts.push("SEO enhancements increase organic search visibility and traffic");
  }
  
  // Trust impact
  const trustDelta = optimized.trust.score - original.trust.score;
  if (trustDelta >= 10) {
    impacts.push("Trust signals reduce friction and increase contact form submissions");
  }
  
  // Design/UX impact
  const designDelta = optimized.designUx.score - original.designUx.score;
  if (designDelta >= 10) {
    impacts.push("Improved UX keeps visitors engaged longer and exploring more pages");
  }
  
  // Mobile impact
  const mobileDelta = optimized.mobile.score - original.mobile.score;
  if (mobileDelta >= 10) {
    impacts.push("Mobile optimizations support on-the-go users and local searches");
  }
  
  // If no specific gains, add general impact
  if (impacts.length === 0) {
    const overallDelta = optimized.summary.overallScore - original.summary.overallScore;
    if (overallDelta > 0) {
      impacts.push("Overall website quality improved, supporting better user experience");
    }
  }
  
  return impacts.slice(0, 5);
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
  
  // Calculate deltas and sort by largest improvement
  return sections
    .map(s => {
      const beforeNotScorable = originalStatus.notScorable || s.beforeScore === undefined;
      const afterNotScorable = optimizedStatus.notScorable || s.afterScore === undefined;
      const delta = (!beforeNotScorable && !afterNotScorable) ? (s.afterScore! - s.beforeScore!) : 0;
      return { ...s, delta, beforeNotScorable, afterNotScorable };
    })
    .sort((a, b) => b.delta - a.delta);
}

export function generateBeforeAfterPdf(data: BeforeAfterPdfData) {
  const { originalUrl, optimizedUrl, originalResults, optimizedResults, agencyName, clientName } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;
  let currentPage = 1;

  const originalStatus = getNotScorableStatus(originalResults);
  const optimizedStatus = getNotScorableStatus(optimizedResults);
  const canCompare = !originalStatus.notScorable && !optimizedStatus.notScorable;
  
  const overallDelta = canCompare 
    ? optimizedResults.summary.overallScore - originalResults.summary.overallScore 
    : 0;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > 272) {
      addFooter();
      doc.addPage();
      currentPage++;
      y = 25;
    }
  };

  const addFooter = () => {
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Generated by OptimizeMySuite", margin, pageHeight - 10);
    doc.text(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), pageWidth / 2, pageHeight - 10, { align: "center" });
    doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  // ============ PAGE 1: EXECUTIVE IMPACT COVER ============
  
  // Full-width gradient header
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.rect(0, 0, pageWidth, 85, "F");
  
  // Gradient overlay accent
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 70, pageWidth, 15, "F");
  
  // Premium logo mark
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + 12, 25, 10, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.text("O", margin + 12, 29, { align: "center" });
  
  // Main headline
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Website Performance", margin + 28, 30);
  doc.text("Transformation", margin + 28, 44);
  
  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 230, 255);
  doc.text("Objective, criteria-based improvement using the same scoring methodology", margin + 28, 58);
  
  y = 100;
  
  // ============ HERO DELTA CALLOUT - THE CENTERPIECE ============
  if (canCompare && overallDelta !== 0) {
    const deltaSign = overallDelta > 0 ? "+" : "";
    const badgeWidth = 160;
    const badgeHeight = 50;
    const badgeX = (pageWidth - badgeWidth) / 2;
    
    // Large prominent badge
    if (overallDelta > 0) {
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    } else {
      doc.setFillColor(colors.neutralDark[0], colors.neutralDark[1], colors.neutralDark[2]);
    }
    doc.roundedRect(badgeX, y, badgeWidth, badgeHeight, 8, 8, "F");
    
    // Delta number - HUGE
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${deltaSign}${overallDelta}`, badgeX + 45, y + 32, { align: "center" });
    
    // Label
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("POINT", badgeX + 75, y + 25);
    doc.text("IMPROVEMENT", badgeX + 75, y + 38);
    
    // Upward arrow indicator
    if (overallDelta > 0) {
      doc.setFillColor(255, 255, 255);
      // Simple triangle
      doc.triangle(
        badgeX + badgeWidth - 25, y + 35,
        badgeX + badgeWidth - 20, y + 20,
        badgeX + badgeWidth - 15, y + 35,
        "F"
      );
    }
    
    y += badgeHeight + 20;
  } else if (!canCompare) {
    // Cannot compare state
    doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
    doc.roundedRect(margin + 30, y, contentWidth - 60, 35, 6, 6, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.text("Comparison Limited", pageWidth / 2, y + 15, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("One or both pages could not be fully evaluated", pageWidth / 2, y + 27, { align: "center" });
    y += 50;
  } else {
    y += 10;
  }
  
  // ============ URL CARDS ============
  const urlCardHeight = 32;
  
  // Before URL card
  doc.setFillColor(colors.beforeBg[0], colors.beforeBg[1], colors.beforeBg[2]);
  doc.roundedRect(margin, y, contentWidth, urlCardHeight, 4, 4, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
  doc.text("BEFORE — Original Website", margin + 10, y + 12);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const origUrlDisplay = originalUrl.length > 70 ? originalUrl.substring(0, 70) + "..." : originalUrl;
  doc.text(origUrlDisplay, margin + 10, y + 24);
  
  y += urlCardHeight + 8;
  
  // After URL card
  doc.setFillColor(colors.afterBg[0], colors.afterBg[1], colors.afterBg[2]);
  doc.roundedRect(margin, y, contentWidth, urlCardHeight, 4, 4, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.afterAccent[0], colors.afterAccent[1], colors.afterAccent[2]);
  doc.text("AFTER — Optimized Website", margin + 10, y + 12);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const optUrlDisplay = optimizedUrl.length > 70 ? optimizedUrl.substring(0, 70) + "..." : optimizedUrl;
  doc.text(optUrlDisplay, margin + 10, y + 24);
  
  y += urlCardHeight + 20;
  
  // ============ CREDIBILITY BADGE ============
  doc.setFillColor(colors.neutralLight[0], colors.neutralLight[1], colors.neutralLight[2]);
  doc.roundedRect(margin + 20, y, contentWidth - 40, 24, 4, 4, "F");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Same scoring system  •  No manual adjustments  •  Real measurable gains", pageWidth / 2, y + 14, { align: "center" });
  
  y += 35;
  
  // Client/Agency info
  if (clientName || agencyName) {
    doc.setFontSize(10);
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    if (clientName) {
      doc.setFont("helvetica", "bold");
      doc.text(`Prepared for: ${clientName}`, margin, y);
      y += 10;
    }
    if (agencyName) {
      doc.setFont("helvetica", "normal");
      doc.text(`Agency: ${agencyName}`, margin, y);
      y += 10;
    }
  }
  
  addFooter();
  
  // ============ PAGE 2: HEAD-TO-HEAD SCORE CARDS ============
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Page title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Head-to-Head Comparison", pageWidth / 2, y, { align: "center" });
  y += 30;
  
  // Two large side-by-side score cards
  const cardWidth = (contentWidth - 16) / 2;
  const cardHeight = 110;
  
  // ============ BEFORE CARD - Muted/grayscale ============
  const beforeCardX = margin;
  
  // Card background
  doc.setFillColor(colors.beforeBg[0], colors.beforeBg[1], colors.beforeBg[2]);
  doc.roundedRect(beforeCardX, y, cardWidth, cardHeight, 8, 8, "F");
  doc.setDrawColor(colors.neutralMuted[0], colors.neutralMuted[1], colors.neutralMuted[2]);
  doc.setLineWidth(1);
  doc.roundedRect(beforeCardX, y, cardWidth, cardHeight, 8, 8, "S");
  
  // Label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.neutralDark[0], colors.neutralDark[1], colors.neutralDark[2]);
  doc.text("BEFORE OPTIMIZATION", beforeCardX + cardWidth / 2, y + 18, { align: "center" });
  
  if (originalStatus.notScorable) {
    // NOT SCORABLE - neutral amber styling
    doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
    doc.roundedRect(beforeCardX + 15, y + 35, cardWidth - 30, 40, 6, 6, "F");
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.text("NOT SCORABLE", beforeCardX + cardWidth / 2, y + 55, { align: "center" });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.neutralDark[0], colors.neutralDark[1], colors.neutralDark[2]);
    doc.text(originalStatus.reason, beforeCardX + cardWidth / 2, y + 68, { align: "center" });
  } else {
    // Large score with progress ring visual
    const score = originalResults.summary.overallScore;
    const centerX = beforeCardX + cardWidth / 2;
    const centerY = y + 60;
    const radius = 28;
    
    // Background circle
    doc.setDrawColor(colors.neutralMuted[0], colors.neutralMuted[1], colors.neutralMuted[2]);
    doc.setLineWidth(6);
    doc.circle(centerX, centerY, radius, "S");
    
    // Progress arc (simplified as we can't do true arcs easily)
    doc.setDrawColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
    doc.setLineWidth(6);
    // Draw partial circle based on score
    const progress = score / 100;
    if (progress > 0) {
      // Simple visual indicator
      doc.circle(centerX, centerY, radius, "S");
    }
    
    // Score number
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
    doc.text(score.toString(), centerX, centerY + 10, { align: "center" });
  }
  
  // URL snippet
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const beforeUrlShort = originalUrl.length > 32 ? originalUrl.substring(0, 32) + "..." : originalUrl;
  doc.text(beforeUrlShort, beforeCardX + cardWidth / 2, y + cardHeight - 8, { align: "center" });
  
  // ============ AFTER CARD - Vibrant/success ============
  const afterCardX = margin + cardWidth + 16;
  
  // Card background with success tint
  doc.setFillColor(colors.afterBg[0], colors.afterBg[1], colors.afterBg[2]);
  doc.roundedRect(afterCardX, y, cardWidth, cardHeight, 8, 8, "F");
  doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.setLineWidth(2);
  doc.roundedRect(afterCardX, y, cardWidth, cardHeight, 8, 8, "S");
  
  // Label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
  doc.text("AFTER OPTIMIZATION", afterCardX + cardWidth / 2, y + 18, { align: "center" });
  
  if (optimizedStatus.notScorable) {
    // NOT SCORABLE
    doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
    doc.roundedRect(afterCardX + 15, y + 35, cardWidth - 30, 40, 6, 6, "F");
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.text("NOT SCORABLE", afterCardX + cardWidth / 2, y + 55, { align: "center" });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.neutralDark[0], colors.neutralDark[1], colors.neutralDark[2]);
    doc.text(optimizedStatus.reason, afterCardX + cardWidth / 2, y + 68, { align: "center" });
  } else {
    // Large score with progress ring visual
    const score = optimizedResults.summary.overallScore;
    const centerX = afterCardX + cardWidth / 2;
    const centerY = y + 60;
    const radius = 28;
    
    // Background circle
    doc.setDrawColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
    doc.setLineWidth(6);
    doc.circle(centerX, centerY, radius, "S");
    
    // Filled progress
    doc.setDrawColor(colors.successVibrant[0], colors.successVibrant[1], colors.successVibrant[2]);
    doc.setLineWidth(6);
    doc.circle(centerX, centerY, radius, "S");
    
    // Score number
    doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
    doc.text(score.toString(), centerX, centerY + 10, { align: "center" });
  }
  
  // URL snippet
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const afterUrlShort = optimizedUrl.length > 32 ? optimizedUrl.substring(0, 32) + "..." : optimizedUrl;
  doc.text(afterUrlShort, afterCardX + cardWidth / 2, y + cardHeight - 8, { align: "center" });
  
  y += cardHeight + 20;
  
  // ============ DELTA BADGE BETWEEN CARDS ============
  if (canCompare) {
    const deltaSign = overallDelta > 0 ? "+" : "";
    const badgeY = y - cardHeight / 2 - 15;
    const badgeX = pageWidth / 2;
    
    // Circle badge in center
    if (overallDelta > 0) {
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    } else if (overallDelta < 0) {
      doc.setFillColor(colors.neutralDark[0], colors.neutralDark[1], colors.neutralDark[2]);
    } else {
      doc.setFillColor(colors.neutral[0], colors.neutral[1], colors.neutral[2]);
    }
    doc.circle(badgeX, badgeY, 18, "F");
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${deltaSign}${overallDelta}`, badgeX, badgeY + 5, { align: "center" });
  }
  
  // Caption below cards
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Measured improvement using identical evaluation criteria", pageWidth / 2, y, { align: "center" });
  
  y += 25;
  addFooter();
  
  // ============ PAGE 3: CATEGORY IMPROVEMENT VISUALIZATION ============
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Section header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Where the Biggest Gains Were Made", margin, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("Categories sorted by improvement magnitude", margin, y + 12);
  y += 30;
  
  // Get sorted sections (largest delta first)
  const sortedSections = getSortedSections(originalResults, optimizedResults, originalStatus, optimizedStatus);
  
  const barMaxWidth = 110;
  const barHeight = 10;
  const rowHeight = 40;
  const labelWidth = 55;
  const barStartX = margin + labelWidth;
  
  sortedSections.forEach((section) => {
    addPageIfNeeded(rowHeight + 5);
    
    // Category background
    doc.setFillColor(colors.neutralLight[0], colors.neutralLight[1], colors.neutralLight[2]);
    doc.roundedRect(margin, y - 5, contentWidth, rowHeight - 4, 4, 4, "F");
    
    // Category label
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(section.name, margin + 8, y + 8);
    
    // BEFORE bar
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Before", barStartX - 3, y + 6, { align: "right" });
    
    // Bar background
    doc.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(barStartX, y, barMaxWidth, barHeight, 3, 3, "F");
    
    if (!section.beforeNotScorable) {
      const beforeWidth = Math.max(2, (section.beforeScore! / 100) * barMaxWidth);
      doc.setFillColor(colors.neutralMuted[0], colors.neutralMuted[1], colors.neutralMuted[2]);
      doc.roundedRect(barStartX, y, beforeWidth, barHeight, 3, 3, "F");
      
      // Score at end
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.neutralDark[0], colors.neutralDark[1], colors.neutralDark[2]);
      doc.text(section.beforeScore!.toString(), barStartX + barMaxWidth + 6, y + 8);
    } else {
      doc.setFontSize(8);
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.text("N/A", barStartX + barMaxWidth + 6, y + 8);
    }
    
    y += 16;
    
    // AFTER bar
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("After", barStartX - 3, y + 6, { align: "right" });
    
    // Bar background
    doc.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(barStartX, y, barMaxWidth, barHeight, 3, 3, "F");
    
    if (!section.afterNotScorable) {
      const afterWidth = Math.max(2, (section.afterScore! / 100) * barMaxWidth);
      doc.setFillColor(colors.successVibrant[0], colors.successVibrant[1], colors.successVibrant[2]);
      doc.roundedRect(barStartX, y, afterWidth, barHeight, 3, 3, "F");
      
      // Score at end
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
      doc.text(section.afterScore!.toString(), barStartX + barMaxWidth + 6, y + 8);
    } else {
      doc.setFontSize(8);
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.text("N/A", barStartX + barMaxWidth + 6, y + 8);
    }
    
    // Delta badge on the right
    if (!section.beforeNotScorable && !section.afterNotScorable) {
      const deltaX = barStartX + barMaxWidth + 28;
      const delta = section.delta;
      
      if (delta > 0) {
        doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
        doc.roundedRect(deltaX, y - 12, 36, 24, 4, 4, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
        doc.text(`+${delta}`, deltaX + 18, y + 4, { align: "center" });
      } else if (delta < 0) {
        doc.setFillColor(colors.neutralLight[0], colors.neutralLight[1], colors.neutralLight[2]);
        doc.roundedRect(deltaX, y - 12, 36, 24, 4, 4, "F");
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.neutralDark[0], colors.neutralDark[1], colors.neutralDark[2]);
        doc.text(`${delta}`, deltaX + 18, y + 4, { align: "center" });
      } else {
        doc.setFillColor(colors.neutralLight[0], colors.neutralLight[1], colors.neutralLight[2]);
        doc.roundedRect(deltaX, y - 12, 36, 24, 4, 4, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text("—", deltaX + 18, y + 4, { align: "center" });
      }
    }
    
    y += rowHeight - 12;
  });
  
  addFooter();
  
  // ============ PAGE 4: BUSINESS IMPACT SUMMARY ============
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Section header with icon
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.circle(margin + 10, y + 6, 8, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("$", margin + 10, y + 10, { align: "center" });
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("What These Improvements Unlock", margin + 25, y + 10);
  y += 30;
  
  const businessImpacts = generateBusinessImpact(originalResults, optimizedResults, originalStatus, optimizedStatus);
  
  if (businessImpacts.length === 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Unable to generate impact summary due to page access limitations.", margin, y);
    y += 15;
  } else {
    businessImpacts.forEach((impact, index) => {
      addPageIfNeeded(25);
      
      // Impact card
      doc.setFillColor(index === 0 ? colors.successLight[0] : colors.neutralLight[0], 
                       index === 0 ? colors.successLight[1] : colors.neutralLight[1], 
                       index === 0 ? colors.successLight[2] : colors.neutralLight[2]);
      doc.roundedRect(margin, y, contentWidth, 22, 4, 4, "F");
      
      // Check icon
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.circle(margin + 14, y + 11, 6, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("✓", margin + 14, y + 14, { align: "center" });
      
      // Impact text
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(impact, margin + 28, y + 14);
      
      y += 30;
    });
  }
  
  y += 15;
  
  // ============ NOT SCORABLE EXPLANATION ============
  addPageIfNeeded(55);
  
  doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
  doc.roundedRect(margin, y, contentWidth, 45, 4, 4, "F");
  
  // Info badge
  doc.setFillColor(colors.amber[0], colors.amber[1], colors.amber[2]);
  doc.roundedRect(margin + 10, y + 8, 90, 16, 3, 3, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NOT SCORABLE", margin + 55, y + 19, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("Not Scorable means the page could not be accessed publicly at the", margin + 10, y + 33);
  doc.text("time of analysis. Scores are never guessed or penalized.", margin + 10, y + 42);
  
  // ============ FOOTER ============
  addFooter();

  // Save
  const filename = `website-transformation-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
