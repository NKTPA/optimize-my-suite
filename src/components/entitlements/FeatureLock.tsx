import { useState, ReactNode } from "react";
import { Lock } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { canUseFeature, getRequiredPlanForFeature, PlanLimits, PlanId } from "@/lib/entitlements";
import { UpgradeModal } from "./UpgradeModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FeatureLockProps {
  feature: keyof PlanLimits;
  featureLabel: string;
  children: ReactNode;
  showLockIcon?: boolean;
  className?: string;
}

export function FeatureLock({
  feature,
  featureLabel,
  children,
  showLockIcon = true,
  className,
}: FeatureLockProps) {
  const { workspace, isLocked } = useWorkspace();
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const currentPlan = workspace?.plan || null;
  const hasAccess = !isLocked && canUseFeature(currentPlan, feature);
  const requiredPlan = getRequiredPlanForFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "relative cursor-pointer opacity-60 hover:opacity-80 transition-opacity",
                className
              )}
              onClick={() => setShowUpgrade(true)}
            >
              {children}
              {showLockIcon && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Upgrade to {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} to unlock {featureLabel}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        feature={featureLabel}
        requiredPlan={requiredPlan}
        currentPlan={currentPlan}
      />
    </>
  );
}
