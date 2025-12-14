/**
 * Confidence-Aware Scoring Engine
 * 
 * Provides fair scoring with confidence levels and environment awareness
 */

import { EnvironmentInfo, detectEnvironment, getScoreWeights } from './siteEnvironment';

// Check result statuses
export type CheckStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NOT_VERIFIABLE';

// Confidence levels for checks
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

// Individual check result
export interface CheckResult {
  id: string;
  name: string;
  category: 'quality' | 'readiness';
  status: CheckStatus;
  confidence: ConfidenceLevel;
  evidence: string[];
  message: string;
  penalty: number; // Raw penalty (0-100)
  adjustedPenalty: number; // After confidence adjustment
}

// Category scores
export interface CategoryScore {
  score: number;
  checks: CheckResult[];
  verifiedChecks: number;
  unverifiedChecks: number;
}

// Dual scoring output
export interface DualScore {
  websiteQualityScore: number;
  productionReadinessScore: number;
  overallScore: number;
  environment: EnvironmentInfo;
  qualityBreakdown: {
    conversion: CategoryScore;
    messaging: CategoryScore;
    trustUx: CategoryScore;
  };
  readinessBreakdown: {
    indexing: CategoryScore;
    performance: CategoryScore;
    analytics: CategoryScore;
    structuredData: CategoryScore;
  };
  unverifiedItems: string[];
  delta?: ScoreDelta;
}

// Score delta for comparing original vs rebuilt
export interface ScoreDelta {
  originalUrl: string;
  originalScore: number;
  deltaScore: number;
  deltaPercent: number;
  improved: boolean;
}

/**
 * Calculate penalty multiplier based on confidence level
 */
export function getConfidenceMultiplier(confidence: ConfidenceLevel): number {
  switch (confidence) {
    case 'HIGH':
      return 1.0; // Full penalty
    case 'MEDIUM':
      return 0.7; // 70% penalty
    case 'LOW':
      return 0.15; // 15% penalty max
    default:
      return 0.5;
  }
}

/**
 * Adjust penalty based on confidence
 */
export function adjustPenaltyForConfidence(
  penalty: number,
  confidence: ConfidenceLevel,
  status: CheckStatus
): number {
  if (status === 'NOT_VERIFIABLE') {
    return penalty * 0.1; // Minimal penalty for unverifiable
  }
  if (status === 'PASS') {
    return 0;
  }
  return penalty * getConfidenceMultiplier(confidence);
}

/**
 * Calculate category score from checks
 */
export function calculateCategoryScore(checks: CheckResult[]): CategoryScore {
  if (checks.length === 0) {
    return { score: 100, checks: [], verifiedChecks: 0, unverifiedChecks: 0 };
  }

  const verifiedChecks = checks.filter(c => c.status !== 'NOT_VERIFIABLE').length;
  const unverifiedChecks = checks.filter(c => c.status === 'NOT_VERIFIABLE').length;
  
  const totalPenalty = checks.reduce((sum, check) => sum + check.adjustedPenalty, 0);
  const maxPossiblePenalty = checks.reduce((sum, check) => sum + check.penalty, 0);
  
  // Scale score: 100 - (adjusted penalty as percentage of max)
  const score = maxPossiblePenalty > 0 
    ? Math.max(0, Math.min(100, 100 - (totalPenalty / maxPossiblePenalty) * 100))
    : 100;

  return {
    score: Math.round(score),
    checks,
    verifiedChecks,
    unverifiedChecks,
  };
}

/**
 * Calculate dual scores from analysis result
 */
