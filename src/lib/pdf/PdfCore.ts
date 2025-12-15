/**
 * PDF CORE - Zero Truncation Rendering Engine
 * ============================================
 * 
 * HARD RULES (must all be enforced):
 * 1. No fixed heights on any PDF text container
 * 2. No inline text mixed with icons in the same flow container
 * 3. No manual line clamping, ellipsis, or truncation
 * 4. Text must control layout height, never the reverse
 * 5. Page height expands to fit content - content NEVER shrinks to fit page
 * 
 * All PDF generators MUST use these shared components.
 */

import jsPDF from "jspdf";

// ============ TYPES ============

export interface PdfContext {
  doc: jsPDF;
  y: number;
  currentPage: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  footerHeight: number;
  addFooter: () => void;
}

export interface TextBlockOptions {
  fontSize?: number;
  fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
  textColor?: readonly number[] | number[];
  lineHeight?: number;
  indent?: number;
}

export interface BulletOptions extends TextBlockOptions {
  bulletStyle?: "circle" | "arrow" | "number" | "check";
  bulletColor?: readonly number[] | number[];
  bulletIndex?: number;
}

export interface CardOptions {
  bgColor?: readonly number[] | number[];
  borderColor?: readonly number[] | number[];
  accentColor?: readonly number[] | number[];
  padding?: number;
}

// Premium color palette
export const PDF_COLORS = {
  // Primary brand
  primary: [30, 64, 175] as const,
  primaryLight: [239, 246, 255] as const,
  primaryDark: [23, 37, 84] as const,
  primaryMid: [59, 130, 246] as const,
  
  // Success
  success: [22, 163, 74] as const,
  successLight: [240, 253, 244] as const,
  successDark: [21, 128, 61] as const,
  
  // Warning
  warning: [217, 119, 6] as const,
  warningLight: [254, 252, 232] as const,
  
  // Danger
  danger: [220, 38, 38] as const,
  dangerLight: [254, 242, 242] as const,
  
  // Amber (NOT SCORABLE)
  amber: [180, 83, 9] as const,
  amberLight: [254, 243, 199] as const,
  
  // Text hierarchy
  textPrimary: [15, 23, 42] as const,
  textSecondary: [51, 65, 85] as const,
  textMuted: [100, 116, 139] as const,
  textLight: [148, 163, 184] as const,
  
  // Backgrounds
  cardBg: [248, 250, 252] as const,
  cardBgAlt: [241, 245, 249] as const,
  border: [226, 232, 240] as const,
  borderLight: [241, 245, 249] as const,
  white: [255, 255, 255] as const,
  
  // Accents
  accent: [99, 102, 241] as const,
  gold: [180, 140, 50] as const,
  goldLight: [255, 251, 235] as const,
} as const;

// ============ CORE PAGE MANAGEMENT ============

/**
 * Create a new PDF context with consistent settings
 */
export function createPdfContext(options?: { margin?: number; footerHeight?: number }): PdfContext {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = options?.margin || 18;
  const footerHeight = options?.footerHeight || 35;
  
  return {
    doc,
    y: 25,
    currentPage: 1,
    pageWidth,
    pageHeight,
    margin,
    contentWidth: pageWidth - margin * 2,
    footerHeight,
    addFooter: () => {}, // Will be set by the generator
  };
}

/**
 * Calculate available vertical space on current page
 */
export function getAvailableSpace(ctx: PdfContext): number {
  return ctx.pageHeight - ctx.footerHeight - ctx.y;
}

/**
 * Check if content needs new page - NEVER compress content
 * If block is too large for a page, it will flow across pages naturally
 */
export function ensureSpace(ctx: PdfContext, requiredHeight: number): void {
  const available = getAvailableSpace(ctx);
  
  if (requiredHeight > available) {
    // Only add new page if block would fit on a fresh page
    // OR if we're near the bottom of current page
    if (requiredHeight < ctx.pageHeight - ctx.footerHeight - 40 || available < 30) {
      addNewPage(ctx);
    }
  }
}

/**
 * Add a new page and reset Y position
 */
export function addNewPage(ctx: PdfContext): void {
  ctx.addFooter();
  ctx.doc.addPage();
  ctx.currentPage++;
  ctx.y = 25;
}

/**
 * Safe page break check - use before each text line
 */
export function checkPageBreak(ctx: PdfContext, lineHeight: number): void {
  if (ctx.y + lineHeight > ctx.pageHeight - ctx.footerHeight) {
    addNewPage(ctx);
  }
}

