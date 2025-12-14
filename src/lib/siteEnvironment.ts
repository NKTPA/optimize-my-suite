/**
 * Site Environment Detection
 * 
 * Classifies analyzed URLs into environment types and providers
 * to enable fair scoring for preview/deployment sites.
 */

export type EnvironmentType = 
  | 'production_custom_domain'
  | 'production_subdomain'
  | 'deployment_preview'
  | 'localhost_private';

export type DeploymentProvider = 
  | 'lovable'
  | 'vercel'
  | 'netlify'
  | 'cloudflare_pages'
  | 'github_pages'
  | 'render'
  | 'railway'
  | 'unknown'
  | 'none';

export interface EnvironmentInfo {
  type: EnvironmentType;
  isPreview: boolean;
  provider: DeploymentProvider;
  hostname: string;
  /** Items that should not be penalized for preview environments */
  previewExemptions: string[];
}

// Preview/deployment domain patterns
const PREVIEW_PATTERNS: { pattern: RegExp; provider: DeploymentProvider }[] = [
  { pattern: /\.lovable\.app$/i, provider: 'lovable' },
  { pattern: /\.lovable\.dev$/i, provider: 'lovable' },
  { pattern: /\.vercel\.app$/i, provider: 'vercel' },
  { pattern: /\.netlify\.app$/i, provider: 'netlify' },
  { pattern: /\.pages\.dev$/i, provider: 'cloudflare_pages' },
  { pattern: /\.github\.io$/i, provider: 'github_pages' },
  { pattern: /\.onrender\.com$/i, provider: 'render' },
  { pattern: /\.up\.railway\.app$/i, provider: 'railway' },
  { pattern: /preview\./i, provider: 'unknown' },
  { pattern: /staging\./i, provider: 'unknown' },
  { pattern: /dev\./i, provider: 'unknown' },
  { pattern: /test\./i, provider: 'unknown' },
];

// Localhost/private patterns (blocked by SSRF but included for completeness)
const LOCALHOST_PATTERNS = [
  /^localhost$/i,
  /^127\.0\.0\.1$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /\.local$/i,
  /\.internal$/i,
  /\.localhost$/i,
];

/**
 * Detects the environment type of a URL
 */
export function detectEnvironment(url: string): EnvironmentInfo {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check for localhost/private
    for (const pattern of LOCALHOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return {
          type: 'localhost_private',
          isPreview: true,
          provider: 'none',
          hostname,
          previewExemptions: [],
        };
      }
    }

    // Check for deployment preview domains
    for (const { pattern, provider } of PREVIEW_PATTERNS) {
      if (pattern.test(hostname)) {
        return {
          type: 'deployment_preview',
          isPreview: true,
          provider,
          hostname,
          previewExemptions: [
            'custom_domain',
            'canonical_mismatch',
            'noindex_meta',
            'robots_txt_blocking',
            'sitemap_missing',
            'google_analytics_missing',
            'structured_data_missing',
          ],
        };
      }
    }

    // Check if it's a subdomain of a common domain
    const parts = hostname.split('.');
    if (parts.length > 2) {
      // Could be a subdomain like app.example.com
      return {
        type: 'production_subdomain',
        isPreview: false,
        provider: 'none',
        hostname,
        previewExemptions: [],
      };
    }

    // Default: production custom domain
    return {
      type: 'production_custom_domain',
      isPreview: false,
      provider: 'none',
      hostname,
      previewExemptions: [],
    };
  } catch {
    // Invalid URL, treat as unknown production
    return {
      type: 'production_custom_domain',
      isPreview: false,
      provider: 'none',
      hostname: '',
      previewExemptions: [],
    };
  }
}

/**
 * Check if a URL is a preview/deployment environment
 */
export function isPreviewEnvironment(url: string): boolean {
  return detectEnvironment(url).isPreview;
}

/**
 * Get the deployment provider from a URL
 */
export function getDeploymentProvider(url: string): DeploymentProvider {
  return detectEnvironment(url).provider;
}

/**
 * Calculate score weight multipliers based on environment
 */
export function getScoreWeights(environment: EnvironmentInfo): {
  qualityWeight: number;
  readinessWeight: number;
} {
  if (environment.type === 'deployment_preview') {
    return { qualityWeight: 0.85, readinessWeight: 0.15 };
  }
  return { qualityWeight: 0.70, readinessWeight: 0.30 };
}
