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

  // Calculate readiness score
  let indexingScore = seoScore;
  let analyticsScore = 70;
  let structuredDataScore = 60;

  if (environment.isPreview) {
    // Don't penalize preview sites for production-readiness items
    indexingScore = Math.max(indexingScore, 70);
    analyticsScore = 80;
    structuredDataScore = 70;
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
      // Block 100.64.0.0/10 (Carrier-grade NAT)
      if (a === 100 && b >= 64 && b <= 127) return { valid: false, error: "Cannot analyze private network URLs" };
    }
    
    // Block IPv6 private/reserved addresses
    if (hostname.includes(':')) {
      const lowerHostname = hostname.toLowerCase();
      // Block fc00::/7 (Unique local addresses - private)
      if (lowerHostname.startsWith('fc') || lowerHostname.startsWith('fd')) {
        return { valid: false, error: "Cannot analyze private IPv6 URLs" };
      }
      // Block fe80::/10 (Link-local)
      if (lowerHostname.startsWith('fe8') || lowerHostname.startsWith('fe9') || 
          lowerHostname.startsWith('fea') || lowerHostname.startsWith('feb')) {
        return { valid: false, error: "Cannot analyze link-local IPv6 URLs" };
      }
      // Block ::1 variants (loopback)
      if (lowerHostname === '::1' || lowerHostname === '0:0:0:0:0:0:0:1') {
        return { valid: false, error: "Cannot analyze localhost URLs" };
      }
    }
    
    // Block internal hostnames
    if (
      hostname.endsWith('.local') || 
      hostname.endsWith('.internal') || 
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.localdomain') ||
      hostname.endsWith('.corp') ||
      hostname.endsWith('.home') ||
      hostname.endsWith('.lan')
    ) {
      return { valid: false, error: "Cannot analyze internal network URLs" };
    }
    
    // Block cloud metadata endpoints (explicit hostnames)
    const metadataHosts = [
      'metadata.google.internal',
      'metadata.gke.internal',
      'instance-data',
      'fd00:ec2::254', // AWS IPv6 metadata
    ];
    if (metadataHosts.some(host => hostname === host || hostname.endsWith('.' + host))) {
      return { valid: false, error: "Cannot analyze cloud metadata URLs" };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

// NOT SCORABLE detection thresholds
const MIN_HTML_SIZE_BYTES = 1000; // Less than 1KB is likely a shell
const MIN_BODY_TEXT_LENGTH = 100; // Less than 100 chars of actual text

// Lovable placeholder detection keywords
const LOVABLE_PLACEHOLDER_KEYWORDS = [
  'authenticating',
  'get started',
  'build software products',
  'lovable',
];

interface NotScorableResult {
  isNotScorable: true;
  reason: 'auth_gate' | 'insufficient_html' | 'blocked_fetch' | 'redirect_loop' | 'placeholder_page' | 'js_only_shell' | 'login_required' | 'age_verification';
  reasonDisplay: string;
  finalUrl?: string;
  httpStatus?: number;
  htmlSizeKb?: number;
  fixInstructions: string[];
}

// Age verification detection keywords
const AGE_VERIFICATION_KEYWORDS = [
  'age verification',
  'age-verification',
  'verify your age',
  'confirm your age',
  'are you 21',
  'are you over 21',
  'are you 18',
  'are you over 18',
  'must be 21',
  'must be 18',
  'of legal drinking age',
  'legal drinking age',
  'enter your date of birth',
  'enter your birthday',
  'age gate',
  'age-gate',
  'agegate',
  'alcohol',
  'spirits',
  'wine',
  'beer',
  'liquor',
  'cannabis',
  'marijuana',
  'tobacco',
  'vape',
  'gambling',
  'casino',
  'adult content',
  '21+',
  '18+',
];

/**
 * Detects if the page has an age verification gate
 */
function detectAgeVerificationPage(html: string): boolean {
  const lowerHtml = html.toLowerCase();
  
  // Check for age verification keywords
  let keywordMatches = 0;
  for (const kw of AGE_VERIFICATION_KEYWORDS) {
    if (lowerHtml.includes(kw)) {
      keywordMatches++;
    }
  }
  
  // Need at least 2 keyword matches to be confident
  if (keywordMatches < 2) {
    return false;
  }
  
  // Check for typical age gate UI elements
  const hasDateInputs = 
    lowerHtml.includes('type="date"') ||
    lowerHtml.includes('type=\'date\'') ||
    lowerHtml.includes('date of birth') ||
    lowerHtml.includes('birthdate') ||
    lowerHtml.includes('birth date');
  
  const hasAgeButtons = 
    (lowerHtml.includes('yes') && lowerHtml.includes('no')) ||
    lowerHtml.includes('i am 21') ||
    lowerHtml.includes('i am 18') ||
    lowerHtml.includes('i am of legal') ||
    lowerHtml.includes('enter site') ||
    lowerHtml.includes('enter the site');
  
  // Check for minimal main content (most of page is the age gate)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  const textOnly = bodyContent
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Age gate pages typically have limited text content
  const hasLimitedContent = textOnly.length < 2000;
  
  return (hasDateInputs || hasAgeButtons) && hasLimitedContent;
}

/**
 * Detects if the fetched HTML is a Lovable auth placeholder page
 */
function detectLovablePlaceholderPage(html: string, url: string): boolean {
  const lowerHtml = html.toLowerCase();
  const lowerUrl = url.toLowerCase();
  
  // Must be a Lovable domain
  if (!lowerUrl.includes('lovable.app') && !lowerUrl.includes('lovable.dev')) {
    return false;
  }
  
  // Check for placeholder keywords
  const hasKeywords = LOVABLE_PLACEHOLDER_KEYWORDS.some(kw => lowerHtml.includes(kw));
  
  // Check for minimal body content (JS shell)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : '';
  const textOnly = bodyContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  
  return hasKeywords && textOnly.length < 500;
}

/**
 * Checks if the HTML content is sufficient for analysis
 * Returns NotScorableResult if not scorable, null if OK to proceed
 */
function checkContentSufficiency(html: string, url: string, httpStatus?: number): NotScorableResult | null {
  const htmlSizeBytes = new TextEncoder().encode(html).length;
  const htmlSizeKb = htmlSizeBytes / 1024;
  
  // Check for Lovable placeholder page first
  if (detectLovablePlaceholderPage(html, url)) {
    return {
      isNotScorable: true,
      reason: 'placeholder_page',
      reasonDisplay: 'This URL shows a Lovable authentication or placeholder page, not the actual website content. The site may require login or may not be published yet.',
      finalUrl: url,
      httpStatus,
      htmlSizeKb,
      fixInstructions: [
        'Publish the site to make it publicly accessible',
        'Use the public deployment URL (not preview-- URL)',
        'Connect a custom domain for production analysis',
        'If using authentication, ensure the homepage is publicly accessible',
      ],
    };
  }
  
  // Check for age verification gate
  if (detectAgeVerificationPage(html)) {
    return {
      isNotScorable: true,
      reason: 'age_verification',
      reasonDisplay: 'This website has an age verification gate that prevents our analyzer from accessing the main content. Age-gated sites (alcohol, cannabis, gambling, adult content) cannot be scored without manual verification.',
      finalUrl: url,
      httpStatus,
      htmlSizeKb,
      fixInstructions: [
        'Age-gated websites cannot be automatically analyzed',
        'The site requires users to confirm their age before viewing content',
        'Consider analyzing a specific product or about page URL that may bypass the gate',
        'Contact support if you need to analyze age-restricted content',
      ],
    };
  }
  
  // Check for insufficient HTML size
  if (htmlSizeBytes < MIN_HTML_SIZE_BYTES) {
    return {
      isNotScorable: true,
      reason: 'insufficient_html',
      reasonDisplay: 'The page returned too little HTML content to analyze. This may indicate a JavaScript-only shell, a redirect, or a blocked page.',
      finalUrl: url,
      httpStatus,
      htmlSizeKb,
      fixInstructions: [
        'Ensure the page has server-side rendered content',
        'Check if the page requires JavaScript to load content',
        'Verify the URL is correct and publicly accessible',
        'Try accessing the URL in an incognito browser window',
      ],
    };
  }
  
  // Extract and check body text content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const bodyText = bodyHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (bodyText.length < MIN_BODY_TEXT_LENGTH) {
    // Check if it looks like a login/auth page
    const lowerHtml = html.toLowerCase();
    const hasLoginIndicators = 
      lowerHtml.includes('login') || 
      lowerHtml.includes('sign in') || 
      lowerHtml.includes('authenticate') ||
      lowerHtml.includes('password');
    
    if (hasLoginIndicators) {
      return {
        isNotScorable: true,
        reason: 'login_required',
        reasonDisplay: 'This page appears to require login/authentication. We cannot analyze protected pages.',
        finalUrl: url,
        httpStatus,
        htmlSizeKb,
        fixInstructions: [
          'Use the public-facing URL that visitors see without logging in',
          'Ensure the homepage does not require authentication',
          'If this is a preview environment, publish the site first',
          'Consider setting up a public landing page',
        ],
      };
    }
    
    return {
      isNotScorable: true,
      reason: 'js_only_shell',
      reasonDisplay: 'The page contains very little readable text content. It may be a JavaScript-only application that requires client-side rendering.',
      finalUrl: url,
      httpStatus,
      htmlSizeKb,
      fixInstructions: [
        'Implement server-side rendering (SSR) for better SEO',
        'Add static HTML content that loads before JavaScript',
        'Ensure the page has meaningful content without JavaScript',
        'Consider using a pre-rendering service',
      ],
    };
  }
  
  return null; // Content is sufficient
}

