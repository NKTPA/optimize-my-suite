import { AnalysisResult } from "@/types/analysis";

interface ScoreDisplayProps {
  results: AnalysisResult;
  label: string;
  compact?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return "bg-success/10";
  if (score >= 60) return "bg-warning/10";
  return "bg-destructive/10";
}

export function ScoreDisplay({ results, label, compact = false }: ScoreDisplayProps) {
  const overallScore = results.summary.overallScore;
  const dualScore = results.dualScore;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className={`rounded-lg p-3 ${getScoreBgColor(overallScore)}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Overall</span>
            <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
          </div>
        </div>
        
        {dualScore && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="text-xs text-muted-foreground">Quality</div>
              <div className={`text-sm font-semibold ${getScoreColor(dualScore.websiteQualityScore)}`}>
                {dualScore.websiteQualityScore}
              </div>
            </div>
            <div className="bg-muted/50 rounded p-2 text-center">
              <div className="text-xs text-muted-foreground">Readiness</div>
              <div className={`text-sm font-semibold ${getScoreColor(dualScore.productionReadinessScore)}`}>
                {dualScore.productionReadinessScore}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 text-xs">
          <ScoreRow label="Messaging" score={results.messaging.score} />
          <ScoreRow label="Conversion" score={results.conversion.score} />
          <ScoreRow label="Design" score={results.designUx.score} />
          <ScoreRow label="Mobile" score={results.mobile.score} />
          <ScoreRow label="Performance" score={results.performance.score} />
          <ScoreRow label="SEO" score={results.seo.score} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{label}</h3>
        <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
          {overallScore}
        </div>
      </div>

      {dualScore && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Website Quality</div>
            <div className={`text-xl font-bold ${getScoreColor(dualScore.websiteQualityScore)}`}>
              {dualScore.websiteQualityScore}
            </div>
          </div>
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Production Readiness</div>
            <div className={`text-xl font-bold ${getScoreColor(dualScore.productionReadinessScore)}`}>
              {dualScore.productionReadinessScore}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Section Scores</h4>
        <div className="grid grid-cols-2 gap-2">
          <ScoreRow label="Messaging" score={results.messaging.score} />
          <ScoreRow label="Conversion" score={results.conversion.score} />
          <ScoreRow label="Design" score={results.designUx.score} />
          <ScoreRow label="Mobile" score={results.mobile.score} />
          <ScoreRow label="Performance" score={results.performance.score} />
          <ScoreRow label="SEO" score={results.seo.score} />
          <ScoreRow label="Trust" score={results.trust.score} />
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center justify-between bg-background/50 rounded px-2 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${getScoreColor(score)}`}>{score}</span>
    </div>
  );
}
