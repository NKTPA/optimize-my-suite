import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScoringIntegrityTooltipProps {
  className?: string;
}

export function ScoringIntegrityTooltip({ className }: ScoringIntegrityTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Scoring Integrity</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3">
          <p className="text-sm leading-relaxed">
            We only score pages we can access and read. If a site is behind login, 
            blocked, or returns only a placeholder/JS shell, we mark it{" "}
            <strong className="text-amber-500">NOT SCORABLE</strong> instead of guessing.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}