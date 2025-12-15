/**
 * PDF REGRESSION GUARDS - Zero Truncation Enforcement
 * ====================================================
 * 
 * Automated detection system for truncation-prone patterns.
 * These guards MUST pass before any PDF code can be merged.
 * 
 * FORBIDDEN PATTERNS:
 * 1. Fixed heights on text containers (height, maxHeight)
 * 2. Overflow hidden/clipping behavior
 * 3. Line clamp or text-overflow: ellipsis
 * 4. Icons inline with text flow (causes wrapping issues)
 * 5. Manual Y increments without page break checks
 */

// Pattern definitions for truncation-prone code
export interface TruncationPattern {
  name: string;
  description: string;
  severity: "critical" | "warning";
  regex: RegExp;
  fix: string;
}

// CRITICAL: These patterns MUST NOT appear in PDF rendering code
export const FORBIDDEN_PATTERNS: TruncationPattern[] = [
  {
    name: "fixedHeight",
    description: "Fixed height on text container - text may be clipped",
    severity: "critical",
    regex: /\.(rect|roundedRect)\s*\([^)]*,\s*\d+\s*[,)]/g, // Fixed height rectangles are OK for cards with known content
    fix: "Calculate height dynamically based on content using doc.splitTextToSize()",
  },
  {
    name: "overflowHidden",
    description: "Overflow hidden - content will be clipped",
    severity: "critical",
    regex: /overflow\s*:\s*['"]?hidden['"]?/gi,
    fix: "Remove overflow:hidden and let content flow naturally",
  },
  {
    name: "lineClamp",
    description: "Line clamping - content will be truncated",
    severity: "critical",
    regex: /line-clamp|webkitLineClamp|-webkit-line-clamp/gi,
    fix: "Remove line-clamp and render all lines",
  },
  {
    name: "textOverflowEllipsis",
    description: "Text overflow ellipsis - content will be truncated",
    severity: "critical",
    regex: /textOverflow\s*:\s*['"]?ellipsis['"]?|text-overflow\s*:\s*['"]?ellipsis['"]?/gi,
    fix: "Remove text-overflow:ellipsis and wrap text properly",
  },
  {
    name: "whiteSpaceNowrap",
    description: "White-space nowrap - long text won't wrap",
    severity: "warning",
    regex: /whiteSpace\s*:\s*['"]?nowrap['"]?|white-space\s*:\s*['"]?nowrap['"]?/gi,
    fix: "Remove white-space:nowrap or ensure content fits",
  },
  {
    name: "sliceWithoutCheck",
    description: "Array slice without comment explaining limit",
    severity: "warning",
    regex: /\.slice\s*\(\s*0\s*,\s*\d+\s*\)(?!\s*\/\/)/g,
    fix: "Add comment explaining why slice is used, or remove limit",
  },
  {
    name: "substringTruncation",
    description: "String substring that may truncate content",
    severity: "warning",
    regex: /\.substring\s*\(\s*0\s*,\s*\d+\s*\)/g,
    fix: "Use splitTextToSize for proper text wrapping instead of substring",
  },
];

// Patterns that indicate CORRECT usage
export const REQUIRED_PATTERNS = [
  {
    name: "splitTextToSize",
    description: "Text wrapping function",
    regex: /splitTextToSize/g,
    purpose: "Wraps text to fit width - MUST be used for all multi-word content",
  },
  {
    name: "checkPageBreak",
    description: "Page break check before rendering",
    regex: /checkPageBreak|ensureSpace|addNewPage/g,
    purpose: "Prevents content from being cut off at page boundaries",
  },
  {
    name: "renderAllLines",
    description: "Loop through all lines without slicing",
    regex: /\.forEach\s*\(\s*\(\s*line/g,
    purpose: "Ensures all lines are rendered, not just first N",
  },
];

export interface ViolationReport {
  pattern: TruncationPattern;
  matches: string[];
  lineNumbers: number[];
}

export interface GuardResult {
  passed: boolean;
  violations: ViolationReport[];
  warnings: ViolationReport[];
  missingPatterns: string[];
}

/**
 * Scan code for truncation-prone patterns
 */
export function scanForTruncationPatterns(code: string): GuardResult {
  const violations: ViolationReport[] = [];
  const warnings: ViolationReport[] = [];
  const missingPatterns: string[] = [];
  
  // Check for forbidden patterns
  FORBIDDEN_PATTERNS.forEach((pattern) => {
    const matches: string[] = [];
    const lineNumbers: number[] = [];
    
    const lines = code.split("\n");
    lines.forEach((line, index) => {
      if (pattern.regex.test(line)) {
        matches.push(line.trim());
        lineNumbers.push(index + 1);
      }
      // Reset regex lastIndex for global patterns
      pattern.regex.lastIndex = 0;
    });
    
    if (matches.length > 0) {
      const report = { pattern, matches, lineNumbers };
      if (pattern.severity === "critical") {
        violations.push(report);
      } else {
        warnings.push(report);
      }
    }
  });
  
  // Check for required patterns
  REQUIRED_PATTERNS.forEach((pattern) => {
    if (!pattern.regex.test(code)) {
      missingPatterns.push(`Missing ${pattern.name}: ${pattern.purpose}`);
    }
    pattern.regex.lastIndex = 0;
  });
  
  return {
    passed: violations.length === 0,
    violations,
    warnings,
    missingPatterns,
  };
}

/**
 * Validate that a PDF generator follows zero-truncation rules
 */
export function validatePdfGenerator(generatorCode: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = scanForTruncationPatterns(generatorCode);
  const errors: string[] = [];
  const warnings: string[] = [];
  
  result.violations.forEach((v) => {
    v.lineNumbers.forEach((line, i) => {
      errors.push(
        `[CRITICAL] Line ${line}: ${v.pattern.name} - ${v.pattern.description}. Fix: ${v.pattern.fix}`
      );
    });
  });
  
  result.warnings.forEach((w) => {
    w.lineNumbers.forEach((line, i) => {
      warnings.push(
        `[WARNING] Line ${line}: ${w.pattern.name} - ${w.pattern.description}. Fix: ${w.pattern.fix}`
      );
    });
  });
  
  // Missing patterns are warnings, not errors
  result.missingPatterns.forEach((msg) => {
    warnings.push(`[INFO] ${msg}`);
  });
  
  return {
    valid: result.passed,
    errors,
    warnings,
  };
}

/**
 * Test data generator for regression testing
 * Creates intentionally long content to verify no truncation
 */
export function generateLongTestContent(): {
  longParagraph: string;
  longBulletPoints: string[];
  longRecommendations: string[];
  extremelyLongTitle: string;
} {
  return {
    longParagraph: `This is an intentionally long paragraph designed to test the zero-truncation guarantee of the PDF rendering system. It contains multiple sentences with varying lengths and punctuation marks, including commas, semicolons, and em-dashes. The purpose is to verify that text wrapping works correctly across page boundaries without any content being cut off, clipped, or hidden. This paragraph should render completely regardless of where it falls on the page, automatically flowing to the next page if necessary. Furthermore, it includes technical terminology like "search engine optimization" and "conversion rate optimization" to ensure realistic content length. This final sentence confirms the entire paragraph was rendered.`,
    
    longBulletPoints: [
      "First bullet point with detailed explanation that spans multiple lines when rendered in the PDF to verify proper text wrapping behavior and automatic height calculation for bullet containers.",
      "Second bullet discussing website performance metrics including page load time, time to first byte, largest contentful paint, cumulative layout shift, and first input delay measurements.",
      "Third bullet covering SEO best practices such as meta descriptions, title tags, header hierarchy, internal linking structure, schema markup, and local business citations for improved search visibility.",
      "Fourth bullet explaining conversion optimization techniques including A/B testing, heat mapping, user session recordings, funnel analysis, and form field optimization strategies.",
      "Fifth and final bullet summarizing the comprehensive audit methodology, scoring criteria consistency, and objective evaluation framework used throughout this analysis.",
    ],
    
    longRecommendations: [
      "Recommended Headline: Transform Your Home with Professional HVAC Services | Licensed & Insured Technicians | 24/7 Emergency Repairs | Free Estimates | Serving Greater Metro Area Since 1985",
      "Recommended Subheadline: Experience the difference of working with certified professionals who prioritize your comfort and safety with industry-leading warranties and transparent pricing",
      "Implement a comprehensive lead capture strategy with above-the-fold contact forms, click-to-call buttons, and instant quote calculators to maximize conversion opportunities",
      "Establish trust signals including Google reviews integration, BBB accreditation badges, manufacturer certifications, and before/after project galleries",
      "Target Keywords: emergency hvac repair, air conditioning installation, heating system maintenance, ductwork cleaning, indoor air quality, energy efficient upgrades, smart thermostat installation",
    ],
    
    extremelyLongTitle: "Comprehensive Website Performance Audit and Strategic Improvement Recommendations for Enhanced Digital Presence",
  };
}

/**
 * Verify test content appears in rendered PDF
 * Returns list of missing content substrings
 */
export function verifyContentPresence(
  pdfText: string,
  expectedContent: { paragraphs?: string[]; bullets?: string[]; titles?: string[] }
): string[] {
  const missing: string[] = [];
  
  // For paragraphs, check that key phrases appear
  expectedContent.paragraphs?.forEach((para, i) => {
    // Check first and last 50 chars to verify no truncation
    const start = para.substring(0, 50);
    const end = para.substring(para.length - 50);
    
    if (!pdfText.includes(start)) {
      missing.push(`Paragraph ${i + 1} start missing: "${start}..."`);
    }
    if (!pdfText.includes(end)) {
      missing.push(`Paragraph ${i + 1} end missing: "...${end}"`);
    }
  });
  
  // For bullets, check that each appears in full
  expectedContent.bullets?.forEach((bullet, i) => {
    // Check ending of bullet to ensure no truncation
    const ending = bullet.substring(bullet.length - 30);
    if (!pdfText.includes(ending)) {
      missing.push(`Bullet ${i + 1} ending missing: "...${ending}"`);
    }
  });
  
  // For titles, check presence
  expectedContent.titles?.forEach((title, i) => {
    if (!pdfText.includes(title)) {
      missing.push(`Title ${i + 1} missing: "${title}"`);
    }
  });
  
  return missing;
}

/**
 * Check if PDF code uses shared primitives correctly
 */
export function checkSharedPrimitiveUsage(code: string): {
  usesSharedPrimitives: boolean;
  directTextCalls: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  
  // Count direct doc.text() calls that should use renderSafeText
  const directTextRegex = /doc\.text\s*\([^)]+\)/g;
  const directTextMatches = code.match(directTextRegex) || [];
  
  // Check for imports of shared primitives
  const usesSharedPrimitives = /import\s*\{[^}]*render(?:SafeText|BulletList|BulletItem|CalloutBox)[^}]*\}\s*from/.test(code);
  
  if (!usesSharedPrimitives) {
    recommendations.push("Import and use shared PDF primitives from './pdf' for zero-truncation guarantee");
  }
  
  if (directTextMatches.length > 20) {
    recommendations.push(`Found ${directTextMatches.length} direct doc.text() calls. Consider using renderSafeText for long content.`);
  }
  
  return {
    usesSharedPrimitives,
    directTextCalls: directTextMatches.length,
    recommendations,
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
