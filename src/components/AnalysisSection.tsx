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
        "bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300 opacity-0 animate-fade-in",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
          {score !== undefined && <ScoreBar score={score} showLabel={false} size="sm" />}
        </div>
        {score !== undefined && (
          <div className="text-2xl font-bold text-foreground">{score}</div>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
