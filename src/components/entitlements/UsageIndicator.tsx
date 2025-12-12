import { BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { getUsagePercentage, getRemainingUsage } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

interface UsageIndicatorProps {
  type: "analyses" | "packs";
  showLabel?: boolean;
  className?: string;
  compact?: boolean;
}

export function UsageIndicator({ 
  type, 
  showLabel = true, 
  className,
  compact = false,
}: UsageIndicatorProps) {
  const { usage, limits, isLocked } = useWorkspace();

  if (!usage) return null;

  const used = type === "analyses" ? usage.analyses_used : usage.packs_used;
  const limit = type === "analyses" ? limits.analysesPerMonth : limits.implementationsPerMonth;
  const label = type === "analyses" ? "Analyses" : "Packs";
  
  const percentage = getUsagePercentage(used, limit);
  const remaining = getRemainingUsage(used, limit);
  
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <span className={cn(
          "font-medium",
          isAtLimit ? "text-destructive" : isNearLimit ? "text-warning" : "text-muted-foreground"
        )}>
          {label}: {used}/{typeof limit === "number" ? limit : "∞"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{label}</span>
          </div>
          <span className={cn(
            isAtLimit ? "text-destructive" : isNearLimit ? "text-warning" : "text-muted-foreground"
          )}>
            {used} / {typeof limit === "number" ? limit : "∞"}
            {typeof remaining === "number" && remaining > 0 && (
              <span className="ml-1 text-xs">({remaining} left)</span>
            )}
          </span>
        </div>
      )}
      <Progress 
        value={percentage} 
        className={cn(
          "h-2",
          isAtLimit ? "[&>div]:bg-destructive" : isNearLimit ? "[&>div]:bg-warning" : ""
        )} 
      />
    </div>
  );
}