// ============ ZERO-TRUNCATION TEXT RENDERING ============

/**
 * Render text that auto-expands vertically and NEVER truncates
 * This is the core building block - all text must use this
 */
export function renderSafeText(
  ctx: PdfContext,
  text: string,
  options?: TextBlockOptions
): number {
  const {
    fontSize = 9,
    fontStyle = "normal",
    textColor = PDF_COLORS.textSecondary,
    lineHeight = 4.5,
    indent = 0,
  } = options || {};
  
  const { doc, margin, contentWidth } = ctx;
  const startX = margin + indent;
  const maxWidth = contentWidth - indent;
  
  // Set font properties
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", fontStyle);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  // Split text to fit width - NEVER truncate
  const lines = doc.splitTextToSize(text, maxWidth);
  const totalHeight = lines.length * lineHeight;
  
  // Try to keep block together if it fits on a fresh page
  ensureSpace(ctx, Math.min(totalHeight, ctx.pageHeight - ctx.footerHeight - 60));
  
  // Render ALL lines - page break between lines as needed
  lines.forEach((line: string) => {
    checkPageBreak(ctx, lineHeight);
    doc.text(line, startX, ctx.y);
    ctx.y += lineHeight;
  });
  
  return totalHeight;
}

/**
 * Render a labeled text block (Label: Value pattern)
 * Label on its own line, value wraps naturally
 */
export function renderLabeledText(
  ctx: PdfContext,
  label: string,
  value: string,
  options?: TextBlockOptions
): number {
  const {
    fontSize = 9,
    textColor = PDF_COLORS.textSecondary,
    lineHeight = 4.5,
    indent = 0,
  } = options || {};
  
  const { doc, margin, contentWidth } = ctx;
  const startX = margin + indent;
  const maxWidth = contentWidth - indent;
  
  // Calculate total height
  doc.setFontSize(fontSize);
  const valueLines = doc.splitTextToSize(value, maxWidth);
  const totalHeight = lineHeight + valueLines.length * lineHeight;
  
  ensureSpace(ctx, Math.min(totalHeight, ctx.pageHeight - ctx.footerHeight - 60));
  
  // Render label (bold)
  checkPageBreak(ctx, lineHeight);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`${label}:`, startX, ctx.y);
  ctx.y += lineHeight;
  
  // Render value (normal) - ALL lines
  doc.setFont("helvetica", "normal");
  valueLines.forEach((line: string) => {
    checkPageBreak(ctx, lineHeight);
    doc.text(line, startX, ctx.y);
    ctx.y += lineHeight;
  });
  
  return totalHeight;
}

// ============ BULLET LISTS (ZERO TRUNCATION) ============

/**
 * Render a single bullet item - text always separate from bullet
 * Bullet is positioned OUTSIDE text flow
 */
export function renderBulletItem(
  ctx: PdfContext,
  text: string,
  options?: BulletOptions
): number {
  const {
    fontSize = 9,
    fontStyle = "normal",
    textColor = PDF_COLORS.textSecondary,
    lineHeight = 4.5,
    bulletStyle = "circle",
    bulletColor = PDF_COLORS.primary,
    bulletIndex = 0,
  } = options || {};
  
  const { doc, margin, contentWidth } = ctx;
  const bulletOffset = bulletStyle === "number" ? 16 : 12;
  const textStartX = margin + bulletOffset;
  const maxWidth = contentWidth - bulletOffset;
  
  // Calculate block height
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxWidth);
  const blockHeight = lines.length * lineHeight + 4;
  
  // Try to keep bullet block together
  ensureSpace(ctx, Math.min(blockHeight, ctx.pageHeight - ctx.footerHeight - 60));
  
  // Draw bullet (separate from text flow)
  const bulletY = ctx.y + 1;
  doc.setFillColor(bulletColor[0], bulletColor[1], bulletColor[2]);
  
  if (bulletStyle === "circle") {
    doc.circle(margin + 5, bulletY, 2, "F");
  } else if (bulletStyle === "arrow") {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(bulletColor[0], bulletColor[1], bulletColor[2]);
    doc.text("→", margin + 3, bulletY + 1);
  } else if (bulletStyle === "number") {
    doc.circle(margin + 6, bulletY, 5, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text((bulletIndex + 1).toString(), margin + 6, bulletY + 2.5, { align: "center" });
  } else if (bulletStyle === "check") {
    doc.circle(margin + 5, bulletY, 3, "F");
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    doc.line(margin + 3.5, bulletY, margin + 5, bulletY + 1.5);
    doc.line(margin + 5, bulletY + 1.5, margin + 7, bulletY - 1);
  }
  
  // Render ALL text lines
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", fontStyle);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  lines.forEach((line: string) => {
    checkPageBreak(ctx, lineHeight);
    doc.text(line, textStartX, ctx.y + 3);
    ctx.y += lineHeight;
  });
  
  ctx.y += 2; // Spacing after bullet
  
  return blockHeight;
}