export function calculateDualScores(
  analysisResult: Record<string, unknown>,
  url: string,
  originalAnalysis?: { url: string; score: number }
): DualScore {
  const environment = detectEnvironment(url);
  const weights = getScoreWeights(environment);

  // Extract scores from analysis result with defaults
  const getScore = (path: string): number => {
    const parts = path.split('.');
    let value: unknown = analysisResult;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return 50; // Default score
      }
    }
    return typeof value === 'number' ? value : 50;
  };

  // Quality scores (content, UX, trust)
  const conversionScore = getScore('conversion.score');
  const messagingScore = getScore('messaging.score');
  const designScore = getScore('designUx.score');
  const trustScore = getScore('trust.score');
  const mobileScore = getScore('mobile.score');

  // Readiness scores (technical, SEO, performance)
  const seoScore = getScore('seo.score');
  const performanceScore = getScore('performance.score');

  // Calculate quality score (60% conversion, 25% messaging, 15% trust/UX)
  const trustUxCombined = (designScore + trustScore + mobileScore) / 3;
  const websiteQualityScore = Math.round(
    conversionScore * 0.60 +
    messagingScore * 0.25 +
    trustUxCombined * 0.15
  );

  // Calculate readiness score (35% indexing/SEO, 25% performance, 20% analytics, 20% structured)
  // For preview environments, reduce penalties for missing production items
  let indexingScore = seoScore;
  let analyticsScore = 70; // Default assumption
  let structuredDataScore = 60; // Default assumption

  if (environment.isPreview) {
    // Don't penalize preview sites for production-readiness items
    indexingScore = Math.max(indexingScore, 70); // Minimum 70 for previews
    analyticsScore = 80; // Assume would be added in production
    structuredDataScore = 70; // Assume would be added in production
  }

  const productionReadinessScore = Math.round(
    indexingScore * 0.35 +
    performanceScore * 0.25 +
    analyticsScore * 0.20 +
    structuredDataScore * 0.20
  );

  // Calculate overall score based on environment
  const overallScore = Math.round(
    websiteQualityScore * weights.qualityWeight +
    productionReadinessScore * weights.readinessWeight
  );

  // Build unverified items list
  const unverifiedItems: string[] = [];
  if (environment.isPreview) {
    unverifiedItems.push('Custom domain configuration');
    unverifiedItems.push('Production analytics setup');
    unverifiedItems.push('Search engine indexing');
  }

  // Calculate delta if original analysis provided
  let delta: ScoreDelta | undefined;
  if (originalAnalysis) {
    const deltaScore = overallScore - originalAnalysis.score;
    delta = {
      originalUrl: originalAnalysis.url,
      originalScore: originalAnalysis.score,
      deltaScore,
      deltaPercent: originalAnalysis.score > 0 
        ? Math.round((deltaScore / originalAnalysis.score) * 100)
        : 0,
      improved: deltaScore > 0,
    };
  }

  return {
    websiteQualityScore,
    productionReadinessScore,
    overallScore,
    environment,
    qualityBreakdown: {
      conversion: { score: conversionScore, checks: [], verifiedChecks: 1, unverifiedChecks: 0 },
      messaging: { score: messagingScore, checks: [], verifiedChecks: 1, unverifiedChecks: 0 },
      trustUx: { score: Math.round(trustUxCombined), checks: [], verifiedChecks: 1, unverifiedChecks: 0 },
    },
    readinessBreakdown: {
      indexing: { score: indexingScore, checks: [], verifiedChecks: environment.isPreview ? 0 : 1, unverifiedChecks: environment.isPreview ? 1 : 0 },
      performance: { score: performanceScore, checks: [], verifiedChecks: 1, unverifiedChecks: 0 },
      analytics: { score: analyticsScore, checks: [], verifiedChecks: 0, unverifiedChecks: 1 },
      structuredData: { score: structuredDataScore, checks: [], verifiedChecks: 0, unverifiedChecks: 1 },
    },
    unverifiedItems,
    delta,
  };
}

/**
 * Check if an item should be exempt from penalties in preview environments
 */
export function isExemptInPreview(
  checkId: string,
  environment: EnvironmentInfo
): boolean {
  if (!environment.isPreview) {
    return false;
  }
  return environment.previewExemptions.includes(checkId);
}

/**
 * Format score for display with confidence indicator
 */
export function formatScoreWithConfidence(
  score: number,
  unverifiedCount: number,
  totalChecks: number
): { display: string; hasUnverified: boolean; confidence: string } {
  const hasUnverified = unverifiedCount > 0;
  const verifiedPercent = totalChecks > 0 
    ? Math.round(((totalChecks - unverifiedCount) / totalChecks) * 100)
    : 100;

  let confidence: string;
  if (verifiedPercent >= 90) {
    confidence = 'High confidence';
  } else if (verifiedPercent >= 60) {
    confidence = 'Medium confidence';
  } else {
    confidence = 'Low confidence';
  }

  return {
    display: `${score}`,
    hasUnverified,
    confidence,
  };
}
