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
  
  // Before - muted slate/gray (soft red undertone)
  beforeBg: [248, 245, 244] as number[],
  beforeAccent: [120, 113, 108] as number[],
  beforeMuted: [168, 162, 158] as number[],
  beforeSoftRed: [180, 120, 120] as number[],
  
  // After - vibrant success
  afterBg: [220, 252, 231] as number[],
  afterAccent: [22, 163, 74] as number[],
  
  // Neutral palette
  neutral50: [250, 250, 250] as number[],
  neutral100: [245, 245, 245] as number[],
  neutral200: [229, 229, 229] as number[],
  neutral300: [212, 212, 212] as number[],
  neutral400: [163, 163, 163] as number[],
  neutral500: [115, 115, 115] as number[],
  neutral600: [82, 82, 82] as number[],
  neutral700: [64, 64, 64] as number[],
  neutral800: [38, 38, 38] as number[],
  neutral900: [23, 23, 23] as number[],
  
  // Text hierarchy
  textPrimary: [23, 23, 23] as number[],
  textSecondary: [64, 64, 64] as number[],
  textMuted: [115, 115, 115] as number[],
  textLight: [163, 163, 163] as number[],
  
  // Amber for NOT SCORABLE (never red)
  amber: [180, 83, 9] as number[],
  amberLight: [254, 243, 199] as number[],
  amberMuted: [253, 230, 138] as number[],
  
  // Utility
  white: [255, 255, 255] as number[],
  border: [229, 229, 229] as number[],
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
function generateCategoryImpact(category: string, delta: number): { improvement: string; outcome: string; icon: string } | null {
  if (delta < 3) return null;
  
  const impacts: Record<string, { improvement: string; outcome: string; icon: string }> = {
    "Messaging": {
      improvement: "Clearer value proposition and headline",
      outcome: "Increases first-impression clarity and reduces bounce rate",
      icon: "💬"
    },
    "Conversion": {
      improvement: "Stronger CTAs and lead capture paths",
      outcome: "Creates clearer conversion paths for visitors",
      icon: "🎯"
    },
    "Design & UX": {
      improvement: "Enhanced visual hierarchy and user experience",
      outcome: "Keeps visitors engaged longer and exploring more",
      icon: "✨"
    },
    "SEO": {
      improvement: "Optimized metadata and content structure",
      outcome: "Increases discoverability and inbound traffic",
      icon: "🔍"
    },
    "Performance": {
      improvement: "Faster load times and optimized assets",
      outcome: "Reduces abandonment and improves satisfaction",
      icon: "⚡"
    },
    "Trust": {
      improvement: "Added credibility signals and social proof",
      outcome: "Reduces hesitation and increases form submissions",
      icon: "🛡️"
    },
    "Mobile": {
      improvement: "Responsive design and mobile-first layout",
      outcome: "Captures on-the-go users and mobile searches",
      icon: "📱"
    }
  };
  
  return impacts[category] || null;
}