/**
 * Render a complete bullet list - all items, no truncation
 */
export function renderBulletList(
  ctx: PdfContext,
  items: string[],
  options?: BulletOptions
): number {
  let totalHeight = 0;
  
  items.forEach((item, index) => {
    totalHeight += renderBulletItem(ctx, item, {
      ...options,
      bulletIndex: index,
    });
  });
  
  return totalHeight;
}

// ============ CARDS AND CONTAINERS ============

/**
 * Render a content card with auto-expanding height
 * Card height is determined by content, NEVER fixed
 */
export function renderContentCard(
  ctx: PdfContext,
  content: () => number, // Function that renders content and returns height
  options?: CardOptions
): number {
  const {
    bgColor = PDF_COLORS.cardBg,
    borderColor,
    accentColor,
    padding = 10,
  } = options || {};
  
  const { doc, margin, contentWidth } = ctx;
  
  // Store starting Y
  const startY = ctx.y;
  
  // Add padding before content
  ctx.y += padding;
  
  // Temporarily adjust margin for padded content
  const origMargin = ctx.margin;
  ctx.margin = margin + padding;
  ctx.contentWidth = contentWidth - padding * 2;
  
  // Render content - get actual height used
  const contentHeight = content();
  
  // Restore margins
  ctx.margin = origMargin;
  ctx.contentWidth = contentWidth;
  
  // Add padding after content
  ctx.y += padding;
  
  // Calculate total card height
  const cardHeight = ctx.y - startY;
  
  // Draw card background (behind content - we need to draw after calculating height)
  // This is a limitation - we draw outline after content
  if (borderColor) {
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, startY, contentWidth, cardHeight, 4, 4, "S");
  }
  
  // Draw accent bar if specified
  if (accentColor) {
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(margin, startY, 4, cardHeight, "F");
  }
  
  return cardHeight;
}

/**
 * Render a callout box (highlighted text block)
 */
export function renderCalloutBox(
  ctx: PdfContext,
  title: string,
  content: string,
  options?: {
    titleColor?: readonly number[] | number[];
    bgColor?: readonly number[] | number[];
    textColor?: readonly number[] | number[];
  }
): number {
  const {
    titleColor = PDF_COLORS.primary,
    bgColor = PDF_COLORS.primaryLight,
    textColor = PDF_COLORS.textSecondary,
  } = options || {};
  
  const { doc, margin, contentWidth } = ctx;
  
  // Calculate content height
  doc.setFontSize(9);
  const contentLines = doc.splitTextToSize(content, contentWidth - 16);
  const boxHeight = 16 + contentLines.length * 4.5;
  
  ensureSpace(ctx, boxHeight + 4);
  
  // Draw background
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.roundedRect(margin, ctx.y - 3, contentWidth, boxHeight, 3, 3, "F");
  
  // Draw title
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
  doc.text(title, margin + 8, ctx.y + 5);
  
  // Draw content - ALL lines
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  let lineY = ctx.y + 13;
  contentLines.forEach((line: string) => {
    doc.text(line, margin + 8, lineY);
    lineY += 4.5;
  });
  
  ctx.y += boxHeight + 4;
  
  return boxHeight + 4;
}

// ============ SECTION HEADERS ============

/**
 * Render a section header with optional icon
 */