// Extract data from HTML
// rawHtml parameter: when provided (e.g. from Firecrawl rawHtml), use it for <head> metadata
// extraction since the processed 'html' format may strip <head> tags.
function extractDataFromHtml(html: string, url: string, rawHtml?: string) {
  // Use rawHtml for head metadata extraction if available, otherwise fall back to html
  const headSource = rawHtml || html;

  const getMetaContent = (name: string) => {
    // Search both headSource and html to maximize detection
    for (const source of [headSource, html]) {
      const match = source.match(new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
                    source.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, 'i'));
      if (match) return match[1];
    }
    return '';
  };

  const getTagContent = (tag: string) => {
    // Search both headSource and html
    for (const source of [headSource, html]) {
      const match = source.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
      if (match && match[1].trim()) return match[1].trim();
    }
    return '';
  };

  const getAllTags = (tag: string) => {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (match[1].trim()) matches.push(match[1].trim());
    }
    return matches;
  };

  const title = getTagContent('title');
  const metaDescription = getMetaContent('description');
  const h1s = getAllTags('h1');
  const h2s = getAllTags('h2');

  const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  const phoneNumbers = [...new Set(html.match(phoneRegex) || [])];

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = [...new Set(html.match(emailRegex) || [])].filter(e => !e.includes('example.com'));

  const ctaPatterns = /(?:call|book|schedule|contact|quote|estimate|get started|free|request)[^<]*(?:<\/(?:a|button)>)/gi;
  const ctaMatches = html.match(ctaPatterns) || [];
  const ctaButtons = ctaMatches.map(m => m.replace(/<[^>]*>/g, '').trim()).filter(Boolean).slice(0, 10);

  const hasForm = /<form[^>]*>/i.test(html);
  const formFields = (html.match(/<input[^>]*name=["']([^"']+)["']/gi) || [])
    .map(m => {
      const match = m.match(/name=["']([^"']+)["']/i);
      return match ? match[1] : '';
    })
    .filter(Boolean);

  const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)?["'])?/gi;
  const images: { src: string; alt: string }[] = [];
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null && images.length < 20) {
    images.push({
      src: imgMatch[1],
      alt: imgMatch[2] || '',
    });
  }

  const imagesWithoutAlt = images.filter(img => !img.alt).length;
  const scriptMatches = html.match(/<script[^>]*src=["'][^"']+["']/gi) || [];
  const externalScripts = scriptMatches.length;
  const hasSSL = url.startsWith('https://');
  
  // Check viewport and favicon in both headSource and html
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(headSource) || /<meta[^>]*name=["']viewport["']/i.test(html);
  const hasFavicon = /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i.test(headSource) || 
                     /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i.test(html);

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const bodyText = bodyHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);

  const addressPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)[^<]{0,100}/gi;
  const addresses = html.match(addressPattern) || [];

  return {
    title,
    metaDescription,
    headings: { h1s, h2s },
    phoneNumbers,
    emails,
    ctaButtons,
    forms: { hasForm, fields: formFields },
    images: {
      count: images.length,
      withoutAlt: imagesWithoutAlt,
      samples: images.slice(0, 5),
    },
    externalScripts,
    technical: {
      hasSSL,
      hasViewport,
      hasFavicon,
    },
    bodyTextPreview: bodyText.slice(0, 1500),
    addresses,
  };
}

// ============================================
// WEBSITE TYPE DETECTION
// ============================================
type WebsiteType = 
  | 'local_service'
  | 'saas_software'
  | 'ecommerce'
  | 'professional_services'
  | 'content_media'
  | 'restaurant_hospitality'
  | 'nonprofit'
  | 'portfolio_personal'
  | 'unknown';

interface WebsiteTypeInfo {
  type: WebsiteType;
  displayName: string;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
}

const WEBSITE_TYPE_DISPLAY: Record<WebsiteType, string> = {
  local_service: 'Local Service Business',
  saas_software: 'SaaS / Software Product',
  ecommerce: 'E-commerce / Online Store',
  professional_services: 'Professional Services',
  content_media: 'Content / Media / Blog',
  restaurant_hospitality: 'Restaurant / Hospitality',
  nonprofit: 'Nonprofit / Organization',
  portfolio_personal: 'Portfolio / Personal',
  unknown: 'General Business Website',
};

/**
 * Detects website type from extracted data and HTML content
 */
