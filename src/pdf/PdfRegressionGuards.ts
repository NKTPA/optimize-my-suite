/**
 * PDF Regression Guards
 * 
 * Static analysis utilities to detect truncation-prone patterns in PDF code.
 * These can be run as part of the build or test process to prevent regressions.
 * 
 * CRITICAL: PDF components must NEVER use fixed height for dynamic text.
 */

// Forbidden patterns that can cause text truncation
export const FORBIDDEN_PATTERNS = {
  // Fixed heights on text containers (except for explicit icon containers)
  fixedHeight: /(?<!icon|badge|circle).*height:\s*\d+(?!%)/gi,
  
  // Overflow hidden (clips content)
  overflowHidden: /overflow:\s*['"]?hidden['"]?/gi,
  
  // Text overflow ellipsis (truncates text)
  textOverflowEllipsis: /textOverflow:\s*['"]?ellipsis['"]?/gi,
  
  // Line clamp (limits visible lines)
  lineClamp: /lineClamp|line-clamp/gi,
  
  // White space nowrap (prevents wrapping)
  whiteSpaceNowrap: /whiteSpace:\s*['"]?nowrap['"]?/gi,
  
  // Tailwind truncate class
  truncateClass: /className.*truncate/gi,
  
  // Slicing text lines (should only slice items, never lines)
  slicingLines: /\.slice\s*\(\s*\d+\s*,\s*\d+\s*\).*forEach.*line/gi,
} as const;

// Allowed patterns (exceptions to the rules)
export const ALLOWED_PATTERNS = {
  // Icon containers can have fixed heights
  iconHeight: /icon.*height|height.*icon|circle.*height|badge.*height/gi,
  
  // Score bar can have fixed heights
  scoreBarHeight: /scoreBar|drawScoreBar|ScoreBar/gi,
  
  // minHeight is always allowed
  minHeight: /minHeight/gi,
} as const;

/**
 * Check if a code string contains forbidden PDF patterns
 * Returns array of issues found
 */
export function checkForForbiddenPatterns(code: string, filename?: string): string[] {
  const issues: string[] = [];
  
  // Check each forbidden pattern
  for (const [patternName, pattern] of Object.entries(FORBIDDEN_PATTERNS)) {
    const matches = code.match(pattern);
    if (matches) {
      // Check if this is an allowed exception
      let isAllowed = false;
      for (const [, allowedPattern] of Object.entries(ALLOWED_PATTERNS)) {
        const context = code.slice(
          Math.max(0, code.indexOf(matches[0]) - 50),
          code.indexOf(matches[0]) + matches[0].length + 50
        );
        if (allowedPattern.test(context)) {
          isAllowed = true;
          break;
        }
      }
      
      if (!isAllowed) {
        issues.push(
          `[${filename || 'file'}] Found forbidden pattern "${patternName}": ${matches[0]}`
        );
      }
    }
  }
  
  return issues;
}

/**
 * Validate PDF code for truncation safety
 * Throws error if forbidden patterns are found
 */
export function validatePdfCode(code: string, filename?: string): void {
  const issues = checkForForbiddenPatterns(code, filename);
  if (issues.length > 0) {
    throw new Error(
      `PDF truncation-prone patterns detected:\n${issues.join('\n')}\n\n` +
      `CRITICAL: PDF components must NEVER use fixed height for dynamic text.`
    );
  }
}

/**
 * PDF rendering best practices documentation
 */
export const PDF_BEST_PRACTICES = `
PDF Text Rendering Best Practices
=================================

1. NEVER use fixed heights for text containers
   - Use minHeight if minimum size is needed
   - Calculate dynamic heights based on content

2. NEVER use overflow: hidden on text areas
   - Allow content to expand naturally
   - Use page break logic instead

3. NEVER use text-overflow: ellipsis
   - Render all text, always
   - Break long content across pages if needed

4. NEVER use line-clamp or limit visible lines
   - Render every line of content
   - Use doc.splitTextToSize() and render ALL lines

5. NEVER use white-space: nowrap on dynamic text
   - Always allow text to wrap
   - Calculate available width and split text accordingly

6. For bullet lists, limit ITEMS (not lines within items)
   - .slice() on the items array is OK
   - .slice() on the lines array is FORBIDDEN

7. Keep text blocks together when possible
   - Calculate block height BEFORE rendering
   - Add page break if block doesn't fit
   - If block fits on fresh page, move to new page

8. Icons and text in separate columns
   - Icon in fixed-width column
   - Text in flexible column that wraps

Example of correct pattern:
\`\`\`
const lines = doc.splitTextToSize(text, maxWidth);
const blockHeight = lines.length * lineHeight + padding;

// Try to keep block together
if (y + blockHeight > maxY && blockHeight < maxY - margin) {
  addNewPage();
}

// Render ALL lines - NO truncation
lines.forEach((line, i) => {
  if (y + lineHeight > maxY) {
    addNewPage();
  }
  doc.text(line, x, y);
  y += lineHeight;
});
\`\`\`
`;
