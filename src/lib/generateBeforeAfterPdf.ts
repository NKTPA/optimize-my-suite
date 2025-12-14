import jsPDF from "jspdf";
import { AnalysisResult, isNotScorable, detectLovablePlaceholder } from "@/types/analysis";
import { CREDIBILITY_STANDARD } from "@/components/scoring/ScoreCredibilityStatement";

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
  successLight: [240, 253, 244] as number[],
  warning: [245, 158, 11] as number[],
  warningLight: [254, 243, 199] as number[],
  neutral: [148, 163, 184] as number[],
  neutralLight: [241, 245, 249] as number[],
  textPrimary: [30, 41, 59] as number[],
  textSecondary: [71, 85, 105] as number[],
  textMuted: [148, 163, 184] as number[],
  cardBg: [248, 250, 252] as number[],
  border: [226, 232, 240] as number[],
  white: [255, 255, 255] as number[],
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

// Get improvement summary based on score differences
function generateImprovementSummary(
  original: AnalysisResult, 
  optimized: AnalysisResult,
  originalStatus: { notScorable: boolean },
  optimizedStatus: { notScorable: boolean }
): string[] {
  const improvements: string[] = [];
  
  if (originalStatus.notScorable || optimizedStatus.notScorable) {
    if (originalStatus.notScorable && !optimizedStatus.notScorable) {
      improvements.push("The optimized website is now publicly accessible and fully analyzable");
    }
    if (!originalStatus.notScorable && optimizedStatus.notScorable) {
      improvements.push("The optimized version is currently in a preview/staging environment");
    }
    return improvements;
  }
  
  const sections = [
    { name: "Messaging", before: original.messaging.score, after: optimized.messaging.score },
    { name: "Conversion", before: original.conversion.score, after: optimized.conversion.score },
    { name: "Design & UX", before: original.designUx.score, after: optimized.designUx.score },
    { name: "SEO", before: original.seo.score, after: optimized.seo.score },
    { name: "Trust", before: original.trust.score, after: optimized.trust.score },
    { name: "Mobile", before: original.mobile.score, after: optimized.mobile.score },
  ];
  
  // Find significant improvements
  sections.forEach(section => {
    const delta = section.after - section.before;
    if (delta >= 15) {
      improvements.push(`${section.name} significantly improved (+${delta} points) with enhanced content and structure`);
    } else if (delta >= 5) {
      improvements.push(`${section.name} improved (+${delta} points) with targeted optimizations`);
    }
  });
  
  // Add overall summary
  const overallDelta = optimized.summary.overallScore - original.summary.overallScore;
  if (overallDelta > 0) {
    improvements.push(`Overall website performance increased by ${overallDelta} points`);
  }
  
  // Add specific improvement types based on scores
  if (optimized.messaging.score > original.messaging.score) {
    improvements.push("Clearer value proposition and messaging hierarchy");
  }
  if (optimized.conversion.score > original.conversion.score) {
    improvements.push("Improved call-to-action placement and lead capture elements");
  }
  if (optimized.seo.score > original.seo.score) {
    improvements.push("Enhanced SEO structure with optimized meta tags and headings");
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
  doc.rect(0, 0, pageWidth, 50, "F");
  
  // Gradient accent
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.rect(0, 0, pageWidth, 8, "F");
  
  // Logo/icon
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + 12, 30, 10, "F");
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(14);
  doc.text("◈", margin + 12, 34, { align: "center" });
  
  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Website Performance", margin + 28, 28);
  doc.text("Improvement Report", margin + 28, 40);
  
  y = 70;
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("Prepared by OptimizeMySuite", margin, y);
  y += 20;
  
  // Client/Agency info card
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, y - 5, contentWidth, clientName ? 55 : 45, 4, 4, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("ORIGINAL WEBSITE", margin + 10, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  const origUrlDisplay = originalUrl.length > 50 ? originalUrl.substring(0, 50) + "..." : originalUrl;
  doc.text(origUrlDisplay, margin + 10, y + 14);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("OPTIMIZED WEBSITE", margin + 10, y + 26);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  const optUrlDisplay = optimizedUrl.length > 50 ? optimizedUrl.substring(0, 50) + "..." : optimizedUrl;
  doc.text(optUrlDisplay, margin + 10, y + 35);
  
  if (clientName) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text(`PREPARED FOR: ${clientName.toUpperCase()}`, margin + 10, y + 48);
  }
  
  y += clientName ? 65 : 55;
  
  // Date
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
  addPageIfNeeded(100);
  
  // Section header
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  doc.roundedRect(margin, y - 5, contentWidth, 24, 4, 4, "F");
  
  // Shield icon
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.circle(margin + 14, y + 7, 7, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("✓", margin + 14, y + 10, { align: "center" });
  
  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("How These Scores Work", margin + 26, y + 10);
  y += 32;
  
  // Description
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const credDesc = "Scores are generated using the same evaluation criteria for all websites. Scores are not manually adjusted or inflated. Improvements reflect real changes in:";
  const credDescLines = doc.splitTextToSize(credDesc, contentWidth - 10);
  credDescLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 5, y + i * 5);
  });
  y += credDescLines.length * 5 + 8;
  
  // Improvement areas
  const improvementAreas = [
    "Messaging clarity and value proposition",
    "SEO structure and meta optimization",
    "Conversion fundamentals and call-to-actions",
    "Content accessibility and user experience",
  ];
  
  improvementAreas.forEach((area) => {
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.circle(margin + 8, y - 1, 2, "F");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(area, margin + 15, y);
    y += 7;
  });
  
  y += 8;
  
  // NOT SCORABLE explanation box
  doc.setFillColor(colors.warningLight[0], colors.warningLight[1], colors.warningLight[2]);
  const notScorableExplanation = "NOT SCORABLE does not mean bad. It means the page could not be evaluated due to access limitations (login required, preview environment, or JavaScript-only shell). We never guess or penalize inaccessible pages.";
  const notScorableLines = doc.splitTextToSize(notScorableExplanation, contentWidth - 20);
  const notScorableHeight = notScorableLines.length * 5 + 14;
  doc.roundedRect(margin, y - 3, contentWidth, notScorableHeight, 3, 3, "F");
  
  // Warning icon
  doc.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.circle(margin + 10, y + 6, 5, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("!", margin + 10, y + 8, { align: "center" });
  
  // Text
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  notScorableLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 20, y + 5 + i * 5);
  });
  y += notScorableHeight + 10;
  
  // ============ BEFORE VS AFTER SCORE SUMMARY ============
  addFooter();
  doc.addPage();
  currentPage++;
  y = 20;
  
  // Section title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Before vs After Score Summary", margin, y);
  y += 15;
  
  // Two side-by-side cards
  const cardWidth = (contentWidth - 10) / 2;
  const cardHeight = 85;
  
  // BEFORE card
  const beforeCardX = margin;
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(beforeCardX, y, cardWidth, cardHeight, 4, 4, "F");
  
  // Before label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("BEFORE", beforeCardX + cardWidth / 2, y + 12, { align: "center" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Original Website", beforeCardX + cardWidth / 2, y + 20, { align: "center" });
  
  // Before score or NOT SCORABLE
  if (originalStatus.notScorable) {
    // NOT SCORABLE badge
    doc.setFillColor(colors.warningLight[0], colors.warningLight[1], colors.warningLight[2]);
    doc.roundedRect(beforeCardX + 10, y + 30, cardWidth - 20, 25, 3, 3, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
    doc.text("NOT SCORABLE", beforeCardX + cardWidth / 2, y + 45, { align: "center" });
    
    // Reason
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    const reasonLines = doc.splitTextToSize(originalStatus.reason, cardWidth - 16);
    doc.text(reasonLines[0], beforeCardX + cardWidth / 2, y + 62, { align: "center" });
  } else {
    // Score circle
    const score = originalResults.summary.overallScore;
    const scoreColor = score >= 70 ? colors.success : score >= 50 ? colors.warning : [239, 68, 68];
    
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(beforeCardX + cardWidth / 2, y + 48, 18, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(score.toString(), beforeCardX + cardWidth / 2, y + 53, { align: "center" });
  }
  
  // Before URL
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const beforeUrlShort = originalUrl.length > 35 ? originalUrl.substring(0, 35) + "..." : originalUrl;
  doc.text(beforeUrlShort, beforeCardX + cardWidth / 2, y + 78, { align: "center" });
  
  // AFTER card
  const afterCardX = margin + cardWidth + 10;
  doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
  doc.roundedRect(afterCardX, y, cardWidth, cardHeight, 4, 4, "F");
  
  // After label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  doc.text("AFTER", afterCardX + cardWidth / 2, y + 12, { align: "center" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("Optimized Website", afterCardX + cardWidth / 2, y + 20, { align: "center" });
  
  // After score or NOT SCORABLE
  if (optimizedStatus.notScorable) {
    // NOT SCORABLE badge
    doc.setFillColor(colors.warningLight[0], colors.warningLight[1], colors.warningLight[2]);
    doc.roundedRect(afterCardX + 10, y + 30, cardWidth - 20, 25, 3, 3, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
    doc.text("NOT SCORABLE", afterCardX + cardWidth / 2, y + 45, { align: "center" });
    
    // Reason
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    const reasonLines = doc.splitTextToSize(optimizedStatus.reason, cardWidth - 16);
    doc.text(reasonLines[0], afterCardX + cardWidth / 2, y + 62, { align: "center" });
  } else {
    // Score circle
    const score = optimizedResults.summary.overallScore;
    const scoreColor = score >= 70 ? colors.success : score >= 50 ? colors.warning : [239, 68, 68];
    
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.circle(afterCardX + cardWidth / 2, y + 48, 18, "F");
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(score.toString(), afterCardX + cardWidth / 2, y + 53, { align: "center" });
  }
  
  // After URL
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const afterUrlShort = optimizedUrl.length > 35 ? optimizedUrl.substring(0, 35) + "..." : optimizedUrl;
  doc.text(afterUrlShort, afterCardX + cardWidth / 2, y + 78, { align: "center" });
  
  y += cardHeight + 15;
  
  // Overall delta (if both scorable)
  if (canCompare) {
    const overallDelta = optimizedResults.summary.overallScore - originalResults.summary.overallScore;
    const deltaColor = overallDelta > 0 ? colors.success : overallDelta < 0 ? [239, 68, 68] : colors.neutral;
    const deltaSign = overallDelta > 0 ? "+" : "";
    
    doc.setFillColor(deltaColor[0], deltaColor[1], deltaColor[2]);
    doc.roundedRect(margin + contentWidth / 2 - 40, y - 5, 80, 22, 4, 4, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${deltaSign}${overallDelta} Points`, pageWidth / 2, y + 6, { align: "center" });
    y += 30;
  }
  
  // ============ SECTION-BY-SECTION COMPARISON ============
  y += 5;
  addPageIfNeeded(120);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Section-by-Section Comparison", margin, y);
  y += 12;
  
  const sections = [
    { name: "Messaging", beforeScore: originalResults.messaging?.score, afterScore: optimizedResults.messaging?.score },
    { name: "Conversion", beforeScore: originalResults.conversion?.score, afterScore: optimizedResults.conversion?.score },
    { name: "SEO", beforeScore: originalResults.seo?.score, afterScore: optimizedResults.seo?.score },
    { name: "Performance", beforeScore: originalResults.performance?.score, afterScore: optimizedResults.performance?.score },
    { name: "Trust & UX", beforeScore: originalResults.trust?.score, afterScore: optimizedResults.trust?.score },
  ];
  
  // Table header
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, y - 3, contentWidth, 14, 2, 2, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("CATEGORY", margin + 10, y + 5);
  doc.text("BEFORE", margin + 90, y + 5);
  doc.text("AFTER", margin + 120, y + 5);
  doc.text("CHANGE", margin + 150, y + 5);
  y += 16;
  
  sections.forEach((section) => {
    addPageIfNeeded(14);
    
    // Row background
    doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(margin, y - 3, contentWidth, 12, 1, 1, "FD");
    
    // Category name
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(section.name, margin + 10, y + 4);
    
    // Before score
    const beforeNotScorable = originalStatus.notScorable || section.beforeScore === undefined;
    if (beforeNotScorable) {
      doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
      doc.text("N/A", margin + 90, y + 4);
    } else {
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(section.beforeScore.toString(), margin + 90, y + 4);
    }
    
    // After score
    const afterNotScorable = optimizedStatus.notScorable || section.afterScore === undefined;
    if (afterNotScorable) {
      doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
      doc.text("N/A", margin + 120, y + 4);
    } else {
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(section.afterScore.toString(), margin + 120, y + 4);
    }
    
    // Change indicator
    if (beforeNotScorable || afterNotScorable) {
      doc.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
      doc.text("⚠ Not scorable", margin + 150, y + 4);
    } else {
      const delta = section.afterScore - section.beforeScore;
      if (delta > 0) {
        doc.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
        doc.text(`↑ +${delta}`, margin + 150, y + 4);
      } else if (delta < 0) {
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text(`↓ ${delta}`, margin + 150, y + 4);
      } else {
        doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
        doc.text("→ No change", margin + 150, y + 4);
      }
    }
    
    y += 14;
  });
  
  // ============ KEY IMPROVEMENTS SUMMARY ============
  y += 15;
  addPageIfNeeded(80);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("What Changed", margin, y);
  y += 12;
  
  const improvements = generateImprovementSummary(originalResults, optimizedResults, originalStatus, optimizedStatus);
  
  if (improvements.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("Unable to generate improvement summary due to access limitations.", margin + 5, y);
    y += 10;
  } else {
    improvements.forEach((improvement) => {
      addPageIfNeeded(16);
      
      doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
      const impLines = doc.splitTextToSize(improvement, contentWidth - 24);
      const impHeight = impLines.length * 5 + 8;
      doc.roundedRect(margin, y - 3, contentWidth, impHeight, 3, 3, "F");
      
      // Check icon
      doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
      doc.circle(margin + 8, y + 4, 4, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("✓", margin + 8, y + 6, { align: "center" });
      
      // Text
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      impLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 18, y + 4 + i * 5);
      });
      
      y += impHeight + 4;
    });
  }
  
  // ============ IMPORTANT NOTES ============
  y += 15;
  addPageIfNeeded(50);
  
  doc.setFillColor(colors.neutralLight[0], colors.neutralLight[1], colors.neutralLight[2]);
  const noteText = "Preview or staging sites (such as preview--*.lovable.app) may require authentication. If a page cannot be accessed publicly, it will be marked NOT SCORABLE rather than penalized.";
  const noteLines = doc.splitTextToSize(noteText, contentWidth - 20);
  const noteHeight = noteLines.length * 5 + 16;
  doc.roundedRect(margin, y - 3, contentWidth, noteHeight, 4, 4, "F");
  
  // Info icon
  doc.setFillColor(colors.neutral[0], colors.neutral[1], colors.neutral[2]);
  doc.circle(margin + 12, y + 8, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("i", margin + 12, y + 11, { align: "center" });
  
  // Title
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("Important Notes", margin + 24, y + 6);
  
  // Note text
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  noteLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 10, y + 14 + i * 5);
  });
  
  // ============ FOOTER ============
  addFooter();

  // Save
  const filename = `before-after-report-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
