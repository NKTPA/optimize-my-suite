/**
 * URL Validation utilities to prevent contaminated URLs in Implementation Packs
 * 
 * These guardrails ensure that only the original analyzed customer URL is used,
 * never Lovable preview URLs, localhost, or other deployment domains.
 */

// Blocked URL patterns that should NEVER be used as "Original Website"
const BLOCKED_URL_PATTERNS = [
  'lovable.app',
  'lovable.dev',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'preview.',
  '.local',
  'staging.',
  'dev.',
  'test.',
  '.vercel.app',
  '.netlify.app',
  '.pages.dev',
];

/**
 * Validates that a URL is a legitimate customer domain, not a deployment/preview URL
 * @param url The URL to validate
 * @returns true if the URL is valid for use as "Original Website"
 */
export function isValidAnalysisSourceUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const normalizedUrl = url.toLowerCase().trim();

  // Check against all blocked patterns
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (normalizedUrl.includes(pattern)) {
      console.error(`[URL Validation] Blocked contaminated URL: ${url} (matches pattern: ${pattern})`);
      return false;
    }
  }

  // Must be http or https
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    console.error(`[URL Validation] Invalid protocol for URL: ${url}`);
    return false;
  }

  return true;
}

/**
 * Sanitizes a URL for display, ensuring it's the original analyzed domain
 * @param url The URL to sanitize
 * @param fallback Fallback text if URL is invalid
 * @returns The sanitized URL or fallback
 */
export function sanitizeAnalysisUrl(url: string, fallback: string = 'Original website not available'): string {
  if (isValidAnalysisSourceUrl(url)) {
    return url;
  }
  return fallback;
}

/**
 * Extracts the domain from a URL for validation purposes
 * @param url The URL to extract domain from
 * @returns The domain or null if invalid
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Checks if a URL appears to be a generated/deployment URL that should be blocked
 * @param url The URL to check
 * @returns true if the URL appears to be a deployment/preview URL
 */
export function isDeploymentUrl(url: string): boolean {
  if (!url) return false;
  
  const normalizedUrl = url.toLowerCase();
  
  for (const pattern of BLOCKED_URL_PATTERNS) {
    if (normalizedUrl.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}
