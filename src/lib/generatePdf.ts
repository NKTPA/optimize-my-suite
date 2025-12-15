import jsPDF from "jspdf";
import { AnalysisResult, FindingInput } from "@/types/analysis";
import { CREDIBILITY_BODY, CREDIBILITY_FOOTER } from "@/components/scoring/ScoreCredibilityStatement";
import { generatePdfFilename, setPdfMetadata, PdfMetadataOptions, extractDomainFromUrl } from "./pdfMetadata";
import {
  PdfContext,
  PDF_COLORS,
  createPdfContext,
  ensureSpace,
  addNewPage,
  checkPageBreak,
  renderSafeText,
  renderBulletItem,
  renderBulletList,
  renderCalloutBox,
  renderSectionHeader,
  getScoreColor,
  getScoreColorLight,
  renderScoreBar,
  renderScoreCircle,
  sanitizeText,
  getGradeLabel,
  getGradeDescription,
} from "./pdf";

// Branding options for white-label PDFs
export interface AnalysisPdfBranding {
  logoUrl?: string | null;
  footerText?: string | null;
  agencyName?: string | null;
  clientName?: string | null;
}

// Legacy color palette for backwards compatibility
const colors = {
  primary: PDF_COLORS.primaryMid,
  primaryDark: PDF_COLORS.primaryDark,
  primaryLight: PDF_COLORS.primaryLight,
  success: PDF_COLORS.success,
  successLight: PDF_COLORS.successLight,
  warning: PDF_COLORS.warning,
  warningLight: PDF_COLORS.warningLight,
  danger: PDF_COLORS.danger,
  dangerLight: PDF_COLORS.dangerLight,
  textPrimary: PDF_COLORS.textPrimary,
  textSecondary: PDF_COLORS.textSecondary,
  textMuted: PDF_COLORS.textMuted,
  cardBg: PDF_COLORS.cardBg,
  border: PDF_COLORS.border,
  white: PDF_COLORS.white,
  accent: PDF_COLORS.accent,
};

// Business impact descriptions for each category
const CATEGORY_BUSINESS_CONTEXT: Record<string, {
  impacts: string;
  whyMatters: string;
  lowScoreRisks: string;
  improvements: string;
}> = {
  messaging: {
    impacts: "First impressions, bounce rate, and visitor engagement",
    whyMatters: "Visitors decide within 3-5 seconds whether to stay or leave. Clear messaging ensures they understand your value instantly.",
    lowScoreRisks: "High bounce rates, confused visitors, missed opportunities to connect with qualified leads",
    improvements: "Stronger first impressions, lower bounce rate, increased time-on-site, and improved lead quality"
  },
  conversion: {
    impacts: "Lead generation, form completions, and revenue opportunities",
    whyMatters: "Even high-traffic websites fail without clear conversion paths. Every missing CTA is a missed customer.",
    lowScoreRisks: "Lost leads, poor form completion rates, unclear next steps for visitors",
    improvements: "Higher lead capture rates, more form submissions, clearer customer journey"
  },
  designUx: {
    impacts: "User trust, navigation ease, and professional credibility",
    whyMatters: "Design is often the first trust signal. Poor UX frustrates users and signals unprofessionalism.",
    lowScoreRisks: "Reduced trust, higher abandonment, perception of being outdated or unreliable",
    improvements: "Professional appearance, improved navigation, better user engagement"
  },
  mobile: {
    impacts: "Mobile traffic conversion, local search visibility, and user accessibility",
    whyMatters: "Over 60% of web traffic is mobile. Poor mobile experience directly impacts rankings and conversions.",
    lowScoreRisks: "Lost mobile customers, lower search rankings, frustrated users on phones and tablets",
    improvements: "Better mobile conversion rates, improved local SEO, accessible experience on all devices"
  },
  performance: {
    impacts: "Page speed, user patience, and search engine rankings",
    whyMatters: "Every second of delay reduces conversions by 7%. Speed is both a ranking factor and UX essential.",
    lowScoreRisks: "Higher bounce rates, lower search rankings, frustrated visitors who leave before content loads",
    improvements: "Faster load times, better SEO performance, improved user experience"
  },
  seo: {
    impacts: "Search visibility, organic traffic, and lead acquisition cost",
    whyMatters: "Organic search is often the largest traffic source. Poor SEO means invisible to potential customers.",
    lowScoreRisks: "Lower search rankings, reduced organic traffic, higher dependence on paid advertising",
    improvements: "Better search rankings, increased organic visibility, reduced customer acquisition costs"
  },
  trust: {
    impacts: "Customer confidence, conversion rates, and brand perception",
    whyMatters: "Trust signals convert browsers into buyers. Without credibility markers, visitors hesitate to take action.",
    lowScoreRisks: "Lower conversion rates, customer hesitation, lost sales to competitors with better trust signals",
    improvements: "Higher conversion rates, increased customer confidence, competitive advantage"
  },
  technical: {
    impacts: "Website reliability, accessibility, and search indexability",
    whyMatters: "Technical issues prevent search engines from properly indexing and users from accessing content.",
    lowScoreRisks: "Broken functionality, accessibility barriers, indexing problems affecting visibility",
    improvements: "Reliable functionality, better accessibility, improved search engine indexing"
  }
};

