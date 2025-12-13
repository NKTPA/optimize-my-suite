import { useNavigate } from "react-router-dom";
import { Clock, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function TrialBanner() {
  const navigate = useNavigate();
  const { workspace, isTrialActive, isTrialExpired, isLocked, isOwnerOverride } = useWorkspace();
  const [dismissed, setDismissed] = useState(false);

  // INTERNAL OWNER OVERRIDE: Never show banners for owner
  if (isOwnerOverride) return null;
  if (dismissed) return null;
  if (!workspace) return null;
  if (!isTrialActive && !isTrialExpired && !isLocked) return null;

  const trialEndsAt = workspace.trial_ends_at ? new Date(workspace.trial_ends_at) : null;
  const now = new Date();
  const hoursRemaining = trialEndsAt 
    ? Math.max(0, Math.floor((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
    : 0;
  const daysRemaining = Math.floor(hoursRemaining / 24);

  if (isTrialExpired || isLocked) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
        <div className="container flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm font-medium text-destructive">
              {isTrialExpired 
                ? "Your trial has expired. Add a payment method to continue using the app."
                : "Your subscription is inactive. Please update your billing to continue."}
            </p>
          </div>
          <Button 
            size="sm" 
            variant="destructive"
            onClick={() => navigate("/pricing")}
          >
            {isTrialExpired ? "Choose Plan" : "Fix Billing"}
          </Button>
        </div>
      </div>
    );
  }

  if (isTrialActive && hoursRemaining <= 48) {
    return (
      <div className="bg-warning/10 border-b border-warning/20 px-4 py-3">
        <div className="container flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-warning flex-shrink-0" />
            <p className="text-sm font-medium text-warning">
              {hoursRemaining <= 2 
                ? "Your trial ends in less than 2 hours!"
                : hoursRemaining <= 24
                ? `Your trial ends in ${hoursRemaining} hours.`
                : `Your trial ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}.`}
              {" "}Add a payment method to keep access.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => navigate("/pricing")}
            >
              Add Payment
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className="p-1 h-auto"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
