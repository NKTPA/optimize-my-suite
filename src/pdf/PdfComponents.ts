/**
 * PDF Design System - Reusable Components
 * 
 * CRITICAL: PDF components must NEVER use fixed height for dynamic text.
 * All text containers must auto-expand vertically based on content length.
 * 
 * These components are designed to:
 * 1. Auto-expand based on content
 * 2. Handle page breaks gracefully
 * 3. Never truncate text
 * 4. Keep icons in separate columns from text
 */

import jsPDF from "jspdf";
import { 
  PDF_COLORS, 
  PDF_TYPOGRAPHY, 
  PDF_SPACING, 
  sanitizeFindingText,
  getScoreColor,
  getScoreColorLight,
  RGBColor 
} from "./PdfTheme";

export interface PdfContext {
  doc: jsPDF;
  y: number;
  currentPage: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  addNewPage: () => void;
  addPageIfNeeded: (requiredSpace: number) => boolean;
  addFooter: () => void;
}

/**
 * Create a PDF context with page management helpers
 */
export function createPdfContext(
  doc: jsPDF,
  options?: {
    margin?: number;
    footerRenderer?: (ctx: PdfContext) => void;
  }
): PdfContext {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = options?.margin || PDF_SPACING.page.margin;
  const contentWidth = pageWidth - margin * 2;
  
  const ctx: PdfContext = {
    doc,
    y: 25,
    currentPage: 1,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    addNewPage: () => {
      if (options?.footerRenderer) {
        options.footerRenderer(ctx);
      }
      doc.addPage();
      ctx.currentPage++;
      ctx.y = 25;
    },
    addPageIfNeeded: (requiredSpace: number) => {
      const maxY = pageHeight - PDF_SPACING.page.footerHeight;
      if (ctx.y + requiredSpace > maxY) {
        ctx.addNewPage();
        return true;
      }
      return false;
    },
    addFooter: () => {
      if (options?.footerRenderer) {
        options.footerRenderer(ctx);
      }
    },
  };
  
  return ctx;
}

/**
 * Render safe text that auto-expands and never truncates
 * This is the core component for all text rendering in PDFs
 * 
 * CRITICAL: This function renders ALL lines without truncation
 */
export function renderSafeText(
  ctx: PdfContext,
  text: string,
  options?: {
    fontSize?: number;
    fontStyle?: "normal" | "bold" | "italic";
    textColor?: RGBColor;
    lineHeight?: number;
    startX?: number;
    maxWidth?: number;
    bulletPrefix?: string;
    labelText?: string; // For "Label: Value" pattern - renders label bold on first line
  }
): number {
  const { doc, pageHeight, margin, contentWidth } = ctx;
  const fontSize = options?.fontSize || PDF_TYPOGRAPHY.small;
  const fontStyle = options?.fontStyle || "normal";
  const textColor = options?.textColor || PDF_COLORS.textSecondary;
  const lineHeight = options?.lineHeight || PDF_TYPOGRAPHY.lineHeightMm.small;
  const startX = options?.startX ?? margin;
  const maxWidth = options?.maxWidth ?? contentWidth;
  const maxY = pageHeight - PDF_SPACING.page.footerHeight;
  
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", fontStyle);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  let textToRender = text;
  
  // Handle label:value pattern - label goes on its own line
  if (options?.labelText) {
    // Render label bold on its own line first
    doc.setFont("helvetica", "bold");
    if (ctx.y + lineHeight > maxY) {
      ctx.addNewPage();
    }
    doc.text(`${options.labelText}:`, startX, ctx.y);
    doc.setFont("helvetica", "normal");
    ctx.y += lineHeight;
    textToRender = text;
  } else if (options?.bulletPrefix) {
    textToRender = `${options.bulletPrefix} ${text}`;
  }
  
  // Split text to fit within available width - NO TRUNCATION
  const lines = doc.splitTextToSize(textToRender, maxWidth);
  const totalHeight = lines.length * lineHeight;
  
  // Check if we need a new page BEFORE rendering the block
  // Try to keep entire block together if it fits on a fresh page
  if (ctx.y + totalHeight > maxY && totalHeight < maxY - 30) {
    ctx.addNewPage();
  }
  
  // Render ALL lines - no slicing, no truncation
  lines.forEach((line: string) => {
    // Check if current line needs new page
    if (ctx.y + lineHeight > maxY) {
      ctx.addNewPage();
    }
    doc.text(line, startX, ctx.y);
    ctx.y += lineHeight;
  });
  
  return totalHeight;
}

/**
 * Render a bullet list with auto-expanding items
 * Each item is rendered completely without truncation
 */