export function renderSectionHeader(
  ctx: PdfContext,
  title: string,
  options?: {
    subtitle?: string;
    iconLetter?: string;
    iconColor?: readonly number[] | number[];
    size?: "large" | "medium" | "small";
  }
): number {
  const {
    subtitle,
    iconLetter,
    iconColor = PDF_COLORS.primary,
    size = "medium",
  } = options || {};
  
  const { doc, margin, contentWidth } = ctx;
  
  const sizes = {
    large: { title: 24, subtitle: 11, icon: 10 },
    medium: { title: 16, subtitle: 9, icon: 8 },
    small: { title: 13, subtitle: 8, icon: 7 },
  };
  const s = sizes[size];
  
  let headerHeight = s.title + (subtitle ? s.subtitle + 8 : 0) + 15;
  ensureSpace(ctx, headerHeight);
  
  // Section divider
  if (ctx.y > 40 && size !== "large") {
    doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, ctx.y - 8, ctx.pageWidth - margin, ctx.y - 8);
  }
  
  let textStartX = margin;
  
  // Draw icon if provided
  if (iconLetter) {
    doc.setFillColor(iconColor[0], iconColor[1], iconColor[2]);
    doc.circle(margin + 10, ctx.y + 8, 8, "F");
    doc.setFontSize(s.icon);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(iconLetter, margin + 10, ctx.y + 11, { align: "center" });
    textStartX = margin + 24;
  }
  
  // Title
  doc.setFontSize(s.title);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.primaryDark[0], PDF_COLORS.primaryDark[1], PDF_COLORS.primaryDark[2]);
  doc.text(title, textStartX, ctx.y + 10);
  
  ctx.y += s.title + 5;
  
  // Subtitle
  if (subtitle) {
    doc.setFontSize(s.subtitle);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.textMuted[0], PDF_COLORS.textMuted[1], PDF_COLORS.textMuted[2]);
    const subLines = doc.splitTextToSize(subtitle, contentWidth - (iconLetter ? 30 : 0));
    subLines.forEach((line: string) => {
      doc.text(line, textStartX, ctx.y);
      ctx.y += s.subtitle * 0.4 + 2;
    });
    ctx.y += 4;
  }
  
  return headerHeight;
}

// ============ SCORE INDICATORS ============

/**
 * Get score-based color
 */
export function getScoreColor(score: number): readonly number[] {
  if (score >= 70) return PDF_COLORS.success;
  if (score >= 50) return PDF_COLORS.warning;
  return PDF_COLORS.danger;
}

export function getScoreColorLight(score: number): readonly number[] {
  if (score >= 70) return PDF_COLORS.successLight;
  if (score >= 50) return PDF_COLORS.warningLight;
  return PDF_COLORS.dangerLight;
}

/**
 * Render a score bar
 */
export function renderScoreBar(
  ctx: PdfContext,
  score: number,
  options?: { width?: number; height?: number; x?: number; y?: number }
): void {
  const { width = ctx.contentWidth - 70, height = 6, x = ctx.margin + 12, y = ctx.y } = options || {};
  const { doc } = ctx;
  
  const scoreColor = getScoreColor(score);
  
  // Background bar
  doc.setFillColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.roundedRect(x, y, width, height, 3, 3, "F");
  
  // Score bar
  const scoreWidth = Math.max((score / 100) * width, 8);
  doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.roundedRect(x, y, scoreWidth, height, 3, 3, "F");
}

/**
 * Render a score circle
 */
export function renderScoreCircle(
  ctx: PdfContext,
  score: number,
  centerX: number,
  centerY: number,
  size: number = 28
): void {
  const { doc } = ctx;
  const scoreColor = getScoreColor(score);
  const bgColor = getScoreColorLight(score);
  
  // Outer glow
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
  doc.circle(centerX, centerY, size + 4, "F");
  
  // Main circle
  doc.setFillColor(255, 255, 255);
  doc.circle(centerX, centerY, size, "F");
  
  // Score ring
  doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setLineWidth(4);
  doc.circle(centerX, centerY, size - 3, "S");
  
  // Score text
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(score.toString(), centerX, centerY + 3, { align: "center" });
}

// ============ UTILITY HELPERS ============

/**
 * Sanitize text for professional presentation
 */
export function sanitizeText(text: string): string {
  const replacements: [RegExp, string][] = [
    [/could not (fully )?analyze/gi, "Limited data available from automated scan"],
    [/error\s*:?\s*/gi, "Note: "],
    [/failed to/gi, "Unable to"],
    [/cannot\s+/gi, "Unable to "],
    [/n\/a/gi, "Not available"],
    [/null|undefined/gi, "Not specified"],
  ];
  
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Get grade label from score
 */
export function getGradeLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Needs Attention";
}

/**
 * Get grade description from score
 */
export function getGradeDescription(score: number): string {
  if (score >= 90) return "This website demonstrates strong performance across key evaluation criteria.";
  if (score >= 70) return "This website shows solid fundamentals with opportunities for targeted improvement.";
  if (score >= 50) return "This website has structural issues limiting its effectiveness. Focused improvements recommended.";
  return "This website requires attention in multiple areas that may be impacting business outcomes.";
}