function detectWebsiteType(extractedData: ReturnType<typeof extractDataFromHtml>, html: string, url: string): WebsiteTypeInfo {
  const signals: string[] = [];
  const scores: Record<WebsiteType, number> = {
    local_service: 0,
    saas_software: 0,
    ecommerce: 0,
    professional_services: 0,
    content_media: 0,
    restaurant_hospitality: 0,
    nonprofit: 0,
    portfolio_personal: 0,
    unknown: 0,
  };

  const lowerHtml = html.toLowerCase();
  const lowerBody = extractedData.bodyTextPreview.toLowerCase();
  const title = (extractedData.title || '').toLowerCase();
  const description = (extractedData.metaDescription || '').toLowerCase();
  const h1s = extractedData.headings.h1s.map(h => h.toLowerCase());
  const h2s = extractedData.headings.h2s.map(h => h.toLowerCase());
  const allHeadings = [...h1s, ...h2s].join(' ');

  // ===== SAAS / SOFTWARE SIGNALS =====
  const saasKeywords = ['saas', 'software', 'platform', 'api', 'dashboard', 'pricing', 'free trial', 
    'sign up', 'get started', 'demo', 'features', 'integrations', 'automation', 'workflow',
    'analytics', 'login', 'signup', 'product', 'solution', 'app', 'tool', 'cloud'];
  const saasPatterns = [/pricing/i, /free\s*trial/i, /get\s*started/i, /sign\s*up/i, /start\s*free/i,
    /book\s*demo/i, /request\s*demo/i, /schedule\s*demo/i, /integrat/i, /api/i];
  
  let saasScore = 0;
  for (const kw of saasKeywords) {
    if (lowerBody.includes(kw) || title.includes(kw) || allHeadings.includes(kw)) saasScore++;
  }
  for (const pattern of saasPatterns) {
    if (pattern.test(lowerHtml)) saasScore += 2;
  }
  if (lowerHtml.includes('monthly') && lowerHtml.includes('annually')) saasScore += 3;
  if (/\$\d+\s*\/?\s*(mo|month|yr|year)/i.test(lowerHtml)) saasScore += 3;
  if (lowerHtml.includes('/pricing') || lowerHtml.includes('/features')) saasScore += 2;
  if (lowerHtml.includes('start your free') || lowerHtml.includes('no credit card')) saasScore += 3;
  scores.saas_software = saasScore;
  if (saasScore >= 5) signals.push('SaaS pricing/trial patterns detected');

  // ===== LOCAL SERVICE SIGNALS =====
  const localKeywords = ['hvac', 'plumbing', 'plumber', 'roofing', 'roofer', 'electrical', 'electrician',
    'landscaping', 'lawn', 'cleaning', 'pest control', 'locksmith', 'garage door', 'painting', 'contractor',
    'handyman', 'repair', 'installation', 'service area', 'serving', 'emergency', '24/7', 'same day',
    'free estimate', 'free quote', 'call now', 'licensed', 'insured', 'bonded'];
  
  let localScore = 0;
  for (const kw of localKeywords) {
    if (lowerBody.includes(kw) || title.includes(kw)) localScore++;
  }
  if (extractedData.phoneNumbers.length > 0) localScore += 2;
  if (extractedData.addresses.length > 0) localScore += 2;
  if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(lowerHtml)) localScore += 1;
  if (lowerHtml.includes('call us') || lowerHtml.includes('call today')) localScore += 2;
  if (lowerHtml.includes('service area') || lowerHtml.includes('we serve')) localScore += 2;
  if (/serving\s+[a-z]+\s+(county|area|region)/i.test(lowerHtml)) localScore += 3;
  scores.local_service = localScore;
  if (localScore >= 5) signals.push('Local service business patterns detected');

  // ===== E-COMMERCE SIGNALS =====
  const ecomKeywords = ['shop', 'cart', 'checkout', 'add to cart', 'buy now', 'product', 'products',
    'shipping', 'free shipping', 'returns', 'order', 'orders', 'store', 'collection', 'catalog'];
  
  let ecomScore = 0;
  for (const kw of ecomKeywords) {
    if (lowerBody.includes(kw) || lowerHtml.includes(kw)) ecomScore++;
  }
  if (/add.to.cart/i.test(lowerHtml)) ecomScore += 3;
  if (/buy.now/i.test(lowerHtml)) ecomScore += 2;
  if (lowerHtml.includes('shopify') || lowerHtml.includes('woocommerce') || lowerHtml.includes('bigcommerce')) ecomScore += 3;
  if (/\$\d+\.\d{2}/.test(lowerHtml)) ecomScore += 2;
  if (lowerHtml.includes('/cart') || lowerHtml.includes('/checkout')) ecomScore += 3;
  scores.ecommerce = ecomScore;
  if (ecomScore >= 5) signals.push('E-commerce shopping patterns detected');

  // ===== PROFESSIONAL SERVICES SIGNALS =====
  const proKeywords = ['agency', 'consulting', 'consultant', 'law firm', 'attorney', 'lawyer', 'accountant',
    'accounting', 'marketing', 'design agency', 'creative agency', 'our clients', 'case study', 'case studies',
    'portfolio', 'our work', 'services we offer', 'industries we serve'];
  
  let proScore = 0;
  for (const kw of proKeywords) {
    if (lowerBody.includes(kw) || title.includes(kw)) proScore++;
  }
  if (lowerHtml.includes('schedule a consultation') || lowerHtml.includes('book a call')) proScore += 2;
  if (lowerHtml.includes('our team') || lowerHtml.includes('meet the team')) proScore += 1;
  if (lowerHtml.includes('case study') || lowerHtml.includes('case studies')) proScore += 2;
  scores.professional_services = proScore;
  if (proScore >= 4) signals.push('Professional services patterns detected');

  // ===== RESTAURANT / HOSPITALITY SIGNALS =====
  const restaurantKeywords = ['menu', 'reservations', 'book a table', 'order online', 'takeout', 'delivery',
    'restaurant', 'cafe', 'bar', 'cuisine', 'chef', 'dine', 'dining', 'food', 'drinks', 'hotel', 'resort',
    'rooms', 'book now', 'check availability'];
  
  let restaurantScore = 0;
  for (const kw of restaurantKeywords) {
    if (lowerBody.includes(kw) || title.includes(kw)) restaurantScore++;
  }
  if (lowerHtml.includes('opentable') || lowerHtml.includes('resy') || lowerHtml.includes('yelp')) restaurantScore += 2;
  if (lowerHtml.includes('/menu') || lowerHtml.includes('/reservations')) restaurantScore += 3;
  scores.restaurant_hospitality = restaurantScore;
  if (restaurantScore >= 4) signals.push('Restaurant/hospitality patterns detected');

  // ===== CONTENT / MEDIA / BLOG SIGNALS =====
  const contentKeywords = ['blog', 'article', 'articles', 'news', 'latest posts', 'read more', 'subscribe',
    'newsletter', 'author', 'published', 'category', 'tags', 'comments'];
  
  let contentScore = 0;
  for (const kw of contentKeywords) {
    if (lowerBody.includes(kw) || lowerHtml.includes(kw)) contentScore++;
  }
  if (lowerHtml.includes('/blog') || lowerHtml.includes('/news') || lowerHtml.includes('/articles')) contentScore += 3;
  if (lowerHtml.includes('read more') && lowerHtml.includes('published')) contentScore += 2;
  scores.content_media = contentScore;
  if (contentScore >= 4) signals.push('Content/media patterns detected');

  // ===== NONPROFIT SIGNALS =====
  const nonprofitKeywords = ['donate', 'donation', 'nonprofit', 'non-profit', 'charity', 'mission',
    'volunteer', 'cause', 'impact', 'give', 'support our', 'help us'];
  
  let nonprofitScore = 0;
  for (const kw of nonprofitKeywords) {
    if (lowerBody.includes(kw) || title.includes(kw)) nonprofitScore++;
  }
  if (lowerHtml.includes('/donate') || lowerHtml.includes('give now')) nonprofitScore += 3;
  if (lowerHtml.includes('501(c)') || lowerHtml.includes('tax-deductible')) nonprofitScore += 3;
  scores.nonprofit = nonprofitScore;
  if (nonprofitScore >= 3) signals.push('Nonprofit patterns detected');

  // ===== PORTFOLIO / PERSONAL SIGNALS =====
  const portfolioKeywords = ['portfolio', 'my work', 'about me', 'freelance', 'hire me', 'contact me',
    'my projects', 'personal website', 'designer', 'developer', 'photographer'];
  
  let portfolioScore = 0;
  for (const kw of portfolioKeywords) {
    if (lowerBody.includes(kw) || title.includes(kw)) portfolioScore++;
  }
  if (lowerHtml.includes('linkedin') && lowerHtml.includes('github')) portfolioScore += 2;
  if (lowerHtml.includes('hire me') || lowerHtml.includes('work with me')) portfolioScore += 2;
  scores.portfolio_personal = portfolioScore;
  if (portfolioScore >= 3) signals.push('Portfolio/personal patterns detected');

  // Determine winner
  let maxType: WebsiteType = 'unknown';
  let maxScore = 0;
  for (const [type, score] of Object.entries(scores) as [WebsiteType, number][]) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type;
    }
  }

  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (maxScore >= 10) confidence = 'high';
  else if (maxScore >= 5) confidence = 'medium';

  // If no clear winner, default to unknown
  if (maxScore < 3) {
    maxType = 'unknown';
    confidence = 'low';
  }

  return {
    type: maxType,
    displayName: WEBSITE_TYPE_DISPLAY[maxType],
    confidence,
    signals,
  };
}