export function renderBulletList(
  ctx: PdfContext,
  items: string[],
  options?: {
    bulletStyle?: "circle" | "arrow" | "number" | "check";
    bulletColor?: RGBColor;
    fontSize?: number;
    maxItems?: number; // Limit number of items, but NO line truncation within items
    startX?: number;
    sanitize?: boolean;
  }
): number {
  const { doc, margin, contentWidth, pageHeight } = ctx;
  const bulletColor = options?.bulletColor || PDF_COLORS.primary;
  const bulletStyle = options?.bulletStyle || "circle";
  const fontSize = options?.fontSize || PDF_TYPOGRAPHY.small;
  const startX = options?.startX ?? margin;
  const sanitize = options?.sanitize ?? true;
  const lineHeight = PDF_TYPOGRAPHY.lineHeightMm.small;
  const maxY = pageHeight - PDF_SPACING.page.footerHeight;
  
  const itemsToRender = options?.maxItems ? items.slice(0, options.maxItems) : items;
  let totalHeight = 0;
  
  itemsToRender.forEach((item, index) => {
    const text = sanitize ? sanitizeFindingText(item) : item;
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    
    // Calculate available width for text (after bullet)
    const bulletIndent = bulletStyle === "number" ? PDF_SPACING.text.numberIndent : PDF_SPACING.text.bulletIndent;
    const textWidth = contentWidth - bulletIndent - (startX - margin);
    
    // Calculate block height BEFORE rendering
    const lines = doc.splitTextToSize(text, textWidth);
    const blockHeight = lines.length * lineHeight + PDF_SPACING.text.listItemGap;
    
    // Check if entire block fits, if not and it would fit on fresh page, add new page
    if (ctx.y + blockHeight > maxY && blockHeight < maxY - 30) {
      ctx.addNewPage();
    }
    
    // Draw bullet/number
    const bulletY = ctx.y;
    if (bulletStyle === "circle") {
      doc.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
      doc.circle(startX + 5, bulletY + 1, 2, "F");
    } else if (bulletStyle === "arrow") {
      doc.setFontSize(fontSize);
      doc.setTextColor(bulletColor[0], bulletColor[1], bulletColor[2]);
      doc.text("→", startX + 2, bulletY + 2);
    } else if (bulletStyle === "check") {
      doc.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
      doc.circle(startX + 5, bulletY + 1, 3, "F");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text("✓", startX + 5, bulletY + 2.5, { align: "center" });
    } else if (bulletStyle === "number") {
      doc.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
      doc.circle(startX + 6, bulletY + 1, 5, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text((index + 1).toString(), startX + 6, bulletY + 3, { align: "center" });
    }
    
    // Render ALL lines of text - no truncation
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.textSecondary[0], PDF_COLORS.textSecondary[1], PDF_COLORS.textSecondary[2]);
    
    lines.forEach((line: string, lineIndex: number) => {
      if (ctx.y + lineHeight > maxY) {
        ctx.addNewPage();
      }
      doc.text(line, startX + bulletIndent, ctx.y + 2 + lineIndex * lineHeight);
    });
    
    ctx.y += blockHeight;
    totalHeight += blockHeight;
  });
  
  return totalHeight;
}

/**
 * Render a labeled text block (label on one line, value wrapping below)
 * Useful for "Recommended Headline: ..." patterns
 */
