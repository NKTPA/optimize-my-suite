import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldX, ArrowRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface SubscriptionGateProps {
  children: ReactNode;
}

/**
 * Blocks access to dashboard content when the user's subscription is locked
 * (trial expired or subscription inactive). Shows a full-screen paywall.
 * Owner override bypasses this gate entirely.
 */
export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const navigate = useNavigate();
  const { isLocked, isTrialExpired, isLoading, isOwnerOverride, workspace } = useWorkspace();

  // Owner always gets through
  if (isOwnerOverride) return <>{children}</>;

  // Don't block while still loading workspace data
  if (isLoading) return <>{children}</>;

  // If no workspace exists yet, let them through (workspace creation flow)
  if (!workspace) return <>{children}</>;

  // If not locked, let them through
  if (!isLocked) return <>{children}</>;

  // Locked state — show paywall
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {isTrialExpired ? "Your Trial Has Expired" : "Subscription Required"}
          </h1>
          <p className="text-muted-foreground">
            {isTrialExpired
              ? "Your 3-day free trial has ended. Choose a plan to continue using OptimizeMySuite and access all your saved reports."
              : "Your subscription is no longer active. Please update your billing to regain access to your dashboard and reports."}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => navigate("/pricing")}
          >
            <CreditCard className="w-5 h-5" />
            {isTrialExpired ? "Choose a Plan" : "Update Billing"}
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => navigate("/")}
          >
            Back to Home
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/60">
          Plans start at $49/mo. All your data is saved and will be available once you subscribe.
        </p>
      </div>
    </div>
  );
}
