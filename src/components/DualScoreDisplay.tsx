import { useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info, Server, Rocket, Sparkles, Target, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DualScore } from "@/lib/scoringEngine";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface DualScoreDisplayProps {
  dualScore: DualScore;
  baselineScore?: number;
  baselineUrl?: string;
  className?: string;
}

export function DualScoreDisplay({ 
  dualScore, 
  baselineScore,
  baselineUrl,
  className 
}: DualScoreDisplayProps) {
  const { 
    websiteQualityScore, 
    productionReadinessScore, 
    overallScore,
    environment,
    unverifiedItems,
    delta 
  } = dualScore;

  // Demo Mode defaults to ON for preview environments
  const [demoMode, setDemoMode] = useState(environment.isPreview);

  // Projected Live Score = Quality Score
  const projectedLiveScore = websiteQualityScore;
  const hasDualScores = websiteQualityScore !== undefined && productionReadinessScore !== undefined;

  // Calculate delta vs baseline (from props or from dual score delta)
  const deltaVsOriginal = baselineScore !== undefined 
    ? projectedLiveScore - baselineScore 
    : delta?.deltaScore ?? null;

  const effectiveBaselineUrl = baselineUrl || delta?.originalUrl;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-score-excellent";
    if (score >= 60) return "text-score-good";
    if (score >= 40) return "text-score-fair";
    return "text-score-poor";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 80) return "stroke-score-excellent";
    if (score >= 60) return "stroke-score-good";
    if (score >= 40) return "stroke-score-fair";
    return "stroke-score-poor";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Critical";
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return "text-score-excellent bg-score-excellent/10 border-score-excellent/20";
    if (delta < 0) return "text-score-poor bg-score-poor/10 border-score-poor/20";
    return "text-muted-foreground bg-muted border-border";
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="w-3 h-3" />;
    if (delta < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const circumference = 2 * Math.PI * 45;
  const qualityOffset = circumference - (websiteQualityScore / 100) * circumference;
  const readinessOffset = circumference - (productionReadinessScore / 100) * circumference;

  // Display score based on demo mode
  const displayMainScore = demoMode && environment.isPreview ? projectedLiveScore : overallScore;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Environment Badge + Demo Mode Toggle */}
      {environment.isPreview && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-600 dark:text-amber-400">
              Preview Environment Detected ({environment.provider})
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>This is a preview/staging site. Production readiness items are scored fairly - they won't heavily penalize your overall score.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="demo-mode-toggle" 
              className="text-xs text-amber-700 dark:text-amber-300 cursor-pointer whitespace-nowrap"
            >
              Demo Mode (Quality-only)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Switch
                      id="demo-mode-toggle"
                      checked={demoMode}
                      onCheckedChange={setDemoMode}
                      className="scale-75"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>When enabled, scores emphasize content quality over production-readiness factors that don't apply to preview sites.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Score Insights Panel */}
      <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Score Insights</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Current Score */}
          <div className="bg-card rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Current Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-bold", getScoreColor(displayMainScore))}>
                {displayMainScore}
              </span>
              {demoMode && environment.isPreview && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Quality
                </Badge>
              )}
            </div>
          </div>

          {/* Projected Live Score */}
          {environment.isPreview && (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Rocket className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary/80">Projected Live Score</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Preview environments can't fully validate production signals (indexing, analytics, etc.). Projected Live Score estimates performance once deployed on the customer domain.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", getScoreColor(projectedLiveScore))}>
                  {projectedLiveScore}
                </span>
                {!hasDualScores && (
                  <span className="text-[10px] text-muted-foreground">Single-score mode</span>
                )}
              </div>
            </div>
          )}

          {/* Delta vs Original */}
          <div className="bg-card rounded-lg border border-border/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">vs Original</span>
            </div>
            {deltaVsOriginal !== null ? (
              <div className="flex flex-col gap-1">
                <Badge 
                  variant="outline" 
                  className={cn("text-sm font-bold px-2 py-0.5 w-fit", getDeltaColor(deltaVsOriginal))}
                >
                  <span className="flex items-center gap-1">
                    {getDeltaIcon(deltaVsOriginal)}
                    {deltaVsOriginal > 0 ? "+" : ""}{deltaVsOriginal} vs Original
                  </span>
                </Badge>
                {effectiveBaselineUrl && (
                  <p className="text-[10px] text-muted-foreground truncate" title={effectiveBaselineUrl}>
                    vs {effectiveBaselineUrl}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground/70 italic">
                  No baseline yet
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  Analyze customer domain first
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dual Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Website Quality Score */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-secondary"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={cn("transition-all duration-700", getScoreRingColor(websiteQualityScore))}
                  strokeDasharray={circumference}
                  strokeDashoffset={qualityOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-2xl font-bold", getScoreColor(websiteQualityScore))}>
                  {websiteQualityScore}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Website Quality</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Conversion, messaging, trust & UX
              </p>
              <Badge variant="outline" className="mt-2 text-xs">
                {getScoreLabel(websiteQualityScore)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Production Readiness Score */}
        <div className="bg-card rounded-xl border border-border/50 p-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-secondary"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  fill="none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className={cn("transition-all duration-700", getScoreRingColor(productionReadinessScore))}
                  strokeDasharray={circumference}
                  strokeDashoffset={readinessOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-2xl font-bold", getScoreColor(productionReadinessScore))}>
                  {productionReadinessScore}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Production Readiness</h3>
              <p className="text-xs text-muted-foreground mt-1">
                SEO, indexing, analytics, speed
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {getScoreLabel(productionReadinessScore)}
                </Badge>
                {environment.isPreview && (
                  <Badge variant="secondary" className="text-[10px]">
                    15% weight
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exempted Items for Preview */}
      {environment.isPreview && unverifiedItems.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Expected for Preview Environment — Not Penalized
            </h4>
          </div>
          <ul className="space-y-2">
            {unverifiedItems.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground/80 mt-3 italic">
            These production-readiness items are typical for preview deployments and have minimal impact on your overall score.
          </p>
        </div>
      )}

      {/* Unverified Items for Production */}
      {!environment.isPreview && unverifiedItems.length > 0 && (
        <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-muted-foreground">Could Not Verify</h4>
          </div>
          <ul className="space-y-1">
            {unverifiedItems.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground/70 mt-2">
            These items should be addressed for production.
          </p>
        </div>
      )}

      {/* Overall Score Summary */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Overall Score</p>
            <p className="text-xs text-muted-foreground">
              {environment.isPreview ? "85% quality, 15% readiness" : "70% quality, 30% readiness"}
            </p>
          </div>
        </div>
        <span className={cn("text-3xl font-bold", getScoreColor(overallScore))}>
          {overallScore}
        </span>
      </div>
    </div>
  );
}
