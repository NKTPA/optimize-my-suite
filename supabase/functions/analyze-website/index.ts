import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getOrCreateWorkspaceForUser, isWorkspaceError, getOrCreateWorkspaceUsage } from "../_shared/workspace.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Owner email from secrets (server-side only)
const getOwnerEmail = () => Deno.env.get("OWNER_EMAIL")?.toLowerCase();

// Plan limits for analyses per month
const PLAN_LIMITS: Record<string, number> = {
  starter: 25,
  pro: 150,
  scale: 500,
};

// Redact sensitive fields from log details
function redactSensitive(details?: unknown): unknown {
  if (!details || typeof details !== 'object') return details;
  
  const sensitiveFields = ['email', 'userId', 'user_id', 'customerId', 'customer_id', 'stripe_customer_id', 
    'stripe_subscription_id', 'subscriptionId', 'subscription_id', 'workspaceId', 'workspace_id', 'token'];
  
  const redacted = { ...(details as Record<string, unknown>) };
  for (const field of sensitiveFields) {
    if (field in redacted && redacted[field]) {
      const value = String(redacted[field]);
      // Redact but keep first 4 chars for debugging
      redacted[field] = value.length > 4 ? value.slice(0, 4) + '***' : '***';
    }
  }
  return redacted;
}

function logStep(step: string, details?: unknown) {
  const safeDetails = redactSensitive(details);
  const detailsStr = safeDetails ? `: ${JSON.stringify(safeDetails)}` : "";
  console.log(`[analyze-website] ${step}${detailsStr}`);
}

// ============================================
// ENVIRONMENT DETECTION
// ============================================
type EnvironmentType = 
  | 'production_custom_domain'
  | 'production_subdomain'
  | 'deployment_preview'
  | 'localhost_private';

type DeploymentProvider = 
  | 'lovable'
  | 'vercel'
  | 'netlify'
  | 'cloudflare_pages'
  | 'github_pages'
  | 'render'
  | 'railway'
  | 'unknown'
  | 'none';

interface EnvironmentInfo {
  type: EnvironmentType;
  isPreview: boolean;
  provider: DeploymentProvider;
  hostname: string;
  previewExemptions: string[];
}

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

function detectEnvironment(url: string): EnvironmentInfo {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

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

    // Check if it's a subdomain
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return {
        type: 'production_subdomain',
        isPreview: false,
        provider: 'none',
        hostname,
        previewExemptions: [],
      };
    }

    return {
      type: 'production_custom_domain',
      isPreview: false,
      provider: 'none',
      hostname,
      previewExemptions: [],
    };
  } catch {
    return {
      type: 'production_custom_domain',
      isPreview: false,
      provider: 'none',
      hostname: '',
      previewExemptions: [],
    };
  }
}

// ============================================
// DUAL SCORING ENGINE
// ============================================
interface DualScore {
  websiteQualityScore: number;
  productionReadinessScore: number;
  overallScore: number;
  environment: EnvironmentInfo;
  unverifiedItems: string[];
}

