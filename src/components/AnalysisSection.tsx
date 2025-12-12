import { cn } from "@/lib/utils";
import { ScoreBar } from "./ScoreBar";
import { LucideIcon } from "lucide-react";

interface AnalysisSectionProps {
  icon: LucideIcon;
  title: string;
  score?: number;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function AnalysisSection({ icon: Icon, title, score, children, className, delay = 0 }: AnalysisSectionProps) {
  return (
    <div
      className={cn(
        "group bg-card rounded-2xl border border-border/50 p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 opacity-0 animate-fade-in",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
          {score !== undefined && <ScoreBar score={score} showLabel={false} size="sm" />}
        </div>
        {score !== undefined && (
          <div className="flex flex-col items-end">
            <span className="text-2xl font-bold text-foreground">{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
