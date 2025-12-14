import jsPDF from "jspdf";
import { AnalysisResult, FindingInput } from "@/types/analysis";
import { CREDIBILITY_SHORT } from "@/components/scoring/ScoreCredibilityStatement";

// Color palette (RGB values)
const colors = {
  primary: [59, 130, 246], // Blue
  primaryLight: [239, 246, 255], // Light blue background
  success: [34, 197, 94], // Green
  successLight: [240, 253, 244],
  warning: [251, 191, 36], // Amber/Yellow
  warningLight: [254, 252, 232],
  danger: [239, 68, 68], // Red
  dangerLight: [254, 242, 242],
  textPrimary: [30, 41, 59], // Slate 800
  textSecondary: [71, 85, 105], // Slate 600
  textMuted: [148, 163, 184], // Slate 400
  cardBg: [248, 250, 252], // Slate 50
  border: [226, 232, 240], // Slate 200
  white: [255, 255, 255],
};

// Helper to get text from FindingInput
const getFindingText = (f: FindingInput): string =>
  typeof f === "string" ? f : f.text;

// Get color based on score
const getScoreColor = (score: number): number[] => {
  if (score >= 70) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.danger;
};

const getScoreColorLight = (score: number): number[] => {
  if (score >= 70) return colors.successLight;
  if (score >= 50) return colors.warningLight;
  return colors.dangerLight;
};

const getGradeLabel = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Critical";
};

