import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationCardProps {
  title: string;
  content: string;
  className?: string;
}

export function RecommendationCard({ title, content, className }: RecommendationCardProps) {
  return (
    <div className={cn("bg-primary/5 border border-primary/20 rounded-lg p-4", className)}>
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}