function calculateDualScores(
  analysisResult: Record<string, unknown>,
  url: string
): DualScore {
  const environment = detectEnvironment(url);
  
  // Weight multipliers based on environment
  const qualityWeight = environment.isPreview ? 0.85 : 0.70;
  const readinessWeight = environment.isPreview ? 0.15 : 0.30;

  // Extract scores with defaults
  const getScore = (path: string): number => {
    const parts = path.split('.');
    let value: unknown = analysisResult;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return 50;
      }
    }
    return typeof value === 'number' ? value : 50;
  };

  // Quality scores
  const conversionScore = getScore('conversion.score');
  const messagingScore = getScore('messaging.score');
  const designScore = getScore('designUx.score');
  const trustScore = getScore('trust.score');
  const mobileScore = getScore('mobile.score');

  // Readiness scores
  const seoScore = getScore('seo.score');
  const performanceScore = getScore('performance.score');

  // Calculate quality score (60% conversion, 25% messaging, 15% trust/UX)
  const trustUxCombined = (designScore + trustScore + mobileScore) / 3;
  const websiteQualityScore = Math.round(
    conversionScore * 0.60 +
    messagingScore * 0.25 +
    trustUxCombined * 0.15
  );

  // Calculate readiness score — use real detection when available
  let indexingScore = seoScore;

  // Analytics score: derive from real detection signals in analysisResult
  const analyticsData = (analysisResult as Record<string, unknown>).analyticsDetected as Record<string, unknown> | undefined;
  let analyticsScore: number;
  if (analyticsData) {
    const signals = [analyticsData.hasGoogleAnalytics, analyticsData.hasFacebookPixel, analyticsData.hasHotjarOrHeatmap]
      .filter(Boolean).length;
    analyticsScore = signals >= 2 ? 90 : signals === 1 ? 70 : 30;
  } else {
    analyticsScore = 70; // fallback when not yet in result
  }

  // Structured data score: derive from real detection
  const sdData = (analysisResult as Record<string, unknown>).structuredDataDetected as Record<string, unknown> | undefined;
  let structuredDataScore: number;
  if (sdData) {
    const sdSignals = [sdData.hasJsonLd, sdData.hasOpenGraph, sdData.hasTwitterCard].filter(Boolean).length;
    structuredDataScore = sdSignals >= 2 ? 85 : sdSignals === 1 ? 60 : 25;
  } else {
    structuredDataScore = 60; // fallback
  }

  if (environment.isPreview) {
    // Don't penalize preview sites for production-readiness items
    indexingScore = Math.max(indexingScore, 70);
    analyticsScore = Math.max(analyticsScore, 80);
    structuredDataScore = Math.max(structuredDataScore, 70);
  }

  const productionReadinessScore = Math.round(
    indexingScore * 0.35 +
    performanceScore * 0.25 +
    analyticsScore * 0.20 +
    structuredDataScore * 0.20
  );

  // Calculate overall score based on environment weights
  const overallScore = Math.round(
    websiteQualityScore * qualityWeight +
    productionReadinessScore * readinessWeight
  );

  // Build unverified items list
  const unverifiedItems: string[] = [];
  if (environment.isPreview) {
    unverifiedItems.push('Custom domain configuration');
    unverifiedItems.push('Production analytics setup');
    unverifiedItems.push('Search engine indexing');
  }

  return {
    websiteQualityScore,
    productionReadinessScore,
    overallScore,
    environment,
    unverifiedItems,
  };
}

// Validate URL to prevent SSRF attacks
function isValidPublicUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    // Only allow http/https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: "Only HTTP and HTTPS URLs are allowed" };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    // Block localhost and all loopback variants
    if (
      hostname === 'localhost' || 
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('127.') || // Block entire 127.0.0.0/8 range
      hostname === '0:0:0:0:0:0:0:1' // IPv6 loopback expanded form
    ) {
      return { valid: false, error: "Cannot analyze localhost URLs" };
    }
    
    // Block private IP ranges (IPv4)
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c, d] = ipv4Match.map(Number);
      // Validate IP octets are in valid range
      if (a > 255 || b > 255 || c > 255 || d > 255) {
        return { valid: false, error: "Invalid IP address format" };
      }
      // Block 0.0.0.0/8 (current network)
      if (a === 0) return { valid: false, error: "Cannot analyze reserved network URLs" };
      // Block 10.0.0.0/8 (private)
      if (a === 10) return { valid: false, error: "Cannot analyze private network URLs" };
      // Block 172.16.0.0/12 (private)
      if (a === 172 && b >= 16 && b <= 31) return { valid: false, error: "Cannot analyze private network URLs" };
      // Block 192.168.0.0/16 (private)
      if (a === 192 && b === 168) return { valid: false, error: "Cannot analyze private network URLs" };
      // Block 169.254.0.0/16 (link-local) - includes cloud metadata at 169.254.169.254
      if (a === 169 && b === 254) return { valid: false, error: "Cannot analyze link-local or cloud metadata URLs" };
      // Block 127.0.0.0/8 (loopback - additional check)
      if (a === 127) return { valid: false, error: "Cannot analyze localhost URLs" };
      // Block 100.64.0.0/10 (Carrier-g
