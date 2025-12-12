import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  title: string;
  content: string;
  className?: string;
}

export function RecommendationCard({ title, content, className }: RecommendationCardProps) {
  return (
    <div className={cn("bg-gradient-to-br from-primary/8 to-primary/4 border border-primary/15 rounded-xl p-4", className)}>
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-primary/15">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1.5 text-sm">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}
