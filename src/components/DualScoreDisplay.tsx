import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { DualScore } from "@/lib/scoringEngine";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DualScoreDisplayProps {
  dualScore: DualScore;
  className?: string;
}

export function DualScoreDisplay({ dualScore, className }: DualScoreDisplayProps) {
  const { 
    websiteQualityScore, 
    productionReadinessScore, 
    overallScore,
    environment,
    unverifiedItems,
    delta 
  } = dualScore;

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

  const circumference = 2 * Math.PI * 45;
  const qualityOffset = circumference - (websiteQualityScore / 100) * circumference;
  const readinessOffset = circumference - (productionReadinessScore / 100) * circumference;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Environment Badge */}
      {environment.isPreview && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
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
      )}

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
              <Badge variant="outline" className="mt-2 text-xs">
                {getScoreLabel(productionReadinessScore)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Delta Score (if comparing to original) */}
      {delta && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-lg border",
          delta.improved 
            ? "bg-score-excellent/10 border-score-excellent/20" 
            : "bg-score-poor/10 border-score-poor/20"
        )}>
          {delta.improved ? (
            <TrendingUp className="w-5 h-5 text-score-excellent" />
          ) : (
            <TrendingDown className="w-5 h-5 text-score-poor" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">
              {delta.improved ? "Improvement" : "Change"} vs Original
            </p>
            <p className="text-xs text-muted-foreground">
              Compared to {delta.originalUrl}
            </p>
          </div>
          <div className="text-right">
            <span className={cn(
              "text-lg font-bold",
              delta.improved ? "text-score-excellent" : "text-score-poor"
            )}>
              {delta.deltaScore > 0 ? "+" : ""}{delta.deltaScore}
            </span>
            <p className="text-xs text-muted-foreground">
              ({delta.deltaPercent > 0 ? "+" : ""}{delta.deltaPercent}%)
            </p>
          </div>
        </div>
      )}

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