// Get qualitative description for a category
function getCategoryQualitativeDescription(category: string, score: number | undefined, isNotScorable: boolean): string {
  if (isNotScorable || score === undefined) return "Not evaluated";
  
  const descriptions: Record<string, { low: string; mid: string; high: string }> = {
    "Messaging": {
      low: "Weak / unclear",
      mid: "Present but unfocused",
      high: "Clear, customer-focused"
    },
    "Conversion": {
      low: "Limited paths",
      mid: "Basic CTAs present",
      high: "Optimized CTAs"
    },
    "Design & UX": {
      low: "Needs improvement",
      mid: "Functional layout",
      high: "Polished experience"
    },
    "SEO": {
      low: "Low visibility",
      mid: "Basic optimization",
      high: "Search-ready"
    },
    "Performance": {
      low: "Slow loading",
      mid: "Acceptable speed",
      high: "Fast & optimized"
    },
    "Trust": {
      low: "Minimal signals",
      mid: "Some credibility",
      high: "Credibility established"
    },
    "Mobile": {
      low: "Poor mobile UX",
      mid: "Mobile-functional",
      high: "Mobile-optimized"
    }
  };
  
  const desc = descriptions[category] || { low: "Needs work", mid: "Adequate", high: "Strong" };
  
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

  const addFooter = () => {
    doc.setDrawColor(colors.neutral200[0], colors.neutral200[1], colors.neutral200[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Generated by OptimizeMySuite", margin, pageHeight - 8);
    
    const dateStr = new Date().toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
    doc.text(dateStr, pageWidth / 2, pageHeight - 8, { align: "center" });
    doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  };

  // ════════════════════════════════════════════════════════════════
  // PAGE 1: EXECUTIVE COVER (IMPACT FIRST)
  // ════════════════════════════════════════════════════════════════
  
  // Clean white background with generous spacing
  y = 45;
  
  // Main headline - large, bold, executive
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Website Performance", pageWidth / 2, y, { align: "center" });
  doc.text("Transformation Report", pageWidth / 2, y + 14, { align: "center" });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Objective, criteria-based improvement using the same scoring methodology", pageWidth / 2, y + 32, { align: "center" });
  
  y = 105;
  
  // ═══════ HERO DELTA CALLOUT - THE CENTERPIECE ═══════
  if (canCompare) {
    const beforeScore = originalResults.summary.overallScore;
    const afterScore = optimizedResults.summary.overallScore;
    const deltaSign = overallDelta > 0 ? "+" : "";
    
    // Large hero improvement badge - the visual centerpiece
    const heroWidth = 180;
    const heroHeight = 75;
    const heroX = (pageWidth - heroWidth) / 2;
    
    // Green background with gradient effect
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.roundedRect(heroX, y, heroWidth, heroHeight, 12, 12, "F");
    
    // Darker inner layer for depth
    doc.setFillColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
    doc.roundedRect(heroX + 4, y + 4, heroWidth - 8, heroHeight - 8, 10, 10, "F");
    
    // Upward arrow indicator
    doc.setFillColor(255, 255, 255);
    const arrowX = heroX + 30;
    const arrowY = y + heroHeight / 2;
    doc.triangle(arrowX, arrowY + 8, arrowX + 16, arrowY + 8, arrowX + 8, arrowY - 8, "F");
    
    // MASSIVE delta number
    doc.setFontSize(52);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${deltaSign}${overallDelta}`, heroX + 80, y + 50, { align: "center" });
    
    // "POINT IMPROVEMENT" label
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("POINT", heroX + 125, y + 35);
    doc.text("IMPROVEMENT", heroX + 125, y + 50);
    
    y += heroHeight + 20;
    
    // Credibility line under the hero
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Measured using identical criteria before and after optimization", pageWidth / 2, y, { align: "center" });
    
    y += 25;
    
  } else {
    // Cannot compare state - professional amber notice
    doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
    doc.roundedRect(margin + 20, y, contentWidth - 40, 55, 8, 8, "F");
    doc.setDrawColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.setLineWidth(1);
    doc.roundedRect(margin + 20, y, contentWidth - 40, 55, 8, 8, "S");
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.text("Score Comparison Limited", pageWidth / 2, y + 22, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.neutral600[0], colors.neutral600[1], colors.neutral600[2]);
    doc.text("One or both pages could not be fully evaluated at time of analysis", pageWidth / 2, y + 40, { align: "center" });
    
    y += 75;
  }
  
  // ═══════ URL CARDS ═══════
  const urlCardHeight = 35;
  
  // BEFORE URL Card
  doc.setFillColor(colors.beforeBg[0], colors.beforeBg[1], colors.beforeBg[2]);
  doc.roundedRect(margin, y, contentWidth, urlCardHeight, 6, 6, "F");
  doc.setDrawColor(colors.beforeMuted[0], colors.beforeMuted[1], colors.beforeMuted[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, urlCardHeight, 6, 6, "S");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
  doc.text("BEFORE — Original Website", margin + 12, y + 14);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text(truncateUrl(originalUrl, 70), margin + 12, y + 26);
  
  y += urlCardHeight + 8;
  
  // AFTER URL Card
  doc.setFillColor(colors.afterBg[0], colors.afterBg[1], colors.afterBg[2]);
  doc.roundedRect(margin, y, contentWidth, urlCardHeight, 6, 6, "F");
  doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.setLineWidth(1.5);
  doc.roundedRect(margin, y, contentWidth, urlCardHeight, 6, 6, "S");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.afterAccent[0], colors.afterAccent[1], colors.afterAccent[2]);
  doc.text("AFTER — Optimized Website", margin + 12, y + 14);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text(truncateUrl(optimizedUrl, 70), margin + 12, y + 26);
  
  y += urlCardHeight + 20;
  
  // ═══════ FOOTER CREDIBILITY LINE ═══════
  doc.setDrawColor(colors.neutral200[0], colors.neutral200[1], colors.neutral200[2]);
  doc.setLineWidth(0.5);
  doc.line(margin + 30, y, pageWidth - margin - 30, y);
  
  y += 12;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Same scoring system  •  No manual adjustments  •  Measurable gains", pageWidth / 2, y, { align: "center" });
  
  // Client/Agency info at bottom
  y += 18;
  if (clientName || agencyName) {
    doc.setFontSize(9);
    if (clientName) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(`Prepared for: ${clientName}`, pageWidth / 2, y, { align: "center" });
      y += 12;
    }
    if (agencyName) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text(`By: ${agencyName}`, pageWidth / 2, y, { align: "center" });
    }
  }
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 2: SCORE TRANSFORMATION SNAPSHOT
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 30;
  
  // Page header
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Score Transformation", pageWidth / 2, y, { align: "center" });
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Visual comparison using identical evaluation criteria", pageWidth / 2, y + 14, { align: "center" });
  
  y = 70;
  
  // Side-by-side score display
  const cardWidth = 75;
  const cardHeight = 90;
  const gap = 30;
  const leftCardX = (pageWidth - (cardWidth * 2 + gap)) / 2;
  const rightCardX = leftCardX + cardWidth + gap;
  
  if (canCompare) {
    const beforeScore = originalResults.summary.overallScore;
    const afterScore = optimizedResults.summary.overallScore;
    
    // BEFORE Card - muted gray
    doc.setFillColor(colors.beforeBg[0], colors.beforeBg[1], colors.beforeBg[2]);
    doc.roundedRect(leftCardX, y, cardWidth, cardHeight, 8, 8, "F");
    doc.setDrawColor(colors.beforeMuted[0], colors.beforeMuted[1], colors.beforeMuted[2]);
    doc.setLineWidth(1);
    doc.roundedRect(leftCardX, y, cardWidth, cardHeight, 8, 8, "S");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
    doc.text("BEFORE", leftCardX + cardWidth / 2, y + 18, { align: "center" });
    
    // Large score number
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.neutral500[0], colors.neutral500[1], colors.neutral500[2]);
    doc.text(beforeScore.toString(), leftCardX + cardWidth / 2, y + 60, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Original Score", leftCardX + cardWidth / 2, y + 78, { align: "center" });
    
    // AFTER Card - vibrant green
    doc.setFillColor(colors.afterBg[0], colors.afterBg[1], colors.afterBg[2]);
    doc.roundedRect(rightCardX, y, cardWidth, cardHeight, 8, 8, "F");
    doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.setLineWidth(2);
    doc.roundedRect(rightCardX, y, cardWidth, cardHeight, 8, 8, "S");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.afterAccent[0], colors.afterAccent[1], colors.afterAccent[2]);
    doc.text("AFTER", rightCardX + cardWidth / 2, y + 18, { align: "center" });
    
    // Large score number
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
    doc.text(afterScore.toString(), rightCardX + cardWidth / 2, y + 60, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.text("Optimized Score", rightCardX + cardWidth / 2, y + 78, { align: "center" });
    
    // DELTA badge in center
    const deltaY = y + cardHeight / 2 - 15;
    const deltaWidth = 55;
    const deltaHeight = 30;
    const deltaX = (pageWidth - deltaWidth) / 2;
    
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.roundedRect(deltaX, deltaY, deltaWidth, deltaHeight, 6, 6, "F");
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const deltaSign = overallDelta > 0 ? "+" : "";
    doc.text(`${deltaSign}${overallDelta}`, deltaX + deltaWidth / 2, deltaY + 20, { align: "center" });
    
    y += cardHeight + 30;
    
    // Caption
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Both scores were generated using the exact same scoring criteria.", pageWidth / 2, y, { align: "center" });
    
  } else {
    // Handle NOT SCORABLE case
    doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
    doc.roundedRect(margin, y, contentWidth, 60, 8, 8, "F");
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.text("Unable to Compare Scores", pageWidth / 2, y + 25, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.neutral600[0], colors.neutral600[1], colors.neutral600[2]);
    doc.text("One or both pages could not be accessed for analysis", pageWidth / 2, y + 42, { align: "center" });
  }
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 3: WHERE THE BIGGEST GAINS WERE MADE
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 28;
  
  // Page header with accent bar
  doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.roundedRect(margin, y - 3, 5, 28, 2, 2, "F");
  
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Where the Biggest Gains Were Made", margin + 15, y + 5);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Categories ranked by improvement magnitude", margin + 15, y + 18);
  
  y += 42;
  
  // Get sorted sections (largest delta first)
  const sortedSections = getSortedSections(originalResults, optimizedResults, originalStatus, optimizedStatus);
  
  const rowHeight = 42;
  const barMaxWidth = 80;
  const barHeight = 10;
  
  sortedSections.forEach((section) => {
    // Category container with subtle background
    doc.setFillColor(colors.neutral50[0], colors.neutral50[1], colors.neutral50[2]);
    doc.roundedRect(margin, y, contentWidth, rowHeight, 6, 6, "F");
    
    // Category name - large and bold on left
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(section.name, margin + 12, y + 16);
    
    // Score displays
    const scoreStartX = margin + 85;
    
    // BEFORE score - small, muted
    if (!section.beforeNotScorable) {
      doc.setFillColor(colors.beforeBg[0], colors.beforeBg[1], colors.beforeBg[2]);
      doc.roundedRect(scoreStartX, y + 8, 32, 26, 4, 4, "F");
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.neutral500[0], colors.neutral500[1], colors.neutral500[2]);
      doc.text(section.beforeScore!.toString(), scoreStartX + 16, y + 25, { align: "center" });
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.text("N/A", scoreStartX + 16, y + 24, { align: "center" });
    }
    
    // Arrow
    doc.setFontSize(12);
    doc.setTextColor(colors.neutral400[0], colors.neutral400[1], colors.neutral400[2]);
    doc.text("→", scoreStartX + 42, y + 24);
    
    // AFTER score - bold, green
    const afterScoreX = scoreStartX + 52;
    if (!section.afterNotScorable) {
      doc.setFillColor(colors.afterBg[0], colors.afterBg[1], colors.afterBg[2]);
      doc.roundedRect(afterScoreX, y + 8, 32, 26, 4, 4, "F");
      doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.setLineWidth(1.5);
      doc.roundedRect(afterScoreX, y + 8, 32, 26, 4, 4, "S");
      
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
      doc.text(section.afterScore!.toString(), afterScoreX + 16, y + 25, { align: "center" });
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
      doc.text("N/A", afterScoreX + 16, y + 24, { align: "center" });
    }
    
    // BIG DELTA BADGE on the right
    const deltaX = pageWidth - margin - 55;
    
    if (!section.beforeNotScorable && !section.afterNotScorable) {
      const delta = section.delta;
      
      if (delta > 0) {
        // Positive delta - vibrant green badge
        doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
        doc.roundedRect(deltaX, y + 8, 50, 26, 5, 5, "F");
        
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(`+${delta}`, deltaX + 25, y + 25, { align: "center" });
      } else if (delta < 0) {
        // Negative delta - muted gray
        doc.setFillColor(colors.neutral300[0], colors.neutral300[1], colors.neutral300[2]);
        doc.roundedRect(deltaX, y + 8, 50, 26, 5, 5, "F");
        
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.neutral600[0], colors.neutral600[1], colors.neutral600[2]);
        doc.text(`${delta}`, deltaX + 25, y + 25, { align: "center" });
      } else {
        // No change
        doc.setFillColor(colors.neutral200[0], colors.neutral200[1], colors.neutral200[2]);
        doc.roundedRect(deltaX, y + 8, 50, 26, 5, 5, "F");
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text("—", deltaX + 25, y + 25, { align: "center" });
      }
    }
    
    y += rowHeight + 5;
  });
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 4: WHAT THESE IMPROVEMENTS UNLOCK (BUSINESS VALUE)
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 28;
  
  // Page header with accent
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, y - 3, 5, 28, 2, 2, "F");
  
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("What These Improvements Unlock", margin + 15, y + 5);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Business outcomes from measurable website quality gains", margin + 15, y + 18);
  
  y += 45;
  
  // Generate impact cards for categories with meaningful improvements
  let hasImpacts = false;
  
  sortedSections.forEach((section) => {
    const impact = generateCategoryImpact(section.name, section.delta);
    if (!impact) return;
    
    hasImpacts = true;
    
    // Impact card with clean design
    doc.setFillColor(colors.neutral50[0], colors.neutral50[1], colors.neutral50[2]);
    doc.roundedRect(margin, y, contentWidth, 50, 8, 8, "F");
    
    // Left accent bar (green)
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.roundedRect(margin, y, 5, 50, 2, 2, "F");
    
    // Icon placeholder (using text for now)
    doc.setFontSize(18);
    doc.text(impact.icon, margin + 18, y + 22);
    
    // Category name + delta badge
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(section.name, margin + 35, y + 18);
    
    // Delta pill inline
    const nameWidth = doc.getTextWidth(section.name);
    doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
    doc.roundedRect(margin + 38 + nameWidth, y + 8, 32, 16, 8, 8, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
    doc.text(`+${section.delta}`, margin + 54 + nameWidth, y + 19, { align: "center" });
    
    // Business outcome - the key selling point
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(impact.outcome, margin + 35, y + 38);
    
    y += 58;
  });
  
  // If no meaningful improvements
  if (!hasImpacts) {
    doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
    doc.roundedRect(margin, y, contentWidth, 45, 8, 8, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(colors.amber[0], colors.amber[1], colors.amber[2]);
    doc.text("Limited improvement data available for business impact analysis", pageWidth / 2, y + 26, { align: "center" });
  }
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 5: BEFORE VS AFTER SUMMARY (CLIENT-FRIENDLY TABLE)
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 28;
  
  // Page header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Before vs After Summary", margin, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Qualitative comparison — no jargon, just clarity", margin, y + 14);
  
  y += 35;
  
  // Table header
  const col1Width = 55;
  const col2Width = (contentWidth - col1Width) / 2;
  
  doc.setFillColor(colors.neutral100[0], colors.neutral100[1], colors.neutral100[2]);
  doc.rect(margin, y, contentWidth, 22, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("Area", margin + 10, y + 14);
  doc.text("Before", margin + col1Width + col2Width / 2, y + 14, { align: "center" });
  doc.text("After", margin + col1Width + col2Width + col2Width / 2, y + 14, { align: "center" });
  
  y += 22;
  
  // Table rows
  sortedSections.forEach((section, index) => {
    const rowBg = index % 2 === 0 ? colors.white : colors.neutral50;
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(margin, y, contentWidth, 28, "F");
    
    // Draw subtle border
    doc.setDrawColor(colors.neutral200[0], colors.neutral200[1], colors.neutral200[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 28, margin + contentWidth, y + 28);
    
    // Area name
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(section.name, margin + 10, y + 18);
    
    // Before description - muted
    const beforeDesc = getCategoryQualitativeDescription(section.name, section.beforeScore, section.beforeNotScorable);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.beforeAccent[0], colors.beforeAccent[1], colors.beforeAccent[2]);
    doc.text(beforeDesc, margin + col1Width + col2Width / 2, y + 18, { align: "center" });
    
    // After description - green accent
    const afterDesc = getCategoryQualitativeDescription(section.name, section.afterScore, section.afterNotScorable);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.afterAccent[0], colors.afterAccent[1], colors.afterAccent[2]);
    doc.text(afterDesc, margin + col1Width + col2Width + col2Width / 2, y + 18, { align: "center" });
    
    y += 28;
  });
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 6: SCORE CREDIBILITY & NOT SCORABLE EXPLANATION
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 28;
  
  // Page header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("How to Interpret These Scores", margin, y);
  
  y += 28;
  
  // Credibility section
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  doc.roundedRect(margin, y, contentWidth, 95, 8, 8, "F");
  
  // Left accent
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(margin, y, 5, 95, 2, 2, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text("Scoring Methodology", margin + 18, y + 22);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  
  const credibilityPoints = [
    "Scores are based on objective, criteria-based analysis of website content",
    "Both before and after analyses use identical evaluation methodology",
    "No manual adjustments or subjective modifications are applied",
    "Results reflect measurable improvements in website quality metrics"
  ];
  
  let pointY = y + 40;
  credibilityPoints.forEach((point) => {
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.circle(margin + 25, pointY - 2, 2.5, "F");
    doc.text(point, margin + 35, pointY);
    pointY += 14;
  });
  
  y += 115;
  
  // NOT SCORABLE explanation section - professional amber
  doc.setFillColor(colors.amberLight[0], colors.amberLight[1], colors.amberLight[2]);
  doc.roundedRect(margin, y, contentWidth, 90, 8, 8, "F");
  
  // Amber accent
  doc.setFillColor(colors.amber[0], colors.amber[1], colors.amber[2]);
  doc.roundedRect(margin, y, 5, 90, 2, 2, "F");
  
  // NOT SCORABLE badge
  doc.setFillColor(colors.amber[0], colors.amber[1], colors.amber[2]);
  doc.roundedRect(margin + 18, y + 15, 90, 20, 4, 4, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("NOT SCORABLE", margin + 63, y + 28, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.neutral700[0], colors.neutral700[1], colors.neutral700[2]);
  doc.text("does not mean poor performance", margin + 115, y + 28);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.neutral600[0], colors.neutral600[1], colors.neutral600[2]);
  doc.text("It means the page could not be accessed publicly at the time of analysis.", margin + 18, y + 50);
  doc.text("Common causes include authentication gates, private staging environments,", margin + 18, y + 64);
  doc.text("or temporary access restrictions. Scores are never guessed or penalized.", margin + 18, y + 78);
  
  addFooter();
  
  // ════════════════════════════════════════════════════════════════
  // PAGE 7: CLOSING PAGE
  // ════════════════════════════════════════════════════════════════
  doc.addPage();
  currentPage++;
  y = 50;
  
  // Centered closing content
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("What This Means Going Forward", pageWidth / 2, y, { align: "center" });
  
  y += 35;
  
  // Key takeaways card
  doc.setFillColor(colors.neutral50[0], colors.neutral50[1], colors.neutral50[2]);
  doc.roundedRect(margin + 10, y, contentWidth - 20, 100, 10, 10, "F");
  
  const takeaways = [
    "This improvement reflects measurable gains in clarity, structure, and performance",
    "Continued optimization compounds results over time",
    "The same scoring system can be used to track future progress",
    "These results provide a foundation for ongoing website improvement"
  ];
  
  let takeawayY = y + 25;
  takeaways.forEach((takeaway) => {
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.circle(margin + 28, takeawayY - 2, 3, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(takeaway, margin + 40, takeawayY);
    takeawayY += 20;
  });
  
  y += 130;
  
  // Thank you / branding
  if (canCompare) {
    doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
    doc.roundedRect(margin + 30, y, contentWidth - 60, 45, 8, 8, "F");
    
    const deltaSign = overallDelta > 0 ? "+" : "";
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
    doc.text(`${deltaSign}${overallDelta} Point Improvement Achieved`, pageWidth / 2, y + 28, { align: "center" });
  }
  
  addFooter();

  // Save
  const filename = `website-transformation-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
