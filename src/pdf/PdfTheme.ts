/**
 * PDF Design System - Centralized Theme & Styles
 * 
 * CRITICAL: PDF components must NEVER use fixed height for dynamic text.
 * All text containers must auto-expand vertically based on content length.
 * 
 * Forbidden patterns in PDF rendering:
 * - height (fixed) for text containers
 * - maxHeight for text containers
 * - overflow: 'hidden'
 * - textOverflow: 'ellipsis'
 * - whiteSpace: 'nowrap'
 * - lineClamp / line-clamp
 * - .slice() on text lines (use only for items, never for lines within an item)
 */

// Premium consulting-grade color palette (RGB values)
export const PDF_COLORS = {
  // Primary brand colors
  primary: [37, 99, 235] as const,
  primaryDark: [30, 64, 175] as const,
  primaryLight: [239, 246, 255] as const,
  primaryMid: [59, 130, 246] as const,
  
  // Success/positive colors
  success: [22, 163, 74] as const,
  successLight: [240, 253, 244] as const,
  successDark: [21, 128, 61] as const,
  successVibrant: [16, 185, 129] as const,
  
  // Warning/attention colors
  warning: [217, 119, 6] as const,
  warningLight: [254, 252, 232] as const,
  
  // Danger colors
  danger: [220, 38, 38] as const,
  dangerLight: [254, 242, 242] as const,
  
  // Accent colors
  accent: [124, 58, 237] as const,
  accentLight: [245, 243, 255] as const,
  indigo: [99, 102, 241] as const,
  
  // Text hierarchy
  textPrimary: [15, 23, 42] as const,
  textSecondary: [51, 65, 85] as const,
  textMuted: [100, 116, 139] as const,
  textLight: [148, 163, 184] as const,
  
  // Backgrounds & borders
  white: [255, 255, 255] as const,
  cardBg: [248, 250, 252] as const,
  cardBgAlt: [241, 245, 249] as const,
  border: [226, 232, 240] as const,
  borderLight: [241, 245, 249] as const,
  
  // Neutral palette
  neutral50: [248, 250, 252] as const,
  neutral100: [241, 245, 249] as const,
  neutral200: [226, 232, 240] as const,
  neutral300: [203, 213, 225] as const,
  neutral400: [148, 163, 184] as const,
  neutral500: [100, 116, 139] as const,
  neutral600: [71, 85, 105] as const,
  neutral700: [51, 65, 85] as const,
  neutral800: [30, 41, 59] as const,
  neutral900: [15, 23, 42] as const,
  
  // Premium gold accent
  gold: [180, 140, 50] as const,
  goldLight: [255, 251, 235] as const,
  
  // Amber for NOT SCORABLE
  amber: [180, 83, 9] as const,
  amberLight: [254, 243, 199] as const,
  
  // Before/After comparison
  beforeBg: [241, 245, 249] as const,
  beforeAccent: [100, 116, 139] as const,
  beforeText: [71, 85, 105] as const,
  afterBg: [209, 250, 229] as const,
  afterAccent: [16, 185, 129] as const,
} as const;

// Typography settings
export const PDF_TYPOGRAPHY = {
  // Font sizes
  h1: 24,
  h2: 18,
  h3: 14,
  h4: 12,
  body: 10,
  small: 9,
  tiny: 8,
  micro: 7,
  
  // Line heights (multiplier)
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  // Absolute line heights for jsPDF (in mm)
  lineHeightMm: {
    h1: 8,
    h2: 6.5,
    h3: 5.5,
    h4: 5,
    body: 4.5,
    small: 4,
    tiny: 3.5,
    micro: 3,
  },
} as const;

// Spacing constants
export const PDF_SPACING = {
  page: {
    margin: 18,
    marginLarge: 20,
    footerHeight: 35,
    headerHeight: 25,
  },
  section: {
    gap: 12,
    gapLarge: 20,
  },
  card: {
    padding: 8,
    paddingLarge: 12,
    radius: 4,
  },
  text: {
    paragraphGap: 6,
    listItemGap: 4,
    bulletIndent: 12,
    numberIndent: 16,
  },
} as const;

// Score color helpers
export const getScoreColor = (score: number): readonly [number, number, number] => {
  if (score >= 70) return PDF_COLORS.success;
  if (score >= 50) return PDF_COLORS.warning;
  return PDF_COLORS.danger;
};

export const getScoreColorLight = (score: number): readonly [number, number, number] => {
  if (score >= 70) return PDF_COLORS.successLight;
  if (score >= 50) return PDF_COLORS.warningLight;
  return PDF_COLORS.dangerLight;
};

export const getGradeLabel = (score: number): string => {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Needs Attention";
};

// Text sanitization for professional presentation
export const sanitizeFindingText = (text: string): string => {
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
};

// Credibility badge (always shown for methodology transparency)
export const CREDIBILITY_BADGE = "Objective, criteria-based scoring. No manual adjustments. Same methodology before and after.";

// Type for RGB color
export type RGBColor = readonly [number, number, number];
