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
}