// ============================================
// TYPE-SPECIFIC ANALYSIS PROMPTS
// ============================================
function getAnalysisPromptForType(siteType: WebsiteTypeInfo): string {
  const baseStructure = `
OUTPUT:
Return ONLY a valid JSON object with the following shape (no extra commentary):

{
  "summary": {
    "overallScore": number,
    "overview": "string",
    "quickWins": ["string", "string", "string"]
  },
  "messaging": {
    "score": number,
    "findings": ["string", "string"],
    "recommendedHeadline": "string",
    "recommendedSubheadline": "string",
    "elevatorPitch": "string"
  },
  "conversion": {
    "score": number,
    "findings": ["string", "string"],
    "recommendations": ["string", "string"],
    "sampleButtons": ["string", "string"]
  },
  "designUx": {
    "score": number,
    "findings": ["string", "string"],
    "recommendations": ["string", "string"]
  },
  "mobile": {
    "score": number,
    "findings": ["string", "string"],
    "recommendations": ["string", "string"]
  },
  "performance": {
    "score": number,
    "findings": ["string", "string"],
    "heavyImages": ["string"],
    "recommendations": ["string", "string"]
  },
  "seo": {
    "score": number,
    "findings": ["string", "string"],
    "recommendedTitle": "string",
    "recommendedMetaDescription": "string",
    "recommendedH1": "string",
    "keywords": ["string", "string", "string", "string", "string"],
    "checklist": ["string", "string"]
  },
  "trust": {
    "score": number,
    "findings": ["string", "string"],
    "whyChooseUs": ["string", "string", "string"],
    "testimonialsBlock": "string"
  },
  "technical": {
    "findings": ["string", "string"],
    "recommendations": ["string", "string"]
  },
  "aiServicePitch": {
    "paragraph": "string",
    "bullets": ["string", "string", "string"]
  }
}

- Use scores on a 0–100 scale.
- If some data is missing, explain that and still give a recommendation.`;

  switch (siteType.type) {
    case 'saas_software':
      return `You are a senior CRO (conversion rate optimization) expert specializing in SaaS and software products.

DETECTED WEBSITE TYPE: SaaS / Software Product
CONFIDENCE: ${siteType.confidence}

You receive extracted website data including title, meta description, headings, body text, CTAs, forms, and images.

TASK:
1) Analyze this SaaS website to increase CONVERSIONS (signups, trial starts, demo requests).
2) Be specific and actionable. Avoid generic advice.
3) Write at a 7th–8th grade reading level.

SCORING CRITERIA FOR SAAS WEBSITES:
- MESSAGING: Clear value proposition, problem-solution fit, target audience identification, benefit clarity, differentiation from competitors
- CONVERSION: Free trial/demo CTAs, pricing page clarity, signup flow friction, value-first messaging, clear next steps
- TRUST: Customer logos, case studies, testimonials, security badges (SOC2, GDPR), integration partnerships, team credibility
- SEO: Product-relevant keywords, feature pages, comparison pages, solution pages. NOT local keywords or service areas.
- DESIGN/UX: Modern SaaS aesthetic, clear feature presentation, screenshot/video demos, intuitive navigation

DO NOT RECOMMEND:
- Phone numbers as primary CTA (SaaS uses online conversion)
- Service area information (SaaS is typically location-independent)
- "Request Service" or "Get Quote" buttons (use "Start Free Trial" / "Book Demo" / "Get Started")
- Local SEO tactics like city-specific keywords
- Emergency/24-7 service messaging

FOCUS ON:
- Value proposition clarity in the hero section
- Free trial or demo conversion paths
- Feature-benefit presentation
- Social proof from similar companies
- Pricing transparency
- Integration ecosystem
${baseStructure}
- Assume the goal is: "Get more trial signups, demo requests, and paying customers."`;

    case 'ecommerce':
      return `You are a senior CRO (conversion rate optimization) expert specializing in e-commerce and online retail.

DETECTED WEBSITE TYPE: E-commerce / Online Store
CONFIDENCE: ${siteType.confidence}

You receive extracted website data including title, meta description, headings, body text, CTAs, forms, and images.

TASK:
1) Analyze this e-commerce website to increase SALES (add to cart, checkout completion).
2) Be specific and actionable. Avoid generic advice.
3) Write at a 7th–8th grade reading level.

SCORING CRITERIA FOR E-COMMERCE WEBSITES:
- MESSAGING: Product clarity, unique selling proposition, brand story, value communication
- CONVERSION: Add to cart flow, checkout friction, product CTAs, upsell/cross-sell, cart abandonment prevention
- TRUST: Reviews, return policy, payment security badges, shipping information, customer photos
- SEO: Product schema, category structure, product descriptions, image alt text
- DESIGN/UX: Product photography, grid layouts, filtering/sorting, mobile shopping experience

DO NOT RECOMMEND:
- Phone number prominence (e-commerce uses online checkout)
- Service area information
- Booking systems or appointment scheduling
- Local SEO tactics

FOCUS ON:
- Product page optimization
- Checkout flow simplification
- Trust signals for online purchasing
- Product discovery and navigation
- Mobile shopping experience
- Shipping and return policy visibility
${baseStructure}
- Assume the goal is: "Get more add-to-carts, completed checkouts, and repeat purchases."`;

    case 'professional_services':
      return `You are a senior CRO (conversion rate optimization) expert specializing in professional services (agencies, consulting, law firms, accounting).

DETECTED WEBSITE TYPE: Professional Services
CONFIDENCE: ${siteType.confidence}

You receive extracted website data including title, meta description, headings, body text, CTAs, forms, and images.

TASK:
1) Analyze this professional services website to increase LEADS (consultation requests, contact form submissions).
2) Be specific and actionable. Avoid generic advice.
3) Write at a 7th–8th grade reading level.

SCORING CRITERIA FOR PROFESSIONAL SERVICES:
- MESSAGING: Expertise positioning, service clarity, industry focus, results-oriented language
- CONVERSION: Consultation booking, contact forms, case study downloads, newsletter signup
- TRUST: Case studies, client logos, team credentials, industry awards, testimonials, certifications
- SEO: Industry keywords, service-specific pages, thought leadership content
- DESIGN/UX: Professional aesthetic, portfolio/work examples, team presentation

FOCUS ON:
- Expertise and credibility signals
- Case studies and results
- Clear service offerings
- Team credentials and experience
- Consultation or discovery call CTAs
- Industry-specific positioning
${baseStructure}
- Assume the goal is: "Get more consultation requests, qualified leads, and new client engagements."`;

    case 'restaurant_hospitality':
      return `You are a senior CRO (conversion rate optimization) expert specializing in restaurants and hospitality businesses.

DETECTED WEBSITE TYPE: Restaurant / Hospitality
CONFIDENCE: ${siteType.confidence}

You receive extracted website data including title, meta description, headings, body text, CTAs, forms, and images.

TASK:
1) Analyze this restaurant/hospitality website to increase BOOKINGS (reservations, orders, room bookings).
2) Be specific and actionable. Avoid generic advice.
3) Write at a 7th–8th grade reading level.

SCORING CRITERIA FOR RESTAURANT/HOSPITALITY:
- MESSAGING: Atmosphere, cuisine type, unique experience, special occasions messaging
- CONVERSION: Reservation buttons, online ordering, menu visibility, contact information
- TRUST: Reviews, photos of food/space, awards, chef credentials, hygiene ratings
- SEO: Location keywords, cuisine type, "near me" optimization, Google Business integration
- DESIGN/UX: Food photography, ambiance photos, easy menu access, mobile-friendly reservations

FOCUS ON:
- Menu visibility and appeal
- Reservation/booking ease
- Location and hours prominence
- Food photography quality
- Online ordering integration
- Special events and private dining
${baseStructure}
- Assume the goal is: "Get more reservations, online orders, and event bookings."`;

    case 'nonprofit':
      return `You are a senior CRO (conversion rate optimization) expert specializing in nonprofit organizations.

DETECTED WEBSITE TYPE: Nonprofit / Organization
CONFIDENCE: ${siteType.confidence}

You receive extracted website data including title, meta description, headings, body text, CTAs, forms, and images.

TASK:
1) Analyze this nonprofit website to increase ENGAGEMENT (donations, volunteer signups, newsletter subscriptions).
2) Be specific and actionable. Avoid generic advice.
3) Write at a 7th–8th grade reading level.

SCORING CRITERIA FOR NONPROFITS:
- MESSAGING: Mission clarity, impact storytelling, emotional connection, urgency
- CONVERSION: Donate buttons, volunteer forms, newsletter signup, recurring donation options
- TRUST: Impact statistics, financial transparency, leadership team, partner logos, annual reports
- SEO: Cause-related keywords, program pages, impact stories
- DESIGN/UX: Emotional imagery, clear donation flow, impact visualization

FOCUS ON:
- Mission and impact clarity
- Donation flow simplicity
- Impact storytelling
- Volunteer opportunities
- Financial transparency
- Recurring giving options
${baseStructure}
- Assume the goal is: "Get more donations, volunteer signups, and community engagement."`;

    case 'content_media':
      return `You are a senior CRO (conversion rate optimization) expert specializing in content and media websites.

DETECTED WEBSITE TYPE: Content / Media / Blog
CONFIDENCE: ${siteType.confidence}

You receive extracted website data including title, meta description, headings, body text, CTAs, forms, and images.

TASK:
1) Analyze this content website to increase ENGAGEMENT (time on site, subscriptions, return visits).
2) Be specific and actionable. Avoid generic advice.
3) Write at a 7th–8th grade reading level.

SCORING CRITERIA FOR CONTENT/MEDIA:
- MESSAGING: Content value proposition, niche clarity, editorial voice
- CONVERSION: Newsletter signup, content upgrades, membership/subscription, social follows
- TRUST: Author credentials, content quality, publication frequency, social proof
- SEO: Content keywords, internal linking, category structure, featured snippets optimization
- DESIGN/UX: Readability, content discovery, related content, mobile reading experience

FOCUS ON:
- Newsletter/subscription conversion
- Content discoverability
- Reading experience
- Author credibility
- Social sharing
- Content organization
${baseStructure}
- Assume the goal is: "Get more subscribers, increase time on site, and build a loyal audience."`;

    case 'portfolio_personal':
      return `You are a senior CRO (conversion rate optimization) expert specializing in portfolio and personal brand websites.

DETECTED WEBSITE TYPE: Portfolio / Personal Website
CONFIDENCE: ${siteType.confidence}

You receive extracted website data including title, meta description, headings, body text, CTAs, forms, and images.

TASK:
1) Analyze this portfolio website to increase OPPORTUNITIES (job inquiries, freelance projects, speaking engagements).
2) Be specific and actionable. Avoid generic advice.
3) Write at a 7th–8th grade reading level.

SCORING CRITERIA FOR PORTFOLIOS:
- MESSAGING: Personal brand clarity, skill positioning, unique value, career focus
- CONVERSION: Contact form, hire me CTA, project inquiry, calendar booking
- TRUST: Work samples, testimonials, client logos, credentials, social proof
- SEO: Skill keywords, name recognition, portfolio optimization
- DESIGN/UX: Work presentation, navigation, mobile experience, personality expression

FOCUS ON:
- Work sample presentation
- Clear service/skill offerings
- Easy contact methods
- Professional credibility
- Personal brand consistency
${baseStructure}
- Assume the goal is: "Get more job opportunities, freelance inquiries, and professional connections."`;

    case 'local_service':
    default:
      return `You are a senior CRO (conversion rate optimization) expert, web designer, and local SEO specialist focused on LOCAL SERVICE businesses (HVAC, plumbing, roofing, electrical, landscaping, med spa, dental, cleaning, etc.).

DETECTED WEBSITE TYPE: ${siteType.type === 'local_service' ? 'Local Service Business' : 'General Business Website'}
CONFIDENCE: ${siteType.confidence}

You receive extracted website data including title, meta description, headings, body text, phone numbers, emails, CTAs, forms, and images.

TASK:
1) Analyze this website to increase LEADS (calls, form fills, bookings).
2) Be specific and actionable. Avoid generic advice.
3) Write at a 7th–8th grade reading level.
4) Focus on QUICK, PRACTICAL fixes, not theory.
5) Tailor advice for local service businesses: urgent jobs, local customers, trust, and speed.

SCORING CRITERIA FOR LOCAL SERVICE BUSINESSES:
- MESSAGING: Service clarity, location prominence, emergency availability, benefit-focused headlines
- CONVERSION: Phone number visibility, click-to-call, contact forms, booking systems, quote requests
- TRUST: Reviews, licenses, certifications, guarantees, insurance, years in business, team photos
- SEO: Local keywords, city/area targeting, Google Business optimization, NAP consistency
- DESIGN/UX: Mobile-first design, fast load times, clear navigation, professional appearance

FOCUS ON:
- Phone number prominence and click-to-call
- Service area clarity
- Emergency/same-day availability messaging
- Trust signals (licensed, insured, bonded)
- Customer reviews and testimonials
- Local SEO optimization

IMPORTANT: For preview/staging sites, focus on content quality and don't penalize for missing production items like analytics or custom domains.
${baseStructure}
- Assume the goal is: "Get more phone calls, quote requests, and booked jobs from this website."`;
  }
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========================================
    // AUTHENTICATION CHECK
    // ========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logStep("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      logStep("ERROR: Invalid token", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("User authenticated", { userId: user.id, email: user.email });

    // ========================================
    // USAGE LIMIT CHECK
    // ========================================
    const ownerEmail = getOwnerEmail();
    const isOwner = ownerEmail ? user.email?.toLowerCase() === ownerEmail : false;
    
    if (!isOwner) {
      const workspaceResult = await getOrCreateWorkspaceForUser(supabaseAdmin, user.id, user.email);
      
      if (isWorkspaceError(workspaceResult)) {
        logStep("ERROR: Workspace error", { error: workspaceResult.error });
        return new Response(
          JSON.stringify({ error: workspaceResult.error }),
          { status: workspaceResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { workspace } = workspaceResult;
      logStep("Workspace loaded", { 
        workspaceId: workspace.id, 
        plan: workspace.plan,
        status: workspace.subscription_status 
      });

      const status = workspace.subscription_status;
      const trialEndsAt = workspace.trial_ends_at ? new Date(workspace.trial_ends_at) : null;
      const now = new Date();

      if (status === "trialing" && trialEndsAt && trialEndsAt < now) {
        logStep("ERROR: Trial expired");
        return new Response(
          JSON.stringify({ error: "Your trial has expired. Please upgrade to continue using this feature." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (status === "canceled" || status === "unpaid" || status === "past_due") {
        logStep("ERROR: Subscription not active", { status });
        return new Response(
          JSON.stringify({ error: "Your subscription is not active. Please update your payment method." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const usage = await getOrCreateWorkspaceUsage(supabaseAdmin, workspace.id);
      const currentUsage = usage?.analyses_used || 0;
      const planLimit = PLAN_LIMITS[workspace.plan] || PLAN_LIMITS.starter;

      logStep("Usage check", { currentUsage, planLimit, plan: workspace.plan });

      if (currentUsage >= planLimit) {
        logStep("ERROR: Usage limit exceeded");
        return new Response(
          JSON.stringify({ 
            error: `You've used all ${planLimit} analyses for this month. Please upgrade your plan for more analyses.`,
            limitReached: true,
            currentUsage,
            limit: planLimit
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: incrementError } = await supabaseAdmin
        .from("workspace_usage")
        .update({ 
          analyses_used: currentUsage + 1,
          updated_at: new Date().toISOString()
        })
        .eq("workspace_id", workspace.id);

      if (incrementError) {
        logStep("WARNING: Failed to increment usage", { error: incrementError.message });
      } else {
        logStep("Usage incremented", { newUsage: currentUsage + 1 });
      }
    } else {
      logStep("Owner account - bypassing usage limits");
    }

    // ========================================
    // PARSE AND VALIDATE REQUEST
    // ========================================
    const { url, manualHtml, useFirecrawl } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const urlValidation = isValidPublicUrl(url);
    if (!urlValidation.valid) {
      logStep("ERROR: Invalid URL", { url, error: urlValidation.error });
      return new Response(
        JSON.stringify({ error: urlValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect environment for fair scoring
    const environment = detectEnvironment(url);
    logStep("Environment detected", { 
      type: environment.type, 
      isPreview: environment.isPreview,
      provider: environment.provider 
    });

    logStep("Analyzing URL", { url, manualHtml: !!manualHtml, useFirecrawl: !!useFirecrawl });

    // ========================================
    // FETCH AND ANALYZE WEBSITE
    // ========================================
    let html: string | undefined;
    let rawHtml: string | undefined; // For head metadata extraction from Firecrawl
    
    // Option 1: Use manually provided HTML (for age-gated/blocked sites)
    if (manualHtml && typeof manualHtml === 'string' && manualHtml.length > 0) {
      logStep("Using manually provided HTML", { length: manualHtml.length });
      html = manualHtml;
      
      // Basic validation
      if (html.length < 500) {
        return new Response(
          JSON.stringify({ error: "Provided HTML is too short. Please paste the full page source." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Option 2: Try Firecrawl if requested (for bot-protected sites)
    if (!html && useFirecrawl) {
      const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlApiKey) {
        try {
          logStep("Attempting Firecrawl fetch", { url });
          const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['html', 'rawHtml'],
              onlyMainContent: false,
              waitFor: 5000,
            }),
          });
          
          if (fcResponse.ok) {
            const fcData = await fcResponse.json();
            const fcHtml = fcData.data?.html || fcData.html;
            const fcRawHtml = fcData.data?.rawHtml || fcData.rawHtml;
            if (fcHtml && fcHtml.length > 500) {
              logStep("Firecrawl fetch successful", { length: fcHtml.length });
              html = fcHtml;
              if (fcRawHtml) rawHtml = fcRawHtml;
            }
          } else {
            logStep("Firecrawl fetch failed", { status: fcResponse.status });
          }
        } catch (fcError) {
          logStep("Firecrawl error", { error: fcError instanceof Error ? fcError.message : String(fcError) });
        }
      } else {
        logStep("Firecrawl not configured, skipping");
      }
    }
    
    // Option 3: Standard fetch with multiple user agents
    if (!html) {
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
      ];
      
      let lastError: Error | null = null;
      let fetchBlocked = false;
      
      for (const userAgent of userAgents) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          const response = await fetch(url, {
            headers: {
              "User-Agent": userAgent,
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
              "Accept-Encoding": "gzip, deflate, br",
              "Cache-Control": "no-cache",
              "Pragma": "no-cache",
              "Sec-Fetch-Dest": "document",
              "Sec-Fetch-Mode": "navigate",
              "Sec-Fetch-Site": "none",
              "Sec-Fetch-User": "?1",
              "Upgrade-Insecure-Requests": "1",
            },
            redirect: "follow",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            html = await response.text();
            
            if (html.length > 5000000) {
              html = html.slice(0, 5000000);
              logStep("WARNING: HTML truncated to 5MB");
            }
            
            logStep("Fetched HTML", { length: html.length, userAgent: userAgent.slice(0, 30) });
            break;
          } else if (response.status === 403 || response.status === 503) {
            logStep("Fetch blocked, trying next UA", { status: response.status });
            lastError = new Error(`Website returned ${response.status}`);
            fetchBlocked = true;
            continue;
          } else {
            throw new Error(`Failed to fetch website: ${response.status}`);
          }
        } catch (fetchError) {
          logStep("Fetch failed", { error: fetchError instanceof Error ? fetchError.message : String(fetchError) });
          lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
          continue;
        }
      }
      
      if (!html && fetchBlocked) {
        // Auto-fallback: try Firecrawl when direct fetch is blocked (403/503)
        const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
        if (firecrawlApiKey) {
          try {
            logStep("Direct fetch blocked; attempting Firecrawl fallback", { url });
            const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                url,
                formats: ['html', 'rawHtml'],
                onlyMainContent: false,
                waitFor: 7000,
              }),
            });

            if (fcResponse.ok) {
              const fcData = await fcResponse.json();
              const fcHtml = fcData.data?.html || fcData.html;
              const fcRawHtml = fcData.data?.rawHtml || fcData.rawHtml;
              if (typeof fcHtml === 'string' && fcHtml.length > 500) {
                html = fcHtml;
                if (fcRawHtml) rawHtml = fcRawHtml;
                if (html.length > 5000000) {
                  html = html.slice(0, 5000000);
                  logStep("WARNING: Firecrawl HTML truncated to 5MB");
                }
                logStep("Firecrawl fallback successful", { length: html.length });
              } else {
                logStep("Firecrawl fallback returned insufficient HTML", { length: typeof fcHtml === 'string' ? fcHtml.length : 0 });
              }
            } else {
              const fcText = await fcResponse.text().catch(() => '');
              logStep("Firecrawl fallback failed", { status: fcResponse.status, body: fcText.slice(0, 500) });
            }
          } catch (fcError) {
            logStep("Firecrawl fallback error", { error: fcError instanceof Error ? fcError.message : String(fcError) });
          }
        } else {
          logStep("Firecrawl fallback not available (missing FIRECRAWL_API_KEY)");
        }
      }

      if (!html) {
        logStep("ERROR: All fetch attempts failed", { error: lastError?.message });
        
        // Return NOT SCORABLE result instead of error
        const notScorableResult = {
          summary: {
            overallScore: 0,
            overview: "Unable to analyze this website.",
            quickWins: [],
          },
          notScorable: {
            isNotScorable: true,
            reason: fetchBlocked ? 'blocked_fetch' : 'blocked_fetch',
            reasonDisplay: 'Could not access this website. The site may have bot protection enabled, require authentication, or be temporarily unavailable.',
            finalUrl: url,
            httpStatus: 0,
            htmlSizeKb: 0,
            fixInstructions: [
              'Verify the URL is correct and publicly accessible',
              'Try accessing the URL in an incognito browser window',
              'Check if the site has bot protection (Cloudflare, etc.)',
              'If this is a preview URL, try the production URL instead',
              'Try using "Paste HTML" to manually provide the page source',
            ],
          },
          messaging: { score: 0, findings: [], recommendedHeadline: '', recommendedSubheadline: '', elevatorPitch: '' },
          conversion: { score: 0, findings: [], recommendations: [], sampleButtons: [] },
          designUx: { score: 0, findings: [], recommendations: [] },
          mobile: { score: 0, findings: [], recommendations: [] },
          performance: { score: 0, findings: [], heavyImages: [], recommendations: [] },
          seo: { score: 0, findings: [], recommendedTitle: '', recommendedMetaDescription: '', recommendedH1: '', keywords: [], checklist: [] },
          trust: { score: 0, findings: [], whyChooseUs: [], testimonialsBlock: '' },
          technical: { findings: [], recommendations: [] },
          aiServicePitch: { paragraph: '', bullets: [] },
          environment,
          analysisSourceUrl: url,
        };
        
        return new Response(JSON.stringify(notScorableResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Return 200 with NOT SCORABLE state, not error
        });
      }
    }

    // ========================================
    // CHECK CONTENT SUFFICIENCY (NOT SCORABLE detection)
    // ========================================
    const isManualHtml = !!(manualHtml && typeof manualHtml === 'string' && manualHtml.length > 0);
    let contentCheck = checkContentSufficiency(html, url);
    
    // For manual HTML submissions, skip js_only_shell detection — user explicitly provided rendered content
    if (contentCheck && contentCheck.reason === 'js_only_shell' && isManualHtml) {
      logStep("Skipping js_only_shell check for manual HTML submission", { bodyTextLength: html.length });
      contentCheck = null;
    }
    
    // Auto-fallback: retry with Firecrawl when js_only_shell detected (SPA/React sites)
    if (contentCheck && contentCheck.reason === 'js_only_shell' && !isManualHtml) {
      const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
      if (firecrawlApiKey) {
        try {
          logStep("JS-only shell detected; attempting Firecrawl JS-rendering fallback", { url });
          const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['html', 'rawHtml'],
              onlyMainContent: false,
              waitFor: 7000,
            }),
          });

          if (fcResponse.ok) {
            const fcData = await fcResponse.json();
            const fcHtml = fcData.data?.html || fcData.html;
            const fcRawHtml = fcData.data?.rawHtml || fcData.rawHtml;
            if (typeof fcHtml === 'string' && fcHtml.length > 500) {
              if (fcHtml.length > 5000000) {
                html = fcHtml.slice(0, 5000000);
                logStep("WARNING: Firecrawl JS-shell fallback HTML truncated to 5MB");
              } else {
                html = fcHtml;
              }
              if (fcRawHtml) rawHtml = fcRawHtml;
              logStep("Firecrawl JS-shell fallback successful", { length: html.length });
              
              // Re-check content sufficiency with the new HTML
              const recheck = checkContentSufficiency(html, url);
              if (!recheck) {
                logStep("Firecrawl fallback HTML passes content check — proceeding to analysis");
                contentCheck = null; // Clear the NOT SCORABLE state
              } else {
                logStep("Firecrawl fallback HTML still insufficient", { reason: recheck.reason });
                contentCheck = recheck; // Use the new check result
              }
            } else {
              logStep("Firecrawl JS-shell fallback returned insufficient HTML", { length: typeof fcHtml === 'string' ? fcHtml.length : 0 });
            }
          } else {
            const fcText = await fcResponse.text().catch(() => '');
            logStep("Firecrawl JS-shell fallback failed", { status: fcResponse.status, body: fcText.slice(0, 500) });
          }
        } catch (fcError) {
          logStep("Firecrawl JS-shell fallback error", { error: fcError instanceof Error ? fcError.message : String(fcError) });
        }
      } else {
        logStep("Firecrawl JS-shell fallback not available (missing FIRECRAWL_API_KEY)");
      }
    }
    
    if (contentCheck) {
      logStep("NOT SCORABLE: Insufficient content", { reason: contentCheck.reason });
      
      const notScorableResult = {
        summary: {
          overallScore: 0,
          overview: contentCheck.reasonDisplay,
          quickWins: contentCheck.fixInstructions.slice(0, 3),
        },
        notScorable: contentCheck,
        messaging: { score: 0, findings: [], recommendedHeadline: '', recommendedSubheadline: '', elevatorPitch: '' },
        conversion: { score: 0, findings: [], recommendations: [], sampleButtons: [] },
        designUx: { score: 0, findings: [], recommendations: [] },
        mobile: { score: 0, findings: [], recommendations: [] },
        performance: { score: 0, findings: [], heavyImages: [], recommendations: [] },
        seo: { score: 0, findings: [], recommendedTitle: '', recommendedMetaDescription: '', recommendedH1: '', keywords: [], checklist: [] },
        trust: { score: 0, findings: [], whyChooseUs: [], testimonialsBlock: '' },
        technical: { findings: [], recommendations: [] },
        aiServicePitch: { paragraph: '', bullets: [] },
        environment,
        analysisSourceUrl: url,
      };
      
      return new Response(JSON.stringify(notScorableResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract data from HTML
    const extractedData = extractDataFromHtml(html, url, rawHtml);
    logStep("Data extracted", { 
      title: extractedData.title?.slice(0, 50),
      hasPhone: extractedData.phoneNumbers.length > 0,
      hasViewport: extractedData.technical.hasViewport,
      hasFavicon: extractedData.technical.hasFavicon,
      hasMetaDesc: !!extractedData.metaDescription,
      usedRawHtml: !!rawHtml,
    });

    // Detect website type for adaptive scoring
    const websiteType = detectWebsiteType(extractedData, html, url);
    logStep("Website type detected", {
      type: websiteType.type,
      displayName: websiteType.displayName,
      confidence: websiteType.confidence,
      signals: websiteType.signals
    });

    // Call AI for analysis
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service not configured");
    }

    // Get type-specific analysis prompt
    const analysisPrompt = getAnalysisPromptForType(websiteType);

    // Include environment context in the AI prompt
    const environmentContext = environment.isPreview 
      ? `\n\nNOTE: This is a PREVIEW/STAGING environment (${environment.provider}). Score the content quality fairly but don't penalize for missing production items like analytics, canonical URLs, custom domains, or robots.txt blocking.`
      : '';

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0, // Deterministic scoring for consistent results
        messages: [
          { role: "system", content: analysisPrompt },
          {
            role: "user",
            content: `Analyze this website: ${url}${environmentContext}

Website Type: ${websiteType.displayName} (${websiteType.confidence} confidence)

Extracted Data:
${JSON.stringify(extractedData, null, 2)}

Provide a comprehensive analysis with specific, actionable recommendations appropriate for this ${websiteType.displayName}. Return ONLY valid JSON matching the specified structure.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("ERROR: AI API failed", { status: aiResponse.status, error: errorText.slice(0, 200) });
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service quota exceeded. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No analysis generated");
    }

    // Parse the JSON response
    let analysisResult;
    try {
      let jsonContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      jsonContent = jsonContent
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\x00-\x1F\x7F]/g, ' ');
      
      analysisResult = JSON.parse(jsonContent);
    } catch (parseError) {
      logStep("ERROR: JSON parse failed", { error: parseError instanceof Error ? parseError.message : String(parseError) });
      
      analysisResult = {
        summary: {
          overallScore: 50,
          overview: "Analysis partially completed. Some data could not be parsed.",
          quickWins: ["Review website manually for specific recommendations"]
        },
        messaging: { score: 50, findings: ["Could not fully analyze"], recommendedHeadline: "", recommendedSubheadline: "", elevatorPitch: "" },
        conversion: { score: 50, findings: ["Could not fully analyze"], recommendations: [], sampleButtons: [] },
        designUx: { score: 50, findings: ["Could not fully analyze"], recommendations: [] },
        mobile: { score: 50, findings: ["Could not fully analyze"], recommendations: [] },
        performance: { score: 50, findings: ["Could not fully analyze"], heavyImages: [], recommendations: [] },
        seo: { score: 50, findings: ["Could not fully analyze"], recommendedTitle: "", recommendedMetaDescription: "", recommendedH1: "", keywords: [], checklist: [] },
        trust: { score: 50, findings: ["Could not fully analyze"], whyChooseUs: [], testimonialsBlock: "" },
        technical: { findings: ["Could not fully analyze"], recommendations: [] },
        aiServicePitch: { paragraph: "", bullets: [] },
        parseWarning: "Some analysis data could not be parsed correctly"
      };
    }

    // Calculate dual scores
    const dualScore = calculateDualScores(analysisResult, url);
    
    // Add dual scoring to the result
    analysisResult.dualScore = dualScore;
    analysisResult.environment = environment;
    analysisResult.analysisSourceUrl = url;
    
    // Add detected website type to the result
    analysisResult.websiteType = {
      type: websiteType.type,
      displayName: websiteType.displayName,
      confidence: websiteType.confidence,
      signals: websiteType.signals,
    };
    
    // Update overall score with the fair-weighted version
    if (analysisResult.summary) {
      analysisResult.summary.websiteQualityScore = dualScore.websiteQualityScore;
      analysisResult.summary.productionReadinessScore = dualScore.productionReadinessScore;
      // Use the dual score's overall score for fair weighting
      analysisResult.summary.overallScore = dualScore.overallScore;
    }
    
    // Add unverified items indicator
    analysisResult.hasUnverifiedChecks = dualScore.unverifiedItems.length > 0;
    analysisResult.unverifiedItems = dualScore.unverifiedItems;

    logStep("Analysis complete", { 
      url, 
      overallScore: dualScore.overallScore,
      qualityScore: dualScore.websiteQualityScore,
      readinessScore: dualScore.productionReadinessScore,
      isPreview: environment.isPreview,
      websiteType: websiteType.type,
    });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logStep("ERROR: Unexpected error", { error: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