export function renderLabeledText(
  ctx: PdfContext,
  label: string,
  value: string,
  options?: {
    labelColor?: RGBColor;
    valueColor?: RGBColor;
    labelFontSize?: number;
    valueFontSize?: number;
    startX?: number;
    maxWidth?: number;
  }
): number {
  const { doc, margin, contentWidth, pageHeight } = ctx;
  const labelColor = options?.labelColor || PDF_COLORS.textPrimary;
  const valueColor = options?.valueColor || PDF_COLORS.textSecondary;
  const labelFontSize = options?.labelFontSize || PDF_TYPOGRAPHY.small;
  const valueFontSize = options?.valueFontSize || PDF_TYPOGRAPHY.small;
  const startX = options?.startX ?? margin + 4;
  const maxWidth = options?.maxWidth ?? (contentWidth - 8);
  const lineHeight = PDF_TYPOGRAPHY.lineHeightMm.small;
  const maxY = pageHeight - PDF_SPACING.page.footerHeight;
  
  // Calculate total block height
  doc.setFontSize(valueFontSize);
  const valueLines = doc.splitTextToSize(value, maxWidth);
  const blockHeight = lineHeight + valueLines.length * lineHeight + 4;
  
  // Try to keep block together
  if (ctx.y + blockHeight > maxY && blockHeight < maxY - 30) {
    ctx.addNewPage();
  }
  
  // Render label
  doc.setFontSize(labelFontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
  if (ctx.y + lineHeight > maxY) {
    ctx.addNewPage();
  }
  doc.text(`${label}:`, startX, ctx.y);
  ctx.y += lineHeight;
  
  // Render value (all lines)
  doc.setFontSize(valueFontSize);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
  
  valueLines.forEach((line: string) => {
    if (ctx.y + lineHeight > maxY) {
      ctx.addNewPage();
    }
    doc.text(line, startX, ctx.y);
    ctx.y += lineHeight;
  });
  
  ctx.y += 2; // Small gap after block
  
  return blockHeight;
}

/**
 * Render a callout box (Why This Matters, Risk, etc.)
 * Box height auto-expands based on content
 */
export function renderCalloutBox(
  ctx: PdfContext,
  title: string,
  content: string,
  options?: {
    bgColor?: RGBColor;
    titleColor?: RGBColor;
    borderColor?: RGBColor;
    hasBorder?: boolean;
  }
): number {
  const { doc, margin, contentWidth, pageHeight } = ctx;
  const bgColor = options?.bgColor || PDF_COLORS.primaryLight;
  const titleColor = options?.titleColor || PDF_COLORS.primary;
  const borderColor = options?.borderColor;
  const hasBorder = options?.hasBorder ?? false;
  const lineHeight = PDF_TYPOGRAPHY.lineHeightMm.small;
  const maxY = pageHeight - PDF_SPACING.page.footerHeight;
  
  // Calculate content height
  doc.setFontSize(PDF_TYPOGRAPHY.small);
  const contentLines = doc.splitTextToSize(content, contentWidth - 16);
  const boxHeight = 8 + PDF_TYPOGRAPHY.lineHeightMm.small + contentLines.length * lineHeight + 8;
  
  // Check if box fits on page
  if (ctx.y + boxHeight > maxY && boxHeight < maxY - 30) {
    ctx.addNewPage();
  }
  
  const startY = ctx.y;
  
  // Draw background
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.roundedRect(margin, startY, contentWidth, boxHeight, 3, 3, "F");
  
  // Draw border if specified
  if (hasBorder && borderColor) {
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(1);
    doc.roundedRect(margin, startY, contentWidth, boxHeight, 3, 3, "S");
  }
  
  // Render title
  ctx.y = startY + 8;
  doc.setFontSize(PDF_TYPOGRAPHY.small);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text(title, margin + 8, ctx.y);
  ctx.y += lineHeight + 2;
  
  // Render content (all lines)
  doc.setFont("helvetica", "normal");
  doc.setTextColor(PDF_COLORS.textSecondary[0], PDF_COLORS.textSecondary[1], PDF_COLORS.textSecondary[2]);
  
  contentLines.forEach((line: string) => {
    doc.text(line, margin + 8, ctx.y);
    ctx.y += lineHeight;
  });
  
  ctx.y = startY + boxHeight + 4;
  
  return boxHeight + 4;
}

/**
 * Render a section header with optional icon
 */
export function renderSectionHeader(
  ctx: PdfContext,
  title: string,
  options?: {
    subtitle?: string;
    iconLetter?: string;
    iconColor?: RGBColor;
    fontSize?: number;
  }
): number {
  const { doc, margin, contentWidth, pageHeight } = ctx;
  const iconColor = options?.iconColor || PDF_COLORS.primary;
  const fontSize = options?.fontSize || PDF_TYPOGRAPHY.h3;
  const maxY = pageHeight - PDF_SPACING.page.footerHeight;
  
  // Calculate required space
  let requiredSpace = 20;
  if (options?.subtitle) {
    doc.setFontSize(PDF_TYPOGRAPHY.small);
    const subLines = doc.splitTextToSize(options.subtitle, contentWidth - 30);
    requiredSpace += subLines.length * PDF_TYPOGRAPHY.lineHeightMm.small;
  }
  
  ctx.addPageIfNeeded(requiredSpace);
  
  const startY = ctx.y;
  const hasIcon = !!options?.iconLetter;
  
  // Draw icon circle if specified
  if (hasIcon && options?.iconLetter) {
    doc.setFillColor(iconColor[0], iconColor[1], iconColor[2]);
    doc.circle(margin + 10, ctx.y + 4, 8, "F");
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(options.iconLetter, margin + 10, ctx.y + 7, { align: "center" });
  }
  
  // Draw title
  const titleX = hasIcon ? margin + 24 : margin;
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.textPrimary[0], PDF_COLORS.textPrimary[1], PDF_COLORS.textPrimary[2]);
  doc.text(title, titleX, ctx.y + 6);
  
  ctx.y += 14;
  
  // Draw subtitle if specified
  if (options?.subtitle) {
    doc.setFontSize(PDF_TYPOGRAPHY.small);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.textMuted[0], PDF_COLORS.textMuted[1], PDF_COLORS.textMuted[2]);
    const subLines = doc.splitTextToSize(options.subtitle, contentWidth - (hasIcon ? 30 : 0));
    subLines.forEach((line: string) => {
      doc.text(line, titleX, ctx.y);
      ctx.y += PDF_TYPOGRAPHY.lineHeightMm.small;
    });
  }
  
  ctx.y += 6;
  
  return ctx.y - startY;
}

