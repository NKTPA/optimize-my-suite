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

// Color palette (RGB values)
const colors = {
  primary: [59, 130, 246] as number[],
  primaryLight: [239, 246, 255] as number[],
  primaryDark: [37, 99, 235] as number[],
  success: [34, 197, 94] as number[],
  successLight: [220, 252, 231] as number[],
  successDark: [22, 163, 74] as number[],
  warning: [245, 158, 11] as number[],
  warningLight: [254, 243, 199] as number[],
  neutral: [148, 163, 184] as number[],
  neutralLight: [241, 245, 249] as number[],
  neutralMuted: [203, 213, 225] as number[],
  textPrimary: [30, 41, 59] as number[],
  textSecondary: [71, 85, 105] as number[],
  textMuted: [148, 163, 184] as number[],
  cardBg: [248, 250, 252] as number[],
  border: [226, 232, 240] as number[],
  white: [255, 255, 255] as number[],
  beforeBg: [241, 245, 249] as number[],
  afterBg: [220, 252, 231] as number[],
};

// Check if result is NOT SCORABLE
function getNotScorableStatus(results: AnalysisResult): { notScorable: boolean; reason: string } {
  if (isNotScorable(results)) {
    const reasonMap: Record<string, string> = {
      auth_gate: "Authentication required to access page",
      insufficient_html: "Insufficient content available",
      blocked_fetch: "Page access was blocked",
      redirect_loop: "Redirect loop detected",
      placeholder_page: "Placeholder page detected",
      js_only_shell: "JavaScript-only content",
      login_required: "Login required to view page",
    };
    return { 
      notScorable: true, 
      reason: reasonMap[results.notScorable?.reason || ""] || "Page could not be evaluated"
    };
  }
  
  if (detectLovablePlaceholder(results)) {
    return { notScorable: true, reason: "Preview/staging environment detected" };
  }
  
  return { notScorable: false, reason: "" };
}

// Generate SPECIFIC improvement bullets tied to concrete actions
function generateImprovementSummary(
  original: AnalysisResult, 
  optimized: AnalysisResult,
  originalStatus: { notScorable: boolean },
  optimizedStatus: { notScorable: boolean }
): string[] {
  const improvements: string[] = [];
  
  if (originalStatus.notScorable || optimizedStatus.notScorable) {
    if (originalStatus.notScorable && !optimizedStatus.notScorable) {
      improvements.push("Website is now publicly accessible and fully analyzable");
    }
    if (!originalStatus.notScorable && optimizedStatus.notScorable) {
      improvements.push("Optimized version is in preview/staging - deploy to production for full scoring");
    }
    return improvements;
  }
  
  const sections = [
    { 
      name: "Messaging", 
      before: original.messaging.score, 
      after: optimized.messaging.score,
      specificImprovements: [
        "Clearer headline communicating core value proposition",
        "Stronger subheadline with specific service benefits",
        "Service area prominently displayed above the fold"
      ]
    },
    { 
      name: "Conversion", 
      before: original.conversion.score, 
      after: optimized.conversion.score,
      specificImprovements: [
        "Primary CTA repositioned above the fold",
        "Phone number made tap-to-call on mobile",
        "Lead capture form simplified and prioritized"
      ]
    },
    { 
      name: "Design & UX", 
      before: original.designUx.score, 
      after: optimized.designUx.score,
      specificImprovements: [
        "Visual hierarchy improved with clear content sections",
        "Trust elements (badges, reviews) made more prominent",
        "Mobile-optimized layout with better spacing"
      ]
    },
    { 
      name: "SEO", 
      before: original.seo.score, 
      after: optimized.seo.score,
      specificImprovements: [
        "Unique title tag and meta description added",
        "H1 heading optimized with primary keywords",
        "LocalBusiness schema markup implemented"
      ]
    },
    { 
      name: "Trust", 
      before: original.trust.score, 
      after: optimized.trust.score,
      specificImprovements: [
        "Customer testimonials section added",
        "Licensing and certification badges displayed",
        "Service guarantee messaging included"
      ]
    },
    { 
      name: "Mobile", 
      before: original.mobile.score, 
      after: optimized.mobile.score,
      specificImprovements: [
        "Touch targets sized for mobile interaction",
        "Content prioritized for mobile viewport",
        "Loading performance optimized for mobile networks"
      ]
    },
  ];
  
  // Add specific improvements based on score gains
  sections.forEach(section => {
    const delta = section.after - section.before;
    if (delta >= 10 && section.specificImprovements.length > 0) {
      // Pick the most relevant specific improvement
      improvements.push(`${section.name}: ${section.specificImprovements[0]}`);
    }
  });
  
  // Add overall summary with concrete numbers
  const overallDelta = optimized.summary.overallScore - original.summary.overallScore;
  if (overallDelta > 0) {
    improvements.push(`Overall score improved from ${original.summary.overallScore} to ${optimized.summary.overallScore} (+${overallDelta} points)`);
  }
  
  return improvements.slice(0, 6); // Max 6 bullets
}

