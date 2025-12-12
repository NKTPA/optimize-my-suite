import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlanId, PLAN_DEFINITIONS } from "@/lib/entitlements";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  requiredPlan: PlanId;
  currentPlan?: PlanId | null;
}

export function UpgradeModal({
  open,
  onOpenChange,
  feature,
  requiredPlan,
  currentPlan,
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const requiredPlanDef = PLAN_DEFINITIONS[requiredPlan];
  const currentPlanDef = currentPlan ? PLAN_DEFINITIONS[currentPlan] : null;

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Upgrade Required</DialogTitle>
          <DialogDescription className="text-center">
            {feature} is available on the{" "}
            <span className="font-semibold text-foreground">{requiredPlanDef.name}</span> plan
            {requiredPlan !== "scale" && " and above"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentPlanDef && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                You're currently on the <span className="font-medium text-foreground">{currentPlanDef.name}</span> plan
                {currentPlanDef.price > 0 && ` ($${currentPlanDef.price}/mo)`}.
              </p>
            </div>
          )}

          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">{requiredPlanDef.name} Plan</span>
              <span className="text-sm text-muted-foreground">${requiredPlanDef.price}/mo</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {requiredPlanDef.description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleUpgrade} className="w-full gap-2">
            Upgrade to {requiredPlanDef.name}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
