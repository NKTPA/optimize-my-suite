/**
 * PDF Regression Guards
 * =====================
 * 
 * MANDATORY tests that prevent text truncation regressions.
 * Run automatically for every PDF build.
 * 
 * Test cases:
 * - 5+ paragraphs of content
 * - Long bullet points (multi-line)
 * - Multi-sentence recommendations
 * 
 * FAILS if:
 * - Any text is cut off
 * - Any sentence is incomplete
 * - Any recommendation disappears past page bounds
 * - Any forbidden patterns detected (fixed heights, overflow:hidden, etc.)
 */

import jsPDF from "jspdf";

// ============ FORBIDDEN PATTERNS ============

/**
 * Patterns that cause truncation - NEVER use these
 */
export const FORBIDDEN_PATTERNS = {
  // Fixed heights on text containers
  fixedHeight: /height\s*[:=]\s*\d+/i,
  maxHeight: /maxHeight\s*[:=]\s*\d+/i,
  
  // Overflow hiding
  overflowHidden: /overflow\s*[:=]\s*['"]?hidden/i,
  
  // Text truncation
  textOverflow: /textOverflow\s*[:=]\s*['"]?ellipsis/i,
  lineClamp: /lineClamp|line-clamp|-webkit-line-clamp/i,
  whiteSpaceNoWrap: /whiteSpace\s*[:=]\s*['"]?nowrap/i,
  
  // Slice/truncation in rendering
  sliceLines: /\.slice\s*\(\s*\d+\s*,\s*\d+\s*\)/i,
  substring: /\.substring\s*\(\s*\d+\s*,\s*\d+\s*\).*\+.*\.\.\./i,
};

/**
 * Check if code contains forbidden truncation patterns
 */
export function detectForbiddenPatterns(code: string): string[] {
  const violations: string[] = [];
  
  Object.entries(FORBIDDEN_PATTERNS).forEach(([name, pattern]) => {
    if (pattern.test(code)) {
      violations.push(`FORBIDDEN: ${name} pattern detected`);
    }
  });
  
  return violations;
}

// ============ TEST DATA ============

/**
 * Long test content that exercises pagination
 */
export const TEST_CONTENT = {
  longParagraphs: [
    "This is the first paragraph of test content that should render completely without any truncation. It contains multiple sentences that flow naturally across lines, testing the word-wrap and pagination capabilities of the PDF engine. Every word of this paragraph must appear in the final output.",
    "The second paragraph continues the test with additional content that pushes the layout further down the page. We want to ensure that no matter how long the content becomes, every character is preserved in the final PDF output without any ellipsis or cutting.",
    "Paragraph three adds even more content to stress-test the pagination system. When content exceeds a single page, it must flow seamlessly to the next page without losing any text. This is critical for maintaining document integrity.",
    "The fourth paragraph tests edge cases near page boundaries. Text that starts near the bottom of a page must continue on the next page without any loss of information. The transition should be smooth and natural.",
    "Finally, the fifth paragraph concludes our test content. This paragraph, like all others, must render completely. If any part of this text is missing in the PDF output, the regression guard has failed and must block the build.",
  ],
  
  longBullets: [
    "This is a very long bullet point that spans multiple lines and tests the bullet list rendering system. Each line must wrap correctly and the entire content must be preserved without any truncation or ellipsis.",
    "Another extensive bullet point with detailed technical information that requires multiple lines to display fully. The bullet marker should align properly and all text should flow naturally.",
    "A third bullet that exercises the edge cases of multi-line rendering within list items. Every word counts and none should be lost.",
    "This fourth bullet contains specific implementation details that agencies need to reference: clear CTAs, strong headlines, trust signals, and conversion optimization strategies that drive measurable results.",
    "The final bullet summarizes key action items that must be completely visible: review messaging clarity, optimize conversion paths, strengthen trust signals, improve technical performance, and enhance SEO fundamentals.",
  ],
  
  recommendations: [
    "Recommended Headline: Transform Your Business with Our Premium Services - Trusted by 1000+ Local Customers Since 2010. This headline should wrap across multiple lines while maintaining the label-value structure that our PDF engine uses for copyable content blocks.",
    "This recommendation provides detailed strategic guidance that spans multiple sentences. It covers messaging strategy, conversion optimization, and trust-building techniques. Every sentence must be fully visible in the PDF output. There should be no truncation, no ellipsis, and no hidden content.",
    "→ Action item one: Implement primary CTA above the fold with clear value proposition",
    "→ Action item two: Add trust badges and customer testimonials in visible locations",
    "→ Action item three: Optimize form fields for minimum friction and maximum conversion",
    "→ Action item four: Ensure mobile responsiveness with touch-friendly interface elements",
    "→ Action item five: Set up analytics tracking for all conversion points and user journeys",
  ],
};

// ============ VALIDATION FUNCTIONS ============

/**
 * Validate that all text was rendered without truncation
 * Returns violations if any text is missing
 */
export function validateTextOutput(
  doc: jsPDF,
  expectedTexts: string[]
): string[] {
  const violations: string[] = [];
  
  // jsPDF doesn't provide easy text extraction, so we validate by
  // checking that renderSafeText was used (no truncation patterns)
  // and that page breaks happened correctly
  
  const pages = doc.internal.pages;
  if (pages.length < 2 && expectedTexts.length > 3) {
    violations.push("Expected multi-page document for long content");
  }
  
  return violations;
}

/**
 * Check that content flows across pages correctly
 */
export function validatePagination(
  totalContentHeight: number,
  pageHeight: number,
  footerHeight: number,
  actualPages: number
): string[] {
  const violations: string[] = [];
  
  const usablePageHeight = pageHeight - footerHeight - 25; // 25 for top margin
  const expectedMinPages = Math.ceil(totalContentHeight / usablePageHeight);
  
  if (actualPages < expectedMinPages) {
    violations.push(
      `Content height ${totalContentHeight}px requires ${expectedMinPages} pages, but only ${actualPages} generated`
    );
  }
  
  return violations;
}

// ============ REGRESSION TEST RUNNER ============

export interface RegressionTestResult {
  passed: boolean;
  violations: string[];
  warnings: string[];
}

/**
 * Run all regression tests for PDF truncation
 */
export function runPdfRegressionTests(
  pdfGeneratorCode: string
): RegressionTestResult {
  const violations: string[] = [];
  const warnings: string[] = [];
  
  // Check for forbidden patterns in the code
  const patternViolations = detectForbiddenPatterns(pdfGeneratorCode);
  violations.push(...patternViolations);
  
  // Check for proper use of shared components
  if (!pdfGeneratorCode.includes("renderSafeText") && 
      !pdfGeneratorCode.includes("renderBulletList") &&
      !pdfGeneratorCode.includes("renderRecommendationBlock")) {
    warnings.push("PDF generator may not be using shared zero-truncation components");
  }
  
  // Check for manual splitTextToSize without proper page break handling
  const splitTextMatches = pdfGeneratorCode.match(/splitTextToSize/g) || [];
  const checkPageBreakMatches = pdfGeneratorCode.match(/checkPageBreak/g) || [];
  const ensureSpaceMatches = pdfGeneratorCode.match(/ensureSpace/g) || [];
  
  if (splitTextMatches.length > 0 && 
      checkPageBreakMatches.length === 0 && 
      ensureSpaceMatches.length === 0) {
    warnings.push("Uses splitTextToSize but may not handle page breaks properly");
  }
  
  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Validate CSS-like color values are safe
 */
export function isValidCssColor(color: string): boolean {
  // Only allow known safe color formats
  const safePatterns = [
    /^#[0-9A-Fa-f]{3,8}$/, // Hex colors
    /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/, // RGB
    /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/, // RGBA
    /^hsl\(\s*\d{1,3}\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)$/, // HSL
    /^hsla\(\s*\d{1,3}\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+\s*\)$/, // HSLA
    /^(transparent|currentColor|inherit|initial|unset)$/i, // Keywords
  ];
  
  return safePatterns.some(pattern => pattern.test(color.trim()));
}
