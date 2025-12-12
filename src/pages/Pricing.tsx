import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Sparkles, ArrowRight, LogIn, Zap, Users, Headphones, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PRICE_IDS } from "@/lib/entitlements";

const plans = [
  {
    name: "Starter",
    price: 49,
    priceId: STRIPE_PRICE_IDS.starter,
    description: "Perfect for solo consultants and small agencies",
    features: [
      "25 analyses per month",
      "25 implementation packs",
      "White-label PDF reports",
      "Client history storage",
      "Batch mode (10 URLs)",
      "Blueprint generator",
      "Email support",
    ],
    cta: "Choose Starter",
    popular: false,
  },
  {
    name: "Pro",
    price: 149,
    priceId: STRIPE_PRICE_IDS.pro,
    description: "For growing agencies scaling their services",
    features: [
      "150 analyses per month",
      "150 implementation packs",
      "Unlimited history",
      "Priority batch mode (50 URLs)",
      "Custom branding on PDFs",
      "Up to 5 team members",
      "Client tagging tools",
      "Priority support",
    ],
    cta: "Choose Pro",
    popular: true,
  },
  {
    name: "Scale",
    price: 399,
    priceId: STRIPE_PRICE_IDS.scale,
    description: "Enterprise-ready for high-volume agencies",
    features: [
      "500 analyses per month",
      "500 implementation packs",
      "Unlimited team members",
      "API access",
      "Custom rate limits",
      "Dedicated success manager",
      "Early access to new features",
    ],
    cta: "Choose Scale",
    popular: false,
  },
];

const comparisonFeatures = [
  { feature: "Analyses per month", starter: "25", pro: "150", scale: "500" },
  { feature: "Implementation packs", starter: "25", pro: "150", scale: "500" },
  { feature: "White-label PDFs", starter: true, pro: true, scale: true },
  { feature: "Client history", starter: "Limited", pro: "Unlimited", scale: "Unlimited" },
  { feature: "Batch mode URLs", starter: "10", pro: "50", scale: "Unlimited" },
  { feature: "Blueprint generator", starter: true, pro: true, scale: true },
  { feature: "Custom PDF branding", starter: false, pro: true, scale: true },
  { feature: "Team members", starter: "1", pro: "5", scale: "Unlimited" },
  { feature: "Client tagging", starter: false, pro: true, scale: true },
  { feature: "API access", starter: false, pro: false, scale: true },
  { feature: "Dedicated success manager", starter: false, pro: false, scale: true },
  { feature: "Support", starter: "Email", pro: "Priority", scale: "Dedicated" },
];

export default function Pricing() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (priceId: string, planName: string) => {
    if (!user || !session) {
      navigate("/auth?tab=signup");
      return;
    }

    setLoadingPlan(planName);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="container pt-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-foreground">
            Optimize My <span className="text-gradient">Biz</span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                <Link to="/history">
                  <Button variant="ghost" size="sm">History</Button>
                </Link>
                <Link to="/account">
                  <Button variant="ghost" size="sm">Account</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button variant="default" size="sm">Create Agency Account</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container py-16 lg:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Simple, Transparent Pricing
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Pricing That Scales With Your Agency
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose a plan that fits your workflow. Run website audits, deliver white-label reports, and generate optimization packs at scale.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container pb-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-2xl bg-card border ${
                plan.popular ? "border-primary shadow-lg shadow-primary/10" : "border-border/50"
              } transition-all duration-300 hover:shadow-card-hover`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full"
                onClick={() => handleSelectPlan(plan.priceId, plan.name)}
                disabled={loadingPlan === plan.name}
              >
                {loadingPlan === plan.name ? "Loading..." : plan.cta}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                {plan.popular ? "Start your 14-day free trial" : "No credit card required to start"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Compare All Features
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-medium text-muted-foreground">Feature</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground">Starter</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground bg-primary/5">Pro</th>
                  <th className="text-center py-4 px-4 font-medium text-foreground">Scale</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-4 px-4 text-sm text-muted-foreground">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-sm">
                      {typeof row.starter === "boolean" ? (
                        row.starter ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground">{row.starter}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-sm bg-primary/5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground">{row.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-sm">
                      {typeof row.scale === "boolean" ? (
                        row.scale ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground">{row.scale}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Book a Demo CTA */}
      <section className="container pb-20">
        <div className="max-w-3xl mx-auto text-center p-8 rounded-2xl bg-primary/5 border border-primary/20">
          <Building2 className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Need a Custom Solution?
          </h2>
          <p className="text-muted-foreground mb-6">
            Talk to our team about enterprise pricing, custom integrations, and dedicated support.
          </p>
          <Button variant="outline" size="lg" className="gap-2">
            Book a Demo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">OptimizeSuite</span> — Website audits & optimization for marketing agencies
            </p>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
