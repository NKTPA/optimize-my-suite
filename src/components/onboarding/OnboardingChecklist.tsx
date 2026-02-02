import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Circle, 
  Building2, 
  CreditCard, 
  Globe, 
  FileText, 
  History,
  Image,
  X,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useHistory } from "@/hooks/use-history";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  ctaText: string;
  isComplete: boolean;
}

export function OnboardingChecklist() {
  const { profile } = useAuth();
  const { subscribed, isTrial } = useSubscription();
  const { history } = useHistory();
  const [dismissed, setDismissed] = useState(false);
  const [allCompleteDismissed, setAllCompleteDismissed] = useState(false);

  // Check localStorage for dismissal
  useEffect(() => {
    const isDismissed = localStorage.getItem("onboarding_dismissed");
    if (isDismissed === "true") {
      setDismissed(true);
    }
    const isAllCompleteDismissed = localStorage.getItem("onboarding_complete_dismissed");
    if (isAllCompleteDismissed === "true") {
      setAllCompleteDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setDismissed(true);
  };

  const handleAllCompleteDismiss = () => {
    localStorage.setItem("onboarding_complete_dismissed", "true");
    setAllCompleteDismissed(true);
  };

  const hasAnalysis = history.some(item => item.type === "analysis");
  const hasImplementation = history.some(item => item.type === "implementation");

  const items: ChecklistItem[] = [
    {
      id: "profile",
      title: "Complete Your Agency Profile",
      description: "Add your agency name and details",
      icon: Building2,
      href: "/dashboard/account",
      ctaText: "Edit Profile",
      isComplete: !!(profile?.agency_name && profile?.first_name),
    },
    {
      id: "billing",
      title: "Connect Billing",
      description: "Add a payment method after your trial",
      icon: CreditCard,
      href: "/pricing",
      ctaText: "View Plans",
      isComplete: subscribed && !isTrial,
    },
    {
      id: "analysis",
      title: "Run Your First Website Analysis",
      description: "Analyze a client website to see insights",
      icon: Globe,
      href: "/dashboard/analyze",
      ctaText: "Start Analysis",
      isComplete: hasAnalysis,
    },
    {
      id: "implementation",
      title: "Generate an Implementation Pack",
      description: "Get actionable recommendations for a client",
      icon: FileText,
      href: "/dashboard/analyze",
      ctaText: "Generate Pack",
      isComplete: hasImplementation,
    },
    {
      id: "history",
      title: "Save Reports in History",
      description: "Access your saved analyses anytime",
      icon: History,
      href: "/dashboard/history",
      ctaText: "View History",
      isComplete: history.length > 0,
    },
  ];

  const completedCount = items.filter(item => item.isComplete).length;
  const progress = (completedCount / items.length) * 100;
  const allComplete = completedCount === items.length;
  
  const incompleteItems = items.filter(item => !item.isComplete);
  const completedItems = items.filter(item => item.isComplete);

  // Don't show if dismissed
  if (dismissed) {
    return null;
  }

  // All complete - show success banner
  if (allComplete) {
    if (allCompleteDismissed) {
      return null;
    }
    
    return (
      <Card className="border-success/30 bg-success/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">Setup complete! You're ready to go.</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleAllCompleteDismiss} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Get Started Checklist</CardTitle>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {items.length} complete
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <Progress value={progress} className="h-2 mt-4" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {/* Completed items - compact single line each */}
          {completedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2"
            >
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              <p className="text-sm text-muted-foreground opacity-60">
                {item.title}
              </p>
            </div>
          ))}
          
          {/* Incomplete items - full prominence */}
          {incompleteItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Circle className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Link to={item.href}>
                  <Button size="sm" variant="outline" className="text-xs">
                    {item.ctaText}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
