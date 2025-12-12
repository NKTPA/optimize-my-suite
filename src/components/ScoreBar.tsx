import { cn } from "@/lib/utils";

interface ScoreBarProps {
  score: number;
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBar({ score, label, showLabel = true, size = "md", className }: ScoreBarProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-score-excellent";
    if (score >= 60) return "bg-score-good";
    if (score >= 40) return "bg-score-fair";
    return "bg-score-poor";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  const heights = {
    sm: "h-2",
    md: "h-2.5",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-sm font-semibold text-foreground">
            {score}/100 <span className="text-muted-foreground font-normal">({getScoreLabel(score)})</span>
          </span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-secondary overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", getScoreColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