export function generateAnalysisPdf(results: AnalysisResult, url: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > 275) {
      doc.addPage();
      y = 20;
    }
  };

  // Draw circular score indicator
  const drawScoreCircle = (x: number, centerY: number, score: number, size: number = 25) => {
    const scoreColor = getScoreColor(score);
    const bgColor = getScoreColorLight(score);
    
    // Background circle
    doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    doc.circle(x, centerY, size, "F");
    
    // Arc for score (simplified as colored ring)
    doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setLineWidth(3);
    doc.circle(x, centerY, size - 2, "S");
    
    // Score text
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(score.toString(), x, centerY + 2, { align: "center" });
    
    // Label
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(getGradeLabel(score).toUpperCase(), x, centerY + 9, { align: "center" });
  };

  // Draw score bar
  const drawScoreBar = (x: number, barY: number, width: number, score: number) => {
    const scoreColor = getScoreColor(score);
    const barHeight = 6;
    
    // Background bar
    doc.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(x, barY, width, barHeight, 3, 3, "F");
    
    // Score bar
    const scoreWidth = (score / 100) * width;
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(x, barY, scoreWidth, barHeight, 3, 3, "F");
  };

  // Section header with icon placeholder and background
  const addSectionHeader = (title: string, score?: number) => {
    addPageIfNeeded(35);
    
    // Section card background
    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.roundedRect(margin, y - 5, contentWidth, score ? 30 : 20, 4, 4, "F");
    
    // Icon placeholder (colored circle)
    doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
    doc.circle(margin + 10, y + 5, 6, "F");
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 10, y + 5, 3, "F");
    
    // Title
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(title, margin + 22, y + 7);
    
    if (score !== undefined) {
      // Score on right
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      const scoreColor = getScoreColor(score);
      doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
      doc.text(`${score}`, pageWidth - margin - 15, y + 5, { align: "right" });
      doc.setFontSize(9);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
      doc.text("/100", pageWidth - margin - 5, y + 5, { align: "right" });
      
      // Score bar
      drawScoreBar(margin + 22, y + 14, contentWidth - 60, score);
      y += 35;
    } else {
      y += 25;
    }
  };

  // Add finding with info icon style
  const addFinding = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth - 20);
    const blockHeight = lines.length * 5 + 10;
    addPageIfNeeded(blockHeight);
    
    // Light background card
    doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
    doc.roundedRect(margin, y - 3, contentWidth, blockHeight, 3, 3, "F");
    
    // Info icon (circle with i)
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 8, y + 4, 4, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("i", margin + 8, y + 6, { align: "center" });
    
    // Text
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    lines.forEach((line: string, index: number) => {
      doc.text(line, margin + 18, y + 5 + index * 5);
    });
    y += blockHeight + 3;
  };

  // Numbered item (for quick wins)
  const addNumberedItem = (num: number, text: string) => {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, contentWidth - 25);
    const blockHeight = lines.length * 5 + 6;
    addPageIfNeeded(blockHeight);
    
    // Number circle
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 8, y + 3, 5, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(num.toString(), margin + 8, y + 5, { align: "center" });
    
    // Text
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    lines.forEach((line: string, index: number) => {
      doc.text(line, margin + 20, y + 5 + index * 5);
    });
    y += blockHeight;
  };

  // Simple bullet text
  const addBullet = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    const lines = doc.splitTextToSize(text, contentWidth - 15);
    lines.forEach((line: string, index: number) => {
      addPageIfNeeded(6);
      if (index === 0) {
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.circle(margin + 3, y - 1, 1.5, "F");
      }
      doc.text(line, margin + 10, y);
      y += 5;
    });
    y += 2;
  };

  // Recommendation text
  const addRecommendation = (label: string, text: string) => {
    addPageIfNeeded(20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(label, margin, y);
    y += 6;
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    const lines = doc.splitTextToSize(text, contentWidth - 5);
    lines.forEach((line: string) => {
      addPageIfNeeded(5);
      doc.text(line, margin + 5, y);
      y += 5;
    });
    y += 3;
  };

  // ============ HEADER ============
  // Blue header bar
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 35, "F");
  
  // Header icon
  doc.setFillColor(255, 255, 255);
  doc.circle(margin + 8, 17, 6, "F");
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFontSize(10);
  doc.text("↗", margin + 8, 19, { align: "center" });
  
  // Header title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Website Analysis Summary", margin + 20, 20);
  
  // URL and date (subheader)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${url}  •  ${new Date().toLocaleDateString()}`, margin + 20, 28);
  
  y = 50;

  // ============ OVERALL SCORE SECTION ============
  // Score circle on left
  drawScoreCircle(margin + 25, y + 25, results.summary.overallScore);
  
  // Overview text on right
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const overviewLines = doc.splitTextToSize(results.summary.overview, contentWidth - 65);
  overviewLines.slice(0, 5).forEach((line: string, i: number) => {
    doc.text(line, margin + 55, y + 10 + i * 6);
  });
  
  y += 60;

  // ============ QUICK WINS ============
  // Quick wins card with yellow/amber accent
  addPageIfNeeded(50);
  const quickWinsHeight = results.summary.quickWins.length * 18 + 25;
  doc.setFillColor(colors.warningLight[0], colors.warningLight[1], colors.warningLight[2]);
  doc.roundedRect(margin, y - 5, contentWidth, quickWinsHeight, 4, 4, "F");
  
  // Lightning icon
  doc.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  doc.circle(margin + 10, y + 5, 5, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("⚡", margin + 10, y + 7, { align: "center" });
  
  // Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Quick Wins (Fix in 24 hours)", margin + 22, y + 7);
  
  y += 18;
  results.summary.quickWins.forEach((win, index) => {
    addNumberedItem(index + 1, win);
  });
  y += 10;

  // ============ CATEGORY SECTIONS ============
  
  // Messaging & Offer Clarity
  addSectionHeader("Messaging & Offer Clarity", results.messaging.score);
  results.messaging.findings.forEach((f) => addFinding(getFindingText(f)));
  addRecommendation("Recommended Headline:", results.messaging.recommendedHeadline);
  addRecommendation("Recommended Subheadline:", results.messaging.recommendedSubheadline);
  y += 5;

  // Conversion & Lead Capture
  addSectionHeader("Conversion & Lead Capture", results.conversion.score);
  results.conversion.findings.forEach((f) => addFinding(getFindingText(f)));
  results.conversion.recommendations.forEach((r) => addBullet(r));
  y += 5;

  // Design & UX
  addSectionHeader("Design & User Experience", results.designUx.score);
  results.designUx.findings.forEach((f) => addFinding(getFindingText(f)));
  results.designUx.recommendations.forEach((r) => addBullet(r));
  y += 5;

  // Mobile Experience
  addSectionHeader("Mobile Experience", results.mobile.score);
  results.mobile.findings.forEach((f) => addFinding(getFindingText(f)));
  results.mobile.recommendations.forEach((r) => addBullet(r));
  y += 5;

  // Performance
  addSectionHeader("Speed & Performance", results.performance.score);
  results.performance.findings.forEach((f) => addFinding(getFindingText(f)));
  if (results.performance.heavyImages.length > 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text("Heavy Images Detected:", margin, y);
    y += 6;
    results.performance.heavyImages.forEach((img) => addBullet(img));
  }
  results.performance.recommendations.forEach((r) => addBullet(r));
  y += 5;

  // SEO
  addSectionHeader("SEO & Local SEO", results.seo.score);
  results.seo.findings.forEach((f) => addFinding(getFindingText(f)));
  addRecommendation("Recommended Title Tag:", results.seo.recommendedTitle);
  addRecommendation("Recommended Meta Description:", results.seo.recommendedMetaDescription);
  addRecommendation("Target Keywords:", results.seo.keywords.join(", "));
  y += 5;

  // Trust
  addSectionHeader("Trust & Credibility", results.trust.score);
  results.trust.findings.forEach((f) => addFinding(getFindingText(f)));
  results.trust.whyChooseUs.forEach((item) => addBullet(item));
  y += 5;

  // Technical
  addSectionHeader("Technical Basics");
  results.technical.findings.forEach((f) => addFinding(getFindingText(f)));
  results.technical.recommendations.forEach((r) => addBullet(r));

  // ============ SCORE CREDIBILITY STATEMENT ============
  y += 8;
  addPageIfNeeded(40);
  
  // Credibility section background
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  const credibilityLines = doc.splitTextToSize(CREDIBILITY_SHORT, contentWidth - 20);
  const credibilityHeight = credibilityLines.length * 5 + 18;
  doc.roundedRect(margin, y - 3, contentWidth, credibilityHeight, 4, 4, "F");
  
  // Info icon
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.circle(margin + 10, y + 6, 5, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("i", margin + 10, y + 8, { align: "center" });
  
  // Title
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("About This Score", margin + 20, y + 8);
  
  // Credibility text
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  credibilityLines.forEach((line: string, index: number) => {
    doc.text(line, margin + 10, y + 16 + index * 5);
  });
  y += credibilityHeight + 5;

  // ============ FOOTER ============
  addPageIfNeeded(25);
  y += 10;
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  doc.setFontSize(9);
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("Generated by OptimizeMySuite - OptimizeMySuite.com", margin, y);
  doc.text(new Date().toLocaleString(), pageWidth - margin, y, { align: "right" });

  // Save
  const filename = `website-analysis-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}