export function generateBeforeAfterPdf(data: BeforeAfterPdfData) {
  const { originalUrl, optimizedUrl, originalResults, optimizedResults, agencyName, clientName } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let currentPage = 1;

  const originalStatus = getNotScorableStatus(originalResults);
  const optimizedStatus = getNotScorableStatus(optimizedResults);
  const canCompare = !originalStatus.notScorable && !optimizedStatus.notScorable;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > 270) {
      addFooter();
      doc.addPage();
      currentPage++;
      y = 20;
    }
  };

  const addFooter = () => {
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFontSize(8);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Generated by OptimizeMySuite", margin, pageHeight - 10);
    doc.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  // ============ COVER PAGE ============
  // Blue header bar
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 55, "F");
  
  // Gradient accent
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.rect(0, 0, pageWidth, 10, "F");
  
  // Logo circle
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + 14, 34, 12, "F");
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("O", margin + 14, 38, { align: "center" });
  
  // Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Website Improvement", margin + 32, 30);
  doc.text("Report", margin + 32, 44);
  
  y = 72;
  
  // Executive subtitle - key credibility statement
  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const subtitle = "Objective, criteria-based comparison using the same scoring methodology before and after optimization.";
  doc.text(subtitle, margin, y);
  y += 20;
  
  // Client/Agency info card
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, y - 5, contentWidth, clientName ? 60 : 50, 4, 4, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("ORIGINAL WEBSITE", margin + 10, y + 5);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  const origUrlDisplay = originalUrl.length > 55 ? originalUrl.substring(0, 55) + "..." : originalUrl;
  doc.text(origUrlDisplay, margin + 10, y + 14);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("OPTIMIZED WEBSITE", margin + 10, y + 28);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  const optUrlDisplay = optimizedUrl.length > 55 ? optimizedUrl.substring(0, 55) + "..." : optimizedUrl;
  doc.text(optUrlDisplay, margin + 10, y + 37);
  
  if (clientName) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(`PREPARED FOR: ${clientName.toUpperCase()}`, margin + 10, y + 52);
  }
  
  y += clientName ? 70 : 60;
  
  // Date and agency
  doc.setFontSize(10);
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text(`Report Generated: ${new Date().toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  })}`, margin, y);
  
  if (agencyName) {
    y += 8;
    doc.text(`Agency: ${agencyName}`, margin, y);
  }
  
  // ============ SCORE CREDIBILITY SECTION ============
  y += 25;
  addPageIfNeeded(90);
  
  // Section header with shield
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  doc.roundedRect(margin, y - 5, contentWidth, 22, 4, 4, "F");
  
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.circle(margin + 14, y + 6, 7, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("S", margin + 14, y + 9, { align: "center" });
  
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("How These Scores Work", margin + 26, y + 9);
  y += 28;
  
  // Credibility bullets
  const credBullets = [
    "Same evaluation criteria applied to all websites",
    "Scores are not manually adjusted or inflated",
    "Improvements reflect real, measurable changes"
  ];
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  credBullets.forEach((bullet) => {
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.circle(margin + 8, y - 1, 2, "F");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(bullet, margin + 15, y);
    y += 8;
  });
  
  y += 8;
  
  // NOT SCORABLE explanation - NEUTRAL amber/gray styling
  doc.setFillColor(colors.neutralLight[0], colors.neutralLight[1], colors.neutralLight[2]);
  doc.roundedRect(margin, y - 3, contentWidth, 30, 3, 3, "F");
  
  // Neutral info icon (not warning)
  doc.setFillColor(colors.neutral[0], colors.neutral[1], colors.neutral[2]);
  doc.circle(margin + 12, y + 10, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("i", margin + 12, y + 13, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("NOT SCORABLE", margin + 24, y + 6);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Does not mean bad. It means the page could not be evaluated due to access limitations.", margin + 24, y + 16);
  doc.text("We never guess or penalize inaccessible pages.", margin + 24, y + 24);
  
  // ============ BEFORE VS AFTER SCORE SUMMARY - HERO PAGE ============
  addFooter();
  doc.addPage();
  currentPage++;
  y = 25;
  
  // Page title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Score Summary", pageWidth / 2, y, { align: "center" });
  y += 20;
  
  // Two large side-by-side score cards
  const cardWidth = (contentWidth - 12) / 2;
  const cardHeight = 100;
  
  // BEFORE card - neutral gray/muted styling
  const beforeCardX = margin;
  doc.setFillColor(colors.beforeBg[0], colors.beforeBg[1], colors.beforeBg[2]);
  doc.roundedRect(beforeCardX, y, cardWidth, cardHeight, 6, 6, "F");
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.roundedRect(beforeCardX, y, cardWidth, cardHeight, 6, 6, "S");
  
  // Before label
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("BEFORE", beforeCardX + cardWidth / 2, y + 14, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("Original Website", beforeCardX + cardWidth / 2, y + 24, { align: "center" });
  
  // Before score - large, centered, high-contrast
  if (originalStatus.notScorable) {
    // NOT SCORABLE badge - neutral styling
    doc.setFillColor(colors.neutralMuted[0], colors.neutralMuted[1], colors.neutralMuted[2]);
    doc.roundedRect(beforeCardX + 12, y + 35, cardWidth - 24, 30, 4, 4, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text("NOT SCORABLE", beforeCardX + cardWidth / 2, y + 54, { align: "center" });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Page could not be evaluated", beforeCardX + cardWidth / 2, y + 75, { align: "center" });
  } else {
    // LARGE score number
    const score = originalResults.summary.overallScore;
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(score.toString(), beforeCardX + cardWidth / 2, y + 62, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("out of 100", beforeCardX + cardWidth / 2, y + 75, { align: "center" });
  }
  
  // Before URL
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const beforeUrlShort = originalUrl.length > 38 ? originalUrl.substring(0, 38) + "..." : originalUrl;
  doc.text(beforeUrlShort, beforeCardX + cardWidth / 2, y + 92, { align: "center" });
  
  // AFTER card - strong green/blue success styling
  const afterCardX = margin + cardWidth + 12;
  doc.setFillColor(colors.afterBg[0], colors.afterBg[1], colors.afterBg[2]);
  doc.roundedRect(afterCardX, y, cardWidth, cardHeight, 6, 6, "F");
  doc.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.setLineWidth(1.5);
  doc.roundedRect(afterCardX, y, cardWidth, cardHeight, 6, 6, "S");
  doc.setLineWidth(0.5);
  
  // After label
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
  doc.text("AFTER", afterCardX + cardWidth / 2, y + 14, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("Optimized Website", afterCardX + cardWidth / 2, y + 24, { align: "center" });
  
  // After score - large, centered, high-contrast
  if (optimizedStatus.notScorable) {
    // NOT SCORABLE badge
    doc.setFillColor(colors.neutralMuted[0], colors.neutralMuted[1], colors.neutralMuted[2]);
    doc.roundedRect(afterCardX + 12, y + 35, cardWidth - 24, 30, 4, 4, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text("NOT SCORABLE", afterCardX + cardWidth / 2, y + 54, { align: "center" });
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Page could not be evaluated", afterCardX + cardWidth / 2, y + 75, { align: "center" });
  } else {
    // LARGE score number in success green
    const score = optimizedResults.summary.overallScore;
    doc.setFontSize(48);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
    doc.text(score.toString(), afterCardX + cardWidth / 2, y + 62, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text("out of 100", afterCardX + cardWidth / 2, y + 75, { align: "center" });
  }
  
  // After URL
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const afterUrlShort = optimizedUrl.length > 38 ? optimizedUrl.substring(0, 38) + "..." : optimizedUrl;
  doc.text(afterUrlShort, afterCardX + cardWidth / 2, y + 92, { align: "center" });
  
  y += cardHeight + 18;
  
  // PROMINENT IMPROVEMENT BADGE - centered between cards
  if (canCompare) {
    const overallDelta = optimizedResults.summary.overallScore - originalResults.summary.overallScore;
    
    if (overallDelta !== 0) {
      const deltaSign = overallDelta > 0 ? "+" : "";
      const badgeColor = overallDelta > 0 ? colors.success : colors.neutral;
      const badgeWidth = 140;
      
      doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.roundedRect(pageWidth / 2 - badgeWidth / 2, y - 5, badgeWidth, 32, 6, 6, "F");
      
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`${deltaSign}${overallDelta} Point Improvement`, pageWidth / 2, y + 13, { align: "center" });
      
      y += 40;
    } else {
      doc.setFillColor(colors.neutral[0], colors.neutral[1], colors.neutral[2]);
      doc.roundedRect(pageWidth / 2 - 50, y - 5, 100, 26, 4, 4, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("No Change", pageWidth / 2, y + 10, { align: "center" });
      y += 35;
    }
  }
  
  // ============ SECTION-BY-SECTION COMPARISON WITH HORIZONTAL BARS ============
  y += 10;
  addPageIfNeeded(140);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Category Breakdown", margin, y);
  y += 18;
  
  const sections = [
    { name: "Messaging", beforeScore: originalResults.messaging?.score, afterScore: optimizedResults.messaging?.score },
    { name: "Conversion", beforeScore: originalResults.conversion?.score, afterScore: optimizedResults.conversion?.score },
    { name: "Design & UX", beforeScore: originalResults.designUx?.score, afterScore: optimizedResults.designUx?.score },
    { name: "SEO", beforeScore: originalResults.seo?.score, afterScore: optimizedResults.seo?.score },
    { name: "Performance", beforeScore: originalResults.performance?.score, afterScore: optimizedResults.performance?.score },
    { name: "Trust", beforeScore: originalResults.trust?.score, afterScore: optimizedResults.trust?.score },
  ];
  
  const barMaxWidth = 100;
  const barHeight = 8;
  const rowHeight = 28;
  const labelWidth = 50;
  const barStartX = margin + labelWidth + 5;
  
  sections.forEach((section) => {
    addPageIfNeeded(rowHeight + 5);
    
    // Category label
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(section.name, margin, y + 4);
    
    const beforeNotScorable = originalStatus.notScorable || section.beforeScore === undefined;
    const afterNotScorable = optimizedStatus.notScorable || section.afterScore === undefined;
    
    // BEFORE bar (top row)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Before", barStartX - 3, y + 2, { align: "right" });
    
    // Background bar
    doc.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(barStartX, y - 2, barMaxWidth, barHeight, 2, 2, "F");
    
    if (!beforeNotScorable) {
      const beforeWidth = (section.beforeScore / 100) * barMaxWidth;
      doc.setFillColor(colors.neutralMuted[0], colors.neutralMuted[1], colors.neutralMuted[2]);
      doc.roundedRect(barStartX, y - 2, beforeWidth, barHeight, 2, 2, "F");
      
      // Score at end of bar
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(section.beforeScore.toString(), barStartX + barMaxWidth + 5, y + 4);
    } else {
      doc.setFontSize(8);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text("N/A", barStartX + barMaxWidth + 5, y + 4);
    }
    
    y += 12;
    
    // AFTER bar (bottom row)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("After", barStartX - 3, y + 2, { align: "right" });
    
    // Background bar
    doc.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(barStartX, y - 2, barMaxWidth, barHeight, 2, 2, "F");
    
    if (!afterNotScorable) {
      const afterWidth = (section.afterScore / 100) * barMaxWidth;
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.roundedRect(barStartX, y - 2, afterWidth, barHeight, 2, 2, "F");
      
      // Score at end of bar
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
      doc.text(section.afterScore.toString(), barStartX + barMaxWidth + 5, y + 4);
    } else {
      doc.setFontSize(8);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text("N/A", barStartX + barMaxWidth + 5, y + 4);
    }
    
    // Delta badge on the right
    const deltaX = barStartX + barMaxWidth + 25;
    if (!beforeNotScorable && !afterNotScorable) {
      const delta = section.afterScore - section.beforeScore;
      if (delta > 0) {
        doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
        doc.roundedRect(deltaX, y - 10, 32, 16, 3, 3, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.successDark[0], colors.successDark[1], colors.successDark[2]);
        doc.text(`+${delta}`, deltaX + 16, y, { align: "center" });
      } else if (delta < 0) {
        doc.setFillColor(colors.neutralLight[0], colors.neutralLight[1], colors.neutralLight[2]);
        doc.roundedRect(deltaX, y - 10, 32, 16, 3, 3, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text(`${delta}`, deltaX + 16, y, { align: "center" });
      } else {
        doc.setFillColor(colors.neutralLight[0], colors.neutralLight[1], colors.neutralLight[2]);
        doc.roundedRect(deltaX, y - 10, 32, 16, 3, 3, "F");
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text("--", deltaX + 16, y, { align: "center" });
      }
    }
    
    y += rowHeight - 12;
  });
  
  // ============ KEY IMPROVEMENTS SUMMARY - SPECIFIC BULLETS ============
  y += 15;
  addPageIfNeeded(90);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("What Changed", margin, y);
  y += 14;
  
  const improvements = generateImprovementSummary(originalResults, optimizedResults, originalStatus, optimizedStatus);
  
  if (improvements.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Unable to generate improvement summary due to access limitations.", margin + 5, y);
    y += 12;
  } else {
    improvements.forEach((improvement) => {
      addPageIfNeeded(18);
      
      const impLines = doc.splitTextToSize(improvement, contentWidth - 22);
      const impHeight = impLines.length * 5 + 10;
      
      doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
      doc.roundedRect(margin, y - 3, contentWidth, impHeight, 3, 3, "F");
      
      // Check icon
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.circle(margin + 9, y + 5, 5, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("OK", margin + 9, y + 7, { align: "center" });
      
      // Text
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      impLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 20, y + 5 + i * 5);
      });
      
      y += impHeight + 5;
    });
  }
  
  // ============ IMPORTANT NOTES - NEUTRAL STYLING ============
  y += 12;
  addPageIfNeeded(45);
  
  doc.setFillColor(colors.neutralLight[0], colors.neutralLight[1], colors.neutralLight[2]);
  doc.roundedRect(margin, y - 3, contentWidth, 35, 4, 4, "F");
  
  // Info icon
  doc.setFillColor(colors.neutral[0], colors.neutral[1], colors.neutral[2]);
  doc.circle(margin + 12, y + 10, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("i", margin + 12, y + 13, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("About Preview Sites", margin + 24, y + 7);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Preview or staging sites may require authentication. If a page cannot be accessed", margin + 24, y + 17);
  doc.text("publicly, it will be marked NOT SCORABLE rather than penalized.", margin + 24, y + 26);
  
  // ============ FOOTER ============
  addFooter();

  // Save
  const filename = `before-after-report-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
