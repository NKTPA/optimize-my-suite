import { TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverallScoreProps {
  score: number;
  overview: string;
  quickWins: string[];
  className?: string;
}

export function OverallScore({ score, overview, quickWins, className }: OverallScoreProps) {
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

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("bg-card rounded-2xl border border-border p-8 shadow-card", className)}>
      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Score Circle */}
        <div className="relative flex-shrink-0">
          <svg className="w-36 h-36 transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-secondary"
            />
            <circle
              cx="72"
              cy="72"
              r="54"
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              className={cn("transition-all duration-1000 ease-out", getScoreRingColor(score))}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-4xl font-bold", getScoreColor(score))}>{score}</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Overall</span>
          </div>
        </div>

        {/* Overview & Quick Wins */}
        <div className="flex-1 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Website Analysis Summary</h2>
          </div>
          <p className="text-muted-foreground mb-6 leading-relaxed">{overview}</p>

          <div className="bg-accent/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">Quick Wins (Fix in 24 hours)</h3>
            </div>
            <ul className="space-y-2">
              {quickWins.map((win, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-foreground">{win}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
