import { DualScore } from '@/lib/scoringEngine';
import { EnvironmentInfo } from '@/lib/siteEnvironment';

export interface Finding {
  type: "success" | "warning" | "error" | "info";
  text: string;
}

export type FindingInput = Finding | string;

/** Confidence level for individual checks */
export type CheckConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

/** Status for individual checks */
export type CheckStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NOT_VERIFIABLE';

/** Extended finding with confidence */
export interface ConfidenceFinding extends Finding {
  confidence?: CheckConfidence;
  status?: CheckStatus;
  evidence?: string[];
}

/** Website type categories */
export type WebsiteType = 
  | 'local_service'
  | 'saas_software'
  | 'ecommerce'
  | 'professional_services'
  | 'content_media'
  | 'restaurant_hospitality'
  | 'nonprofit'
  | 'portfolio_personal'
  | 'unknown';

/** Website type detection info */
export interface WebsiteTypeInfo {
  type: WebsiteType;
  displayName: string;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
}

/** NOT SCORABLE state - when analysis cannot produce a valid score */
export interface NotScorableState {
  isNotScorable: true;
  reason: 
    | 'auth_gate' 
    | 'insufficient_html' 
    | 'blocked_fetch' 
    | 'redirect_loop' 
    | 'placeholder_page'
    | 'js_only_shell'
    | 'login_required'
    | 'age_verification';
  reasonDisplay: string;
  finalUrl?: string;
  httpStatus?: number;
  htmlSizeKb?: number;
  fixInstructions: string[];
}

export interface AnalysisResult {
  summary: {
    overallScore: number;
    overview: string;
    quickWins: string[];
    /** Website quality score (content, UX, trust) */
    websiteQualityScore?: number;
    /** Production readiness score (SEO, indexing, analytics) */
    productionReadinessScore?: number;
  };
  messaging: {
    score: number;
    findings: FindingInput[];
    recommendedHeadline: string;
    recommendedSubheadline: string;
    elevatorPitch: string;
  };
  conversion: {
    score: number;
    findings: FindingInput[];
    recommendations: string[];
    sampleButtons: string[];
  };
  designUx: {
    score: number;
    findings: FindingInput[];
    recommendations: string[];
  };
  mobile: {
    score: number;
    findings: FindingInput[];
    recommendations: string[];
  };
  performance: {
    score: number;
    findings: FindingInput[];
    heavyImages: string[];
    recommendations: string[];
  };
  seo: {
    score: number;
    findings: FindingInput[];
    recommendedTitle: string;
    recommendedMetaDescription: string;
    recommendedH1: string;
    keywords: string[];
    checklist: string[];
  };
  trust: {
    score: number;
    findings: FindingInput[];
    whyChooseUs: string[];
    testimonialsBlock: string;
  };
  technical: {
    findings: FindingInput[];
    recommendations: string[];
  };
  aiServicePitch: {
    paragraph: string;
    bullets: string[];
  };
  /** Dual scoring breakdown */
  dualScore?: DualScore;
  /** Environment information */
  environment?: EnvironmentInfo;
  /** Original analyzed URL (immutable) */
  analysisSourceUrl?: string;
  /** Indicates if some checks could not be verified */
  hasUnverifiedChecks?: boolean;
  /** List of items that could not be verified */
  unverifiedItems?: string[];
  /** NOT SCORABLE state - when analysis cannot produce a valid score */
  notScorable?: NotScorableState;
  /** Detected website type with adaptive scoring */
  websiteType?: WebsiteTypeInfo;
  /** SPA detection — true when Firecrawl JS-rendering fallback was used */
  spaDetected?: boolean;
}

/**
 * Type guard to check if analysis is NOT SCORABLE
 */
export function isNotScorable(result: AnalysisResult): result is AnalysisResult & { notScorable: NotScorableState } {
  return result.notScorable?.isNotScorable === true;
}

/**
 * Detects if HTML content appears to be a Lovable auth placeholder page
 */
export function detectLovablePlaceholder(result: AnalysisResult): boolean {
  const placeholderKeywords = [
    'authenticating',
    'get started',
    'build software products',
    'lovable',
  ];
  
  const overview = result.summary?.overview?.toLowerCase() || '';
  const title = result.seo?.recommendedTitle?.toLowerCase() || '';
  const messagingScore = result.messaging?.score ?? 50;
  const seoScore = result.seo?.score ?? 50;
  
  const hasPlaceholderKeywords = placeholderKeywords.some(
    kw => overview.includes(kw) || title.includes(kw)
  );
  
  // If keywords present AND both scores are very low, likely a placeholder
  return hasPlaceholderKeywords && messagingScore <= 20 && seoScore <= 20;
}