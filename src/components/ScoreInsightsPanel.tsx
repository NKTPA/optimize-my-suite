import { useState } from "react";
import { 
  Rocket, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Info, 
  ToggleLeft, 
  ToggleRight,
  Target,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DualScore } from "@/lib/scoringEngine";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ScoreInsightsPanelProps {
  dualScore: DualScore;
  baselineScore?: number;
  baselineUrl?: string;
  className?: string;
  onDemoModeChange?: (enabled: boolean) => void;
}

export function ScoreInsightsPanel({ 
  dualScore, 
  baselineScore,
  baselineUrl,
  className,
  onDemoModeChange
}: ScoreInsightsPanelProps) {
  const { 
    websiteQualityScore, 
    productionReadinessScore,
    overallScore,
    environment 
  } = dualScore;

  // Demo Mode defaults to ON for preview environments
  const [demoMode, setDemoMode] = useState(environment.isPreview);

  const handleDemoModeChange = (enabled: boolean) => {
    setDemoMode(enabled);
    onDemoModeChange?.(enabled);
  };

  // Projected Live Score = Quality Score for previews
  const projectedLiveScore = websiteQualityScore;
  const hasDualScores = websiteQualityScore !== undefined && productionReadinessScore !== undefined;

  // Calculate delta vs original baseline
  const deltaVsOriginal = baselineScore !== undefined 
    ? projectedLiveScore - baselineScore 
    : null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-score-excellent";
    if (score >= 60) return "text-score-good";
    if (score >= 40) return "text-score-fair";
    return "text-score-poor";
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

  return (
    <div className={cn("space-y-4", className)}>
      {/* Score Insights Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Score Insights</h3>
        </div>
        
        {/* Demo Mode Toggle */}
        {environment.isPreview && (
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="demo-mode" 
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Demo Mode (Quality-only)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Switch
                      id="demo-mode"
                      checked={demoMode}
                      onCheckedChange={handleDemoModeChange}
                      className="scale-75"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>When enabled, the headline score shows Quality Score only, hiding production-readiness factors that don't apply to preview sites.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Current Score */}
        <div className="bg-card rounded-lg border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Current Score</span>
          </div>
          <span className={cn("text-2xl font-bold", getScoreColor(demoMode ? projectedLiveScore : overallScore))}>
            {demoMode ? projectedLiveScore : overallScore}
          </span>
          {demoMode && environment.isPreview && (
            <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0">
              Quality
            </Badge>
          )}
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
            <span className={cn("text-2xl font-bold", getScoreColor(projectedLiveScore))}>
              {projectedLiveScore}
            </span>
            {!hasDualScores && (
              <span className="text-[10px] text-muted-foreground ml-2">Single-score mode</span>
            )}
          </div>
        )}

        {/* Delta vs Original */}
        <div className="bg-card rounded-lg border border-border/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">vs Original</span>
          </div>
          {deltaVsOriginal !== null ? (
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn("text-sm font-bold px-2 py-0.5", getDeltaColor(deltaVsOriginal))}
              >
                <span className="flex items-center gap-1">
                  {getDeltaIcon(deltaVsOriginal)}
                  {deltaVsOriginal > 0 ? "+" : ""}{deltaVsOriginal} vs Original
                </span>
              </Badge>
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
          {baselineUrl && deltaVsOriginal !== null && (
            <p className="text-[10px] text-muted-foreground mt-1 truncate" title={baselineUrl}>
              vs {baselineUrl}
            </p>
          )}
        </div>
      </div>

      {/* Environment Context */}
      {environment.isPreview && (
        <p className="text-xs text-muted-foreground/70 text-center">
          This score reflects content quality. Production readiness items have reduced weight ({environment.isPreview ? "15%" : "30%"}).
        </p>
      )}
    </div>
  );
}
