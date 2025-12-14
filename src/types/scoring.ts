/**
 * Extended Analysis Types with Dual Scoring
 */

import { AnalysisResult } from './analysis';
import { DualScore, ScoreDelta } from '@/lib/scoringEngine';
import { EnvironmentInfo } from '@/lib/siteEnvironment';

/**
 * Extended analysis result with dual scoring
 */
export interface ExtendedAnalysisResult extends AnalysisResult {
  /** Dual scoring breakdown */
  dualScore?: DualScore;
  /** Environment information */
  environment?: EnvironmentInfo;
  /** Original analyzed URL (immutable reference) */
  analysisSourceUrl?: string;
  /** Score delta compared to original site */
  scoreDelta?: ScoreDelta;
}

/**
 * Score display configuration
 */
export interface ScoreDisplayConfig {
  showDualScores: boolean;
  showConfidence: boolean;
  showDelta: boolean;
  showUnverifiedItems: boolean;
}

/**
 * Score summary for UI display
 */
export interface ScoreSummary {
  primaryScore: number;
  primaryLabel: string;
  secondaryScore?: number;
  secondaryLabel?: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  unverifiedItems: string[];
  delta?: {
    value: number;
    improved: boolean;
    originalUrl: string;
  };
  isPreviewEnvironment: boolean;
  environmentProvider?: string;
}

/**
 * Get score summary from extended analysis result
 */
export function getScoreSummary(
  result: ExtendedAnalysisResult,
  url: string
): ScoreSummary {
  const dualScore = result.dualScore;
  const environment = result.environment;
  
  // Determine confidence based on unverified items
  let confidenceLevel: 'high' | 'medium' | 'low' = 'high';
  const unverifiedItems = dualScore?.unverifiedItems || [];
  
  if (unverifiedItems.length > 2) {
    confidenceLevel = 'low';
  } else if (unverifiedItems.length > 0) {
    confidenceLevel = 'medium';
  }

  // Build delta info if available
  let delta: ScoreSummary['delta'] | undefined;
  if (dualScore?.delta) {
    delta = {
      value: dualScore.delta.deltaScore,
      improved: dualScore.delta.improved,
      originalUrl: dualScore.delta.originalUrl,
    };
  }

  return {
    primaryScore: dualScore?.websiteQualityScore ?? result.summary.overallScore,
    primaryLabel: 'Website Quality',
    secondaryScore: dualScore?.productionReadinessScore,
    secondaryLabel: 'Production Readiness',
    confidenceLevel,
    unverifiedItems,
    delta,
    isPreviewEnvironment: environment?.isPreview ?? false,
    environmentProvider: environment?.provider !== 'none' ? environment?.provider : undefined,
  };
}
