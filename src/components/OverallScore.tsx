import { TrendingUp, Zap, Star } from "lucide-react";
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

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Critical";
  };

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative overflow-hidden bg-card rounded-2xl border border-border/50 shadow-card", className)}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_100%_0%,_hsl(var(--primary)_/_0.08),_transparent_50%)]" />
      
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-10">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                className="text-secondary"
              />
              <circle
                cx="80"
                cy="80"
                r="54"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className={cn("transition-all duration-1000 ease-out", getScoreRingColor(score))}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-5xl font-bold tracking-tight", getScoreColor(score))}>{score}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{getScoreLabel(score)}</span>
            </div>
          </div>

          {/* Overview & Quick Wins */}
          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Website Analysis Summary</h2>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed max-w-xl">{overview}</p>

            <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent rounded-xl p-5 border border-accent/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-1.5 rounded-lg bg-accent/20">
                  <Zap className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground">Quick Wins (Fix in 24 hours)</h3>
              </div>
              <ul className="space-y-3">
                {quickWins.map((win, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-foreground leading-relaxed">{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
