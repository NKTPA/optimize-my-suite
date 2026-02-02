/**
 * PDF RECOMMENDATION BLOCK
 * ========================
 * 
 * The canonical component for rendering recommendations in PDFs.
 * Enforces zero-truncation rules with proper vertical stacking.
 * 
 * Structure:
 * - Vertical stack only
 * - Each section is its own block: Heading, Explanation, Bullet findings, Action items
 * - Each bullet = its own block-level element
 * - Each recommendation = independent height calculation
 * - Long text continues across pages automatically
 */

import {
  PdfContext,
  PDF_COLORS,
  renderSafeText,
  renderBulletItem,
  renderCalloutBox,
  ensureSpace,
  checkPageBreak,
  renderSectionHeader,
  getScoreColor,
  renderScoreBar,
  sanitizeText,
} from "./PdfCore";

// ============ TYPES ============

export interface RecommendationBlockData {
  title: string;
  score?: number;
  businessContext?: {
    impacts?: string;
    whyMatters?: string;
  };
  findings?: string[];
  recommendations?: string[];
}

export interface RecommendationCardData {
  label: string;
  content: string;
  impact?: string;
}

// ============ RECOMMENDATION BLOCK ============

/**
 * Render a complete recommendation section with findings and recommendations
 * Uses vertical stack - each element is its own block, NEVER inline
 */