// Helper to get text from FindingInput
const getFindingText = (f: FindingInput): string =>
  typeof f === "string" ? f : f.text;

export function generateAnalysisPdf(results: AnalysisResult, url: string, branding?: AnalysisPdfBranding) {
  // Create PDF context using shared primitives
  const ctx = createPdfContext({ margin: 18, footerHeight: 35 });
  const { doc, margin, contentWidth, pageWidth, pageHeight } = ctx;
  
  // Extract domain for display
  const clientDomain = extractDomainFromUrl(url);
  const clientDisplayName = branding?.clientName || clientDomain;
  
  // Determine if white-label mode is active
  const isWhiteLabel = Boolean(branding?.logoUrl || branding?.footerText || branding?.agencyName);
  const authorName = isWhiteLabel 
    ? (branding?.agencyName || branding?.footerText || "Your Agency") 
    : "OptimizeMySuite";

  // Set up footer function
  ctx.addFooter = () => {
    // Subtle divider line
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    
    const footerText = branding?.footerText || (isWhiteLabel ? "" : "");
    if (footerText) {
      doc.text(footerText, margin, pageHeight - 8);
    }
    
    // Page number on right
    doc.text(`Page ${ctx.currentPage}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  };

  // Draw premium score circle (legacy helper using new primitives)
  const drawScoreCircle = (x: number, centerY: number, score: number, size: number = 28) => {
    renderScoreCircle(ctx, score, x, centerY, size);
  };

  // Draw score bar (legacy helper)
  const drawScoreBar = (x: number, barY: number, width: number, score: number, height: number = 8) => {
    const scoreColor = getScoreColor(score);
    
    // Background bar
    doc.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.roundedRect(x, barY, width, height, 4, 4, "F");
    
    // Score bar
    const scoreWidth = Math.max((score / 100) * width, 8);
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(x, barY, scoreWidth, height, 4, 4, "F");
  };

  // Premium category section with zero-truncation guarantee
  const addCategorySection = (
    title: string, 
    score: number, 
    categoryKey: string,
    findings: FindingInput[],
    recommendations?: string[]
  ) => {
    ensureSpace(ctx, 75);
    
    const context = CATEGORY_BUSINESS_CONTEXT[categoryKey];
    const scoreColor = getScoreColor(score);
    
    // Section header card
    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.roundedRect(margin, ctx.y - 5, contentWidth, 45, 4, 4, "F");
    
    // Left accent bar
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.rect(margin, ctx.y - 5, 4, 45, "F");
    
    // Title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(title, margin + 12, ctx.y + 5);
    
    // Score display
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${score}`, pageWidth - margin - 25, ctx.y + 5, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    doc.text("/100", pageWidth - margin - 10, ctx.y + 5, { align: "right" });
    
    // Score bar
    drawScoreBar(margin + 12, ctx.y + 12, contentWidth - 70, score, 6);
    
    // Business impact subtitle
    if (context) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
      doc.text(`Impacts: ${context.impacts}`, margin + 12, ctx.y + 28);
    }
    
    ctx.y += 50;
    
    // Why This Matters box - using shared callout component
    if (context && score < 70) {
      renderCalloutBox(ctx, "Why This Matters", context.whyMatters, {
        titleColor: PDF_COLORS.primary,
        bgColor: PDF_COLORS.primaryLight,
        textColor: PDF_COLORS.textSecondary,
      });
    }
    
    // Findings - using shared bullet list (ZERO TRUNCATION)
    if (findings.length > 0) {
      ctx.y += 3;
      const findingTexts = findings.map(f => sanitizeText(getFindingText(f)));
      renderBulletList(ctx, findingTexts, {
        bulletStyle: "circle",
        bulletColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.textSecondary,
      });
    }
    
    // Recommendations - each rendered separately with ZERO TRUNCATION
    if (recommendations && recommendations.length > 0) {
      ctx.y += 3;
      
      recommendations.forEach((rec) => {
        // Check for label:value patterns
        const labelPatterns = [
          "Recommended Headline:",
          "Recommended Subheadline:",
          "Recommended Title:",
          "Recommended Meta:",
          "Target Keywords:",
        ];
        
        const matchedLabel = labelPatterns.find((pattern) => rec.startsWith(pattern));
        
        if (matchedLabel) {
          // Render as labeled text block
          const label = matchedLabel.replace(":", "");
          const value = rec.substring(matchedLabel.length).trim();
          
          // Calculate block height first
          doc.setFontSize(9);
          const valueLines = doc.splitTextToSize(value, contentWidth - 8);
          const blockHeight = (1 + valueLines.length) * 4.5 + 4;
          
          // Try to keep block together
          ensureSpace(ctx, Math.min(blockHeight, pageHeight - ctx.footerHeight - 60));
          
          // Label on its own line, bold
          doc.setFont("helvetica", "bold");
          doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
          checkPageBreak(ctx, 4.5);
          doc.text(`${label}:`, margin + 4, ctx.y);
          ctx.y += 4.5;
          
          // Value - render ALL lines with page breaks as needed
          doc.setFont("helvetica", "normal");
          valueLines.forEach((line: string) => {
            checkPageBreak(ctx, 4.5);
            doc.text(line, margin + 4, ctx.y);
            ctx.y += 4.5;
          });
          
          ctx.y += 2;
        } else {
          // Regular recommendation with arrow - use shared bullet item
          renderBulletItem(ctx, rec, {
            bulletStyle: "arrow",
            bulletColor: PDF_COLORS.success,
            textColor: PDF_COLORS.textSecondary,
          });
        }
      });
    }
    
    ctx.y += 8;
  };

  // ============ PAGE 1: EXECUTIVE COVER ============
  
  // Full-page premium header
  doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
  doc.rect(0, 0, pageWidth, 85, "F");
  
  // Accent stripe
  doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.rect(0, 85, pageWidth, 3, "F");
  
  // Main title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Website Performance Audit", pageWidth / 2, 38, { align: "center" });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Objective Website Analysis Using Consistent Scoring Criteria", pageWidth / 2, 52, { align: "center" });
  
  // Divider
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, 62, pageWidth / 2 + 40, 62);
  
  // URL
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(clientDomain, pageWidth / 2, 74, { align: "center" });
  
  ctx.y = 105;
  
  // Client/Agency info box
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, ctx.y, contentWidth, 50, 4, 4, "F");
  
  // Left column
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("PREPARED FOR", margin + 12, ctx.y + 14);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(clientDisplayName, margin + 12, ctx.y + 26);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text(url.substring(0, 50), margin + 12, ctx.y + 36);
  
  // Right column
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("PREPARED BY", pageWidth / 2 + 10, ctx.y + 14);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text(authorName, pageWidth / 2 + 10, ctx.y + 26);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageWidth / 2 + 10, ctx.y + 36);
  
  ctx.y += 65;
  
  // Overall Score Display
  const overallScore = results.summary.overallScore;
  drawScoreCircle(pageWidth / 2, ctx.y + 35, overallScore, 35);
  
  ctx.y += 80;
  
  // Score label
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("OVERALL PERFORMANCE SCORE", pageWidth / 2, ctx.y, { align: "center" });
  
  ctx.y += 20;
  
  // Score interpretation
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, ctx.y - 5, contentWidth, 35, 4, 4, "F");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  const gradeDesc = getGradeDescription(overallScore);
  const gradeLines = doc.splitTextToSize(gradeDesc, contentWidth - 20);
  gradeLines.forEach((line: string, i: number) => {
    doc.text(line, pageWidth / 2, ctx.y + 7 + i * 5, { align: "center" });
  });
  
  ctx.addFooter();
  
  // ============ PAGE 2: EXECUTIVE SUMMARY ============
  addNewPage(ctx);
  
  // Section header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Executive Summary", margin, ctx.y);
  
  // Accent line
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, ctx.y + 5, 50, 2, "F");
  
  ctx.y += 20;
  
  // Overview paragraph - using safe text rendering
  let executiveSummary = results.summary.overview;
  if (overallScore < 50) {
    executiveSummary = `This audit identifies several structural issues that may reduce conversion efficiency, search visibility, and trust. While the site is functional, it underperforms relative to industry standards and may fail to clearly communicate value within the critical first impression window. ${executiveSummary}`;
  } else if (overallScore < 70) {
    executiveSummary = `This audit reveals opportunities for improvement across key performance areas. The website has a solid foundation but would benefit from targeted optimizations to increase lead capture and search visibility. ${executiveSummary}`;
  } else {
    executiveSummary = `This website demonstrates strong fundamentals across most evaluation criteria. The following analysis highlights areas performing well and opportunities for continued optimization. ${executiveSummary}`;
  }
  
  renderSafeText(ctx, executiveSummary, {
    fontSize: 11,
    fontStyle: "normal",
    textColor: colors.textSecondary,
    lineHeight: 6,
  });
  
  ctx.y += 15;
  
  // Category scores overview grid
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Performance by Category", margin, ctx.y);
  ctx.y += 12;
  
  const categories = [
    { name: "Messaging", score: results.messaging.score },
    { name: "Conversion", score: results.conversion.score },
    { name: "Design & UX", score: results.designUx.score },
    { name: "Mobile", score: results.mobile.score },
    { name: "Performance", score: results.performance.score },
    { name: "SEO", score: results.seo.score },
    { name: "Trust", score: results.trust.score },
  ];
  
  // Two-column layout
  const colWidth = (contentWidth - 10) / 2;
  categories.forEach((cat, index) => {
    const col = index % 2;
    const xPos = margin + col * (colWidth + 10);
    
    if (col === 0 && index > 0) ctx.y += 18;
    
    // Category name
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(cat.name, xPos, ctx.y);
    
    // Score bar
    drawScoreBar(xPos, ctx.y + 4, colWidth - 30, cat.score, 6);
    
    // Score number
    const scoreColor = getScoreColor(cat.score);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${cat.score}`, xPos + colWidth - 15, ctx.y, { align: "right" });
  });
  
  ctx.y += 30;
  
  // Key risks section (if score < 70)
  if (overallScore < 70) {
    ensureSpace(ctx, 50);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text("Primary Risk Areas", margin, ctx.y);
    ctx.y += 10;
    
    // Find lowest scoring categories
    const sortedCats = [...categories].sort((a, b) => a.score - b.score);
    const risks = sortedCats.slice(0, 3);
    
    risks.forEach((risk) => {
      const context = CATEGORY_BUSINESS_CONTEXT[risk.name.toLowerCase().replace(/\s*&\s*/g, "").replace("ux", "Ux")];
      ensureSpace(ctx, 15);
      
      doc.setFillColor(colors.dangerLight[0], colors.dangerLight[1], colors.dangerLight[2]);
      doc.roundedRect(margin, ctx.y - 3, contentWidth, 12, 2, 2, "F");
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.danger[0], colors.danger[1], colors.danger[2]);
      doc.text(`${risk.name}: ${risk.score}/100`, margin + 5, ctx.y + 5);
      
      if (context) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
        const riskText = doc.splitTextToSize(` — ${context.lowScoreRisks}`, contentWidth - 60);
        doc.text(riskText[0] || "", margin + 55, ctx.y + 5);
      }
      
      ctx.y += 16;
    });
  }
  
  ctx.y += 10;
  
  // ============ IMMEDIATE OPPORTUNITIES (Quick Wins) ============
  ensureSpace(ctx, 60);
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Immediate Opportunities", margin, ctx.y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text("High Impact, Low Effort Improvements", margin, ctx.y + 8);
  
  ctx.y += 18;
  
  results.summary.quickWins.slice(0, 5).forEach((win, index) => {
    const winLines = doc.splitTextToSize(win, contentWidth - 30);
    // Dynamic card height based on ALL lines - no truncation
    const cardHeight = winLines.length * 5 + 12;
    
    // Try to keep entire card together
    ensureSpace(ctx, Math.min(cardHeight, pageHeight - ctx.footerHeight - 60));
    
    // Card background - sized to fit ALL content
    doc.setFillColor(colors.successLight[0], colors.successLight[1], colors.successLight[2]);
    doc.roundedRect(margin, ctx.y - 3, contentWidth, cardHeight, 3, 3, "F");
    
    // Number badge
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.circle(margin + 10, ctx.y + 5, 6, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text((index + 1).toString(), margin + 10, ctx.y + 7, { align: "center" });
    
    // Win text - render ALL lines with proper page breaks
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    
    let lineY = ctx.y + 5;
    winLines.forEach((line: string) => {
      doc.text(line, margin + 22, lineY);
      lineY += 5;
    });
    
    ctx.y += cardHeight + 4;
  });
  
  // ============ SCORE INTERPRETATION PANEL ============
  addNewPage(ctx);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("How to Interpret This Score", margin, ctx.y);
  
  ctx.y += 15;
  
  // Interpretation box
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  doc.roundedRect(margin, ctx.y - 5, contentWidth, 75, 4, 4, "F");
  
  // Left accent
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, ctx.y - 5, 4, 75, "F");
  
  const interpretationPoints = [
    "Scores are criteria-based, not subjective opinions",
    "No manual adjustments are made to any scores",
    "The same methodology is applied before and after improvements",
    "Pages that cannot be accessed publicly are marked 'Not Scorable' rather than penalized",
    "Missing or unavailable data is treated conservatively, never inflated"
  ];
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  
  interpretationPoints.forEach((point, i) => {
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.circle(margin + 15, ctx.y + 6 + i * 13, 2, "F");
    doc.text(point, margin + 22, ctx.y + 8 + i * 13);
  });
  
  ctx.y += 90;
  
  // Score scale reference
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Score Scale Reference", margin, ctx.y);
  ctx.y += 12;
  
  const scoreScales = [
    { range: "90-100", label: "Excellent", color: colors.success, desc: "Strong performance across all criteria" },
    { range: "70-89", label: "Good", color: colors.success, desc: "Solid foundation with optimization opportunities" },
    { range: "50-69", label: "Needs Work", color: colors.warning, desc: "Structural issues limiting effectiveness" },
    { range: "0-49", label: "Needs Attention", color: colors.danger, desc: "Multiple areas requiring immediate focus" },
  ];
  
  scoreScales.forEach((scale) => {
    doc.setFillColor(scale.color[0], scale.color[1], scale.color[2]);
    doc.roundedRect(margin, ctx.y - 2, 50, 12, 2, 2, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${scale.range}: ${scale.label}`, margin + 25, ctx.y + 5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(scale.desc, margin + 58, ctx.y + 5);
    
    ctx.y += 16;
  });
  
  ctx.y += 15;
  
  // ============ CATEGORY BREAKDOWNS ============
  
  addCategorySection(
    "Messaging & Offer Clarity",
    results.messaging.score,
    "messaging",
    results.messaging.findings,
    [
      `Recommended Headline: ${results.messaging.recommendedHeadline}`,
      `Recommended Subheadline: ${results.messaging.recommendedSubheadline}`
    ]
  );
  
  addCategorySection(
    "Conversion & Lead Capture",
    results.conversion.score,
    "conversion",
    results.conversion.findings,
    results.conversion.recommendations
  );
  
  addCategorySection(
    "Design & User Experience",
    results.designUx.score,
    "designUx",
    results.designUx.findings,
    results.designUx.recommendations
  );
  
  addCategorySection(
    "Mobile Experience",
    results.mobile.score,
    "mobile",
    results.mobile.findings,
    results.mobile.recommendations
  );
  
  addCategorySection(
    "Speed & Performance",
    results.performance.score,
    "performance",
    results.performance.findings,
    results.performance.recommendations
  );
  
  addCategorySection(
    "SEO & Local Search",
    results.seo.score,
    "seo",
    results.seo.findings,
    [
      `Recommended Title: ${results.seo.recommendedTitle}`,
      `Recommended Meta: ${results.seo.recommendedMetaDescription}`,
      `Target Keywords: ${results.seo.keywords.join(", ")}`
    ]
  );
  
  addCategorySection(
    "Trust & Credibility",
    results.trust.score,
    "trust",
    results.trust.findings,
    results.trust.whyChooseUs
  );
  
  // Technical (no score)
  ensureSpace(ctx, 50);
  doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
  doc.roundedRect(margin, ctx.y - 5, contentWidth, 25, 4, 4, "F");
  doc.setFillColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.rect(margin, ctx.y - 5, 4, 25, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Technical Fundamentals", margin + 12, ctx.y + 8);
  
  ctx.y += 30;
  
  // Technical findings - using shared bullet list (ZERO TRUNCATION)
  const technicalFindingTexts = results.technical.findings.map(f => sanitizeText(getFindingText(f)));
  renderBulletList(ctx, technicalFindingTexts, {
    bulletStyle: "circle",
    bulletColor: PDF_COLORS.primary,
    textColor: PDF_COLORS.textSecondary,
  });
  
  // Technical recommendations - using shared bullet list (ZERO TRUNCATION)
  if (results.technical.recommendations.length > 0) {
    ctx.y += 3;
    renderBulletList(ctx, results.technical.recommendations, {
      bulletStyle: "arrow",
      bulletColor: PDF_COLORS.success,
      textColor: PDF_COLORS.textSecondary,
    });
  }
  
  // ============ WHAT THIS AUDIT ENABLES (Agency Positioning) ============
  addNewPage(ctx);
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("What This Audit Enables", margin, ctx.y);
  
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, ctx.y + 5, 60, 2, "F");
  
  ctx.y += 20;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  doc.text("This analysis provides the foundation for strategic improvements across several areas:", margin, ctx.y);
  
  ctx.y += 15;
  
  const enablesItems = [
    {
      title: "Website Redesign Justification",
      desc: "Data-driven evidence to support investment in website improvements with clear before/after benchmarks"
    },
    {
      title: "SEO Strategy Development",
      desc: "Identified gaps in search optimization that can be addressed through targeted SEO work"
    },
    {
      title: "Conversion Rate Optimization",
      desc: "Clear opportunities to improve lead capture and reduce friction in the customer journey"
    },
    {
      title: "Ongoing Performance Monitoring",
      desc: "Baseline metrics to measure improvement over time and demonstrate ROI"
    }
  ];
  
  enablesItems.forEach((item) => {
    // Calculate dynamic card height based on ALL content
    const descLines = doc.splitTextToSize(item.desc, contentWidth - 28);
    const cardHeight = 14 + descLines.length * 4 + 6;
    
    // Try to keep entire card together
    ensureSpace(ctx, Math.min(cardHeight, pageHeight - ctx.footerHeight - 60));
    
    doc.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    doc.roundedRect(margin, ctx.y - 3, contentWidth, cardHeight, 3, 3, "F");
    
    doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
    doc.circle(margin + 10, ctx.y + 8, 4, "F");
    
    // Draw checkmark using lines instead of Unicode
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.line(margin + 8, ctx.y + 8, margin + 10, ctx.y + 10);
    doc.line(margin + 10, ctx.y + 10, margin + 13, ctx.y + 6);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
    doc.text(item.title, margin + 20, ctx.y + 6);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    // Render ALL description lines - no truncation
    descLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 20, ctx.y + 14 + i * 4);
    });
    
    ctx.y += cardHeight + 5;
  });
  
  // ============ METHODOLOGY CREDIBILITY ============
  ctx.y += 10;
  ensureSpace(ctx, 60);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.textPrimary[0], colors.textPrimary[1], colors.textPrimary[2]);
  doc.text("Scoring Methodology", margin, ctx.y);
  ctx.y += 10;
  
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  const credLines = doc.splitTextToSize(CREDIBILITY_BODY, contentWidth - 16);
  const credHeight = credLines.length * 4.5 + 20;
  doc.roundedRect(margin, ctx.y - 3, contentWidth, credHeight, 4, 4, "F");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
  credLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 8, ctx.y + 8 + i * 4.5);
  });
  
  ctx.y += credHeight - 8;
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  doc.text(CREDIBILITY_FOOTER, margin + 8, ctx.y);
  
  // Final footer
  ctx.addFooter();

  // Set PDF metadata
  const metadataOptions: PdfMetadataOptions = {
    clientDomain: url,
    clientName: branding?.clientName,
    agencyName: branding?.agencyName || branding?.footerText || undefined,
    isWhiteLabel,
    reportType: "analysis",
  };
  setPdfMetadata(doc, metadataOptions);
  
  // Generate filename
  const filename = generatePdfFilename(metadataOptions);
  doc.save(filename);
}
