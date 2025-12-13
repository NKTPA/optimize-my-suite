import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { PLAN_DEFINITIONS } from "@/lib/entitlements";

export interface UsageLimitModalProps {
  open: boolean;
  onClose: () => void;
  featureType: "analyses" | "packs" | "batch";
}

export function UsageLimitModal({
  open,
  onClose,
  featureType,
}: UsageLimitModalProps) {
  const navigate = useNavigate();
  const { workspace, usage, limits, isOwnerOverride } = useWorkspace();

  // INTERNAL OWNER OVERRIDE: Never show usage limit modal for owner
  if (isOwnerOverride) {
    return null;
  }

  const handleOpenChange = (openState: boolean) => {
    if (!openState) onClose();
  };

  const handleUpgrade = () => {
    onClose();
    navigate("/pricing");
  };

  const getUsageData = () => {
    switch (featureType) {
      case "analyses":
        return {
          label: "Analyses",
          used: usage?.analyses_used || 0,
          limit: limits.analysesPerMonth,
        };
      case "packs":
        return {
          label: "Implementation Packs",
          used: usage?.packs_used || 0,
          limit: limits.implementationsPerMonth,
        };
      case "batch":
        return {
          label: "Batch URLs",
          used: 0,
          limit: limits.batchUrlLimit,
        };
    }
  };

  const usageData = getUsageData();
  const percentage = typeof usageData.limit === "number" 
    ? Math.min(100, (usageData.used / usageData.limit) * 100)
    : 0;

  const currentPlan = workspace?.plan || "free";
  const nextPlan = currentPlan === "starter" ? "pro" : currentPlan === "pro" ? "scale" : null;
  const nextPlanDef = nextPlan ? PLAN_DEFINITIONS[nextPlan] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <DialogTitle className="text-center">Usage Limit Reached</DialogTitle>
          <DialogDescription className="text-center">
            You've reached your monthly {usageData.label.toLowerCase()} limit.
            Upgrade your plan to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{usageData.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {usageData.used} / {typeof usageData.limit === "number" ? usageData.limit : "∞"}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {nextPlanDef && (
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-foreground">{nextPlanDef.name} Plan</span>
                <span className="text-sm text-muted-foreground">${nextPlanDef.price}/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {nextPlanDef.description}
              </p>
              <p className="text-sm text-primary font-medium">
                Get {
                  featureType === "analyses" 
                    ? nextPlanDef.limits.analysesPerMonth 
                    : featureType === "packs"
                    ? nextPlanDef.limits.implementationsPerMonth
                    : typeof nextPlanDef.limits.batchUrlLimit === "number" 
                      ? nextPlanDef.limits.batchUrlLimit 
                      : "unlimited"
                } {usageData.label.toLowerCase()} per month
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleUpgrade} className="w-full gap-2">
            Upgrade Plan
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