export function renderRecommendationBlock(
  ctx: PdfContext,
  data: RecommendationBlockData
): number {
  const { doc, margin, contentWidth } = ctx;
  const startY = ctx.y;
  
  // Pre-calculate minimum header height
  const headerHeight = 50;
  ensureSpace(ctx, headerHeight);
  
  const scoreColor = data.score !== undefined ? getScoreColor(data.score) : PDF_COLORS.primary;
  
  // Section header card background
  doc.setFillColor(PDF_COLORS.cardBg[0], PDF_COLORS.cardBg[1], PDF_COLORS.cardBg[2]);
  doc.roundedRect(margin, ctx.y - 5, contentWidth, 45, 4, 4, "F");
  
  // Left accent bar
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.rect(margin, ctx.y - 5, 4, 45, "F");
  
  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.textPrimary[0], PDF_COLORS.textPrimary[1], PDF_COLORS.textPrimary[2]);
  doc.text(data.title, margin + 12, ctx.y + 5);
  
  // Score display (if provided)
  if (data.score !== undefined) {
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${data.score}`, ctx.pageWidth - margin - 25, ctx.y + 5, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(PDF_COLORS.textMuted[0], PDF_COLORS.textMuted[1], PDF_COLORS.textMuted[2]);
    doc.text("/100", ctx.pageWidth - margin - 10, ctx.y + 5, { align: "right" });
    
    // Score bar
    renderScoreBar(ctx, data.score, { y: ctx.y + 12, height: 6 });
  }
  
  // Business impact subtitle
  if (data.businessContext?.impacts) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(PDF_COLORS.textSecondary[0], PDF_COLORS.textSecondary[1], PDF_COLORS.textSecondary[2]);
    doc.text(`Impacts: ${data.businessContext.impacts}`, margin + 12, ctx.y + 28);
  }
  
  ctx.y += 50;
  
  // Why This Matters callout (for low scores)
  if (data.businessContext?.whyMatters && data.score !== undefined && data.score < 70) {
    renderCalloutBox(ctx, "Why This Matters", data.businessContext.whyMatters, {
      titleColor: PDF_COLORS.primary,
      bgColor: PDF_COLORS.primaryLight,
    });
  }
  
  // Findings - each as separate block, full text
  if (data.findings && data.findings.length > 0) {
    ctx.y += 3;
    
    data.findings.forEach((finding) => {
      const text = sanitizeText(finding);
      renderBulletItem(ctx, text, {
        bulletStyle: "circle",
        bulletColor: PDF_COLORS.primary,
        textColor: PDF_COLORS.textSecondary,
      });
    });
  }
  
  // Recommendations - each as separate block, full text
  if (data.recommendations && data.recommendations.length > 0) {
    ctx.y += 3;
    
    data.recommendations.forEach((rec) => {
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
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(PDF_COLORS.textSecondary[0], PDF_COLORS.textSecondary[1], PDF_COLORS.textSecondary[2]);
        
        checkPageBreak(ctx, 5);
        doc.text(`${label}:`, margin + 4, ctx.y);
        ctx.y += 4.5;
        
        // Value - ALL lines
        doc.setFont("helvetica", "normal");
        const valueLines = doc.splitTextToSize(value, contentWidth - 8);
        valueLines.forEach((line: string) => {
          checkPageBreak(ctx, 4.5);
          doc.text(line, margin + 4, ctx.y);
          ctx.y += 4.5;
        });
        
        ctx.y += 2;
      } else {
        // Regular recommendation with arrow
        renderBulletItem(ctx, rec, {
          bulletStyle: "arrow",
          bulletColor: PDF_COLORS.success,
          textColor: PDF_COLORS.textSecondary,
        });
      }
    });
  }
  
  ctx.y += 8;
  
  return ctx.y - startY;
}

// ============ RECOMMENDATION CARD ============

/**
 * Render a recommendation card with label, content, and optional impact
 * Content auto-expands, NEVER truncates
 */
export function renderRecommendationCard(
  ctx: PdfContext,
  data: RecommendationCardData
): number {
  const { doc, margin, contentWidth } = ctx;
  
  // Pre-calculate heights
  doc.setFontSize(10);
  const contentLines = doc.splitTextToSize(data.content, contentWidth - 24);
  const impactLines = data.impact ? doc.splitTextToSize(data.impact, contentWidth - 30) : [];
  const blockHeight = 18 + contentLines.length * 5 + (data.impact ? 12 + impactLines.length * 4 : 0);
  
  ensureSpace(ctx, blockHeight);
  
  const startY = ctx.y;
  
  // Card background
  doc.setFillColor(PDF_COLORS.white[0], PDF_COLORS.white[1], PDF_COLORS.white[2]);
  doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, ctx.y, contentWidth, blockHeight, 3, 3, "FD");
  
  // Label badge
  doc.setFillColor(PDF_COLORS.primaryLight[0], PDF_COLORS.primaryLight[1], PDF_COLORS.primaryLight[2]);
  doc.roundedRect(margin + 8, ctx.y + 6, 50, 8, 2, 2, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.text(data.label.toUpperCase(), margin + 12, ctx.y + 11);
  
  // Content - ALL lines
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(PDF_COLORS.textPrimary[0], PDF_COLORS.textPrimary[1], PDF_COLORS.textPrimary[2]);
  contentLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 12, ctx.y + 22 + i * 5);
  });
  
  // Impact statement
  if (data.impact && impactLines.length > 0) {
    const impactY = ctx.y + 22 + contentLines.length * 5 + 6;
    doc.setFillColor(PDF_COLORS.successLight[0], PDF_COLORS.successLight[1], PDF_COLORS.successLight[2]);
    doc.roundedRect(margin + 8, impactY - 3, contentWidth - 16, 10 + impactLines.length * 4, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(PDF_COLORS.success[0], PDF_COLORS.success[1], PDF_COLORS.success[2]);
    doc.text("BUSINESS IMPACT:", margin + 12, impactY + 3);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.successDark[0], PDF_COLORS.successDark[1], PDF_COLORS.successDark[2]);
    impactLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 50, impactY + 3 + i * 4);
    });
  }
  
  ctx.y += blockHeight + 6;
  
  return blockHeight + 6;
}

// ============ CTA CARD ============

/**
 * Render a CTA highlight card
 */
export function renderCTACard(
  ctx: PdfContext,
  label: string,
  text: string
): number {
  const { doc, margin, contentWidth } = ctx;
  
  ensureSpace(ctx, 28);
  
  // Card with accent
  doc.setFillColor(PDF_COLORS.primaryLight[0], PDF_COLORS.primaryLight[1], PDF_COLORS.primaryLight[2]);
  doc.roundedRect(margin, ctx.y, contentWidth, 24, 4, 4, "F");
  
  // Left accent
  doc.setFillColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.roundedRect(margin, ctx.y, 5, 24, 2, 2, "F");
  
  // Arrow indicator
  doc.setFillColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.circle(margin + 18, ctx.y + 12, 5, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(">", margin + 18, ctx.y + 14.5, { align: "center" });
  
  // Label
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.textMuted[0], PDF_COLORS.textMuted[1], PDF_COLORS.textMuted[2]);
  doc.text(label.toUpperCase(), margin + 30, ctx.y + 8);
  
  // Text - wrap if needed
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.textPrimary[0], PDF_COLORS.textPrimary[1], PDF_COLORS.textPrimary[2]);
  const lines = doc.splitTextToSize(text, contentWidth - 45);
  doc.text(lines[0], margin + 30, ctx.y + 18);
  
  ctx.y += 30;
  
  return 30;
}

// ============ PRIORITY ITEM ============

/**
 * Render a priority numbered item
 */
export function renderPriorityItem(
  ctx: PdfContext,
  num: number,
  text: string,
  isPriority: boolean = false
): number {
  const { doc, margin, contentWidth } = ctx;
  
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, contentWidth - 26);
  const blockHeight = lines.length * 5 + 10;
  
  ensureSpace(ctx, blockHeight);
  
  // Number badge
  const badgeColor = isPriority ? PDF_COLORS.warning : PDF_COLORS.primaryMid;
  doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.circle(margin + 8, ctx.y + 5, 6, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(num.toString(), margin + 8, ctx.y + 7.5, { align: "center" });
  
  // Text - ALL lines
  doc.setTextColor(PDF_COLORS.textSecondary[0], PDF_COLORS.textSecondary[1], PDF_COLORS.textSecondary[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  lines.forEach((line: string, i: number) => {
    doc.text(line, margin + 20, ctx.y + 6 + i * 5);
  });
  
  ctx.y += blockHeight;
  
  return blockHeight;
}

// ============ SERVICE CARD ============

/**
 * Render a service card with description and CTA
 * Description auto-expands to fit full content (no truncation)
 */
export function renderServiceCard(
  ctx: PdfContext,
  serviceName: string,
  description: string,
  cta: string
): number {
  const { doc, margin, contentWidth } = ctx;
  
  // Calculate actual height needed for full description
  doc.setFontSize(9);
  const descLines = doc.splitTextToSize(description, contentWidth - 24);
  const descHeight = descLines.length * 5;
  const cardHeight = Math.max(46, 24 + descHeight + 16);
  
  ensureSpace(ctx, cardHeight + 8);
  
  // Card with shadow effect
  doc.setFillColor(PDF_COLORS.cardBgAlt[0], PDF_COLORS.cardBgAlt[1], PDF_COLORS.cardBgAlt[2]);
  doc.roundedRect(margin + 1, ctx.y + 1, contentWidth, cardHeight, 4, 4, "F");
  doc.setFillColor(PDF_COLORS.white[0], PDF_COLORS.white[1], PDF_COLORS.white[2]);
  doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.roundedRect(margin, ctx.y, contentWidth, cardHeight, 4, 4, "FD");
  
  // Service name
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.textPrimary[0], PDF_COLORS.textPrimary[1], PDF_COLORS.textPrimary[2]);
  doc.text(serviceName, margin + 12, ctx.y + 12);
  
  // Description - render ALL lines (no truncation)
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(PDF_COLORS.textSecondary[0], PDF_COLORS.textSecondary[1], PDF_COLORS.textSecondary[2]);
  descLines.forEach((line: string, i: number) => {
    doc.text(line, margin + 12, ctx.y + 21 + i * 5);
  });
  
  // CTA badge - positioned after description
  const ctaY = ctx.y + 21 + descHeight + 4;
  doc.setFillColor(PDF_COLORS.successLight[0], PDF_COLORS.successLight[1], PDF_COLORS.successLight[2]);
  doc.roundedRect(margin + 12, ctaY, 70, 8, 2, 2, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.success[0], PDF_COLORS.success[1], PDF_COLORS.success[2]);
  doc.text("RECOMMENDED CTA: " + cta, margin + 15, ctaY + 5);
  
  ctx.y += cardHeight + 8;
  
  return cardHeight + 8;
}

// ============ CHECKLIST ITEM ============

/**
 * Render an execution checklist item
 * Uses ASCII [ ] checkbox instead of Unicode to avoid font issues
 */
export function renderChecklistItem(
  ctx: PdfContext,
  text: string,
  completed: boolean = false
): number {
  const { doc, margin, contentWidth } = ctx;
  
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, contentWidth - 20);
  const blockHeight = lines.length * 5 + 6;
  
  ensureSpace(ctx, blockHeight);
  
  // Checkbox using simple rectangle (no Unicode)
  doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 4, ctx.y, 6, 6, 1, 1, "S");
  
  if (completed) {
    // Fill and draw checkmark with lines
    doc.setFillColor(PDF_COLORS.success[0], PDF_COLORS.success[1], PDF_COLORS.success[2]);
    doc.roundedRect(margin + 4, ctx.y, 6, 6, 1, 1, "F");
    // Checkmark drawn with lines (not Unicode)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.line(margin + 5.5, ctx.y + 3, margin + 7, ctx.y + 5);
    doc.line(margin + 7, ctx.y + 5, margin + 9, ctx.y + 1.5);
  }
  
  // Text - ALL lines
  doc.setFont("helvetica", "normal");
  doc.setTextColor(PDF_COLORS.textSecondary[0], PDF_COLORS.textSecondary[1], PDF_COLORS.textSecondary[2]);
  lines.forEach((line: string, i: number) => {
    doc.text(line, margin + 14, ctx.y + 4 + i * 5);
  });
  
  ctx.y += blockHeight;
  
  return blockHeight;
}
