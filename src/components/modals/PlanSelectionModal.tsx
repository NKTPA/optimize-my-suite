import { useNavigate } from "react-router-dom";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PlanSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    icon: Sparkles,
    description: "Perfect for solo consultants",
    features: [
      "25 analyses/month",
      "25 implementation packs",
      "10-URL batch mode",
      "White-label PDFs",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    icon: Zap,
    description: "For growing agencies",
    features: [
      "150 analyses/month",
      "150 implementation packs",
      "50-URL batch mode",
      "Custom branding",
      "5 team members",
    ],
    popular: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 399,
    icon: Building2,
    description: "Enterprise-ready",
    features: [
      "500 analyses/month",
      "Unlimited history",
      "Unlimited team members",
      "API access",
      "Dedicated support",
    ],
  },
];

export function PlanSelectionModal({ open, onOpenChange }: PlanSelectionModalProps) {
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    onOpenChange(false);
    navigate(`/auth?tab=signup&plan=${planId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">
            Choose Your Plan to Get Started
          </DialogTitle>
          <DialogDescription className="text-base">
            Start your 3-day free trial. No credit card required.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-lg ${
                  plan.popular 
                    ? "border-primary bg-primary/5 shadow-md" 
                    : "border-border/50 bg-card hover:border-primary/50"
                }`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl ${plan.popular ? "bg-primary/20" : "bg-secondary"}`}>
                    <Icon className={`w-5 h-5 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.popular ? "default" : "outline"} 
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  Start Free Trial
                </Button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          All plans include a 3-day free trial. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