/**
 * Render a score bar visualization
 */
export function renderScoreBar(
  ctx: PdfContext,
  score: number,
  options?: {
    x?: number;
    width?: number;
    height?: number;
    showLabel?: boolean;
  }
): number {
  const { doc, margin, contentWidth } = ctx;
  const x = options?.x ?? margin;
  const width = options?.width ?? contentWidth;
  const height = options?.height ?? 8;
  const scoreColor = getScoreColor(score);
  
  // Background bar
  doc.setFillColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.roundedRect(x, ctx.y, width, height, 4, 4, "F");
  
  // Score bar
  const scoreWidth = Math.max((score / 100) * width, 8);
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(x, ctx.y, scoreWidth, height, 4, 4, "F");
  
  ctx.y += height + 4;
  
  return height + 4;
}

/**
 * Render a divider line
 */
export function renderDivider(
  ctx: PdfContext,
  options?: {
    color?: RGBColor;
    thickness?: number;
    marginY?: number;
  }
): void {
  const { doc, margin, contentWidth } = ctx;
  const color = options?.color || PDF_COLORS.border;
  const thickness = options?.thickness || 0.5;
  const marginY = options?.marginY || 8;
  
  ctx.y += marginY;
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(thickness);
  doc.line(margin, ctx.y, margin + contentWidth, ctx.y);
  ctx.y += marginY;
}

/**
 * Render a card container with dynamic height
 * Returns the Y position after the card for content placement
 */
export function renderCardStart(
  ctx: PdfContext,
  estimatedHeight: number,
  options?: {
    bgColor?: RGBColor;
    borderColor?: RGBColor;
    accentColor?: RGBColor;
    accentPosition?: "left" | "top";
  }
): { startY: number; cardStartY: number } {
  const { doc, margin, contentWidth, pageHeight } = ctx;
  const bgColor = options?.bgColor || PDF_COLORS.cardBg;
  const maxY = pageHeight - PDF_SPACING.page.footerHeight;
  
  // Check if card fits on page
  if (ctx.y + estimatedHeight > maxY && estimatedHeight < maxY - 30) {
    ctx.addNewPage();
  }
  
  const cardStartY = ctx.y - 5;
  
  // Draw card background
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.roundedRect(margin, cardStartY, contentWidth, estimatedHeight, 4, 4, "F");
  
  // Draw border if specified
  if (options?.borderColor) {
    doc.setDrawColor(options.borderColor[0], options.borderColor[1], options.borderColor[2]);
    doc.setLineWidth(1);
    doc.roundedRect(margin, cardStartY, contentWidth, estimatedHeight, 4, 4, "S");
  }
  
  // Draw accent bar if specified
  if (options?.accentColor) {
    doc.setFillColor(options.accentColor[0], options.accentColor[1], options.accentColor[2]);
    if (options.accentPosition === "top") {
      doc.rect(margin, cardStartY, contentWidth, 4, "F");
    } else {
      doc.rect(margin, cardStartY, 4, estimatedHeight, "F");
    }
  }
  
  return { startY: ctx.y, cardStartY };
}

/**
 * Standard page footer renderer
 */
export function renderStandardFooter(
  ctx: PdfContext,
  options?: {
    footerText?: string;
    showCredibilityBadge?: boolean;
    credibilityText?: string;
  }
): void {
  const { doc, pageWidth, pageHeight, margin } = ctx;
  const footerText = options?.footerText || "";
  const showCredibilityBadge = options?.showCredibilityBadge ?? true;
  const credibilityText = options?.credibilityText || 
    "Objective, criteria-based scoring. No manual adjustments. Same methodology before and after.";
  
  // Credibility badge line (above main footer)
  if (showCredibilityBadge) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.textLight[0], PDF_COLORS.textLight[1], PDF_COLORS.textLight[2]);
    doc.text(credibilityText, pageWidth / 2, pageHeight - 20, { align: "center" });
  }
  
  // Subtle divider line
  doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  
  // Footer text
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(PDF_COLORS.textMuted[0], PDF_COLORS.textMuted[1], PDF_COLORS.textMuted[2]);
  
  if (footerText) {
    doc.text(footerText, margin, pageHeight - 8);
  }
  
  // Page number on right
  doc.text(`Page ${ctx.currentPage}`, pageWidth - margin, pageHeight - 8, { align: "right" });
}
