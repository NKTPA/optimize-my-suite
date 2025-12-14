import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Sparkles, ArrowRight, Building2, ShieldCheck, TrendingUp, BadgeCheck, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PRICE_IDS } from "@/lib/entitlements";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const plans = [
  {
    name: "Starter",
    price: 49,
    priceId: STRIPE_PRICE_IDS.starter,
    description: "For solo consultants testing the waters",
    whoIsFor: "Perfect if you're a freelancer or solo consultant who wants to add website audits to your service offering.",
    businessOutcome: "Close 1-2 additional website projects per month",
    features: [
      "25 analyses per month",
      "25 implementation packs",
      "White-label PDF reports",
      "Client history storage",
      "Batch mode (10 URLs)",
      "Blueprint generator",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: 149,
    priceId: STRIPE_PRICE_IDS.pro,
    description: "For growing agencies scaling client work",
    whoIsFor: "Built for agencies with 5-20 clients who need consistent, branded deliverables and team collaboration.",
    businessOutcome: "Systematically prove value to retain more accounts",
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
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Scale",
    price: 399,
    priceId: STRIPE_PRICE_IDS.scale,
    description: "For high-volume agencies and white-label resellers",
    whoIsFor: "Designed for agencies running 50+ audits per month, or those reselling audits to other agencies.",
    businessOutcome: "Build recurring revenue with productized audit services",
    features: [
      "500 analyses per month",
      "500 implementation packs",
      "Unlimited team members",
      "API access",
      "Custom rate limits",
      "Dedicated success manager",
      "Early access to new features",
    ],
    cta: "Start Free Trial",
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

const valueProps = [
  {
    icon: TrendingUp,
    title: "One Closed Deal Pays for Months",
    description: "A single website project you close with OptimizeMySuite covers 3-12 months of subscription costs. The math works.",
  },
  {
    icon: ShieldCheck,
    title: "Client-Facing Quality Guaranteed",
    description: "Every report is designed to be shared directly with clients. No system logs, no technical jargon — just professional deliverables.",
  },
  {
    icon: Zap,
    title: "Built for Agency Workflows",
    description: "Batch analysis, white-labeling, team collaboration, and history management. Everything agencies actually need.",
  },
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
          <HeaderBrand textFallback />
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
      <section className="container py-16 lg:py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          Pricing That Pays for Itself
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
          Invest in Proof. Close More Deals.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
          Choose a plan that matches your agency's volume. Every tier includes the same professional-grade features — just more capacity.
        </p>
        <p className="text-sm text-foreground/70 font-medium max-w-xl mx-auto">
          Start with a 3-day free trial. No credit card required. Cancel anytime.
        </p>
      </section>

      {/* Value Props */}
      <section className="container pb-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <div key={index} className="p-5 rounded-xl bg-card border border-border/50 text-center">
                <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{prop.title}</h3>
                <p className="text-sm text-muted-foreground">{prop.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container pb-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-2xl bg-card border transition-all duration-300 ${
                plan.popular 
                  ? "border-primary border-2 shadow-xl scale-[1.02] ring-4 ring-primary/10" 
                  : "border-border/50 hover:border-border hover:shadow-card-hover"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-md">
                  Most Popular
                </div>
              )}
              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-primary" : "text-foreground"}`}>${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground mb-1">Who this is for:</p>
                  <p className="text-sm text-foreground/80">{plan.whoIsFor}</p>
                </div>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {plan.businessOutcome}
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
                className={`w-full ${plan.popular ? "shadow-lg" : ""}`}
                onClick={() => handleSelectPlan(plan.priceId, plan.name)}
                disabled={loadingPlan === plan.name}
              >
                {loadingPlan === plan.name ? "Loading..." : plan.cta}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                3-day free trial • No credit card required
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ROI Justification */}
      <section className="container pb-16">
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl bg-card border border-border/50 shadow-card">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground mb-2">The Math Makes Sense</h2>
            <p className="text-muted-foreground">Here's why agencies keep paying for OptimizeMySuite:</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-xl bg-secondary/50">
              <p className="text-3xl font-bold text-primary mb-1">$49-$399</p>
              <p className="text-sm text-muted-foreground">Monthly cost</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50">
              <p className="text-3xl font-bold text-foreground mb-1">$2,000+</p>
              <p className="text-sm text-muted-foreground">Avg. website project value</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10">
              <p className="text-3xl font-bold text-primary mb-1">10-40x</p>
              <p className="text-sm text-muted-foreground">ROI per closed deal</p>
            </div>
          </div>
          
          <p className="text-sm text-center text-foreground/70 mt-6">
            One website project you close with OptimizeMySuite pays for 5-40 months of subscription. Most agencies see ROI within their first week.
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            Compare All Features
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border/50 bg-card">
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

      {/* Trust Section */}
      <section className="container pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="p-6 rounded-2xl bg-secondary/30 border border-border/50">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Designed to Be Client-Facing</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Every report, score, and PDF is built to be shared directly with your clients. No technical jargon, no system logs — just professional deliverables that make your agency look good.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="w-4 h-4 text-primary" />
                    Criteria-based scoring you can explain
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="w-4 h-4 text-primary" />
                    Consistent methodology across all audits
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="w-4 h-4 text-primary" />
                    White-label ready out of the box
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scoring Credibility Explainer */}
      <section className="container pb-16">
        <div className="max-w-3xl mx-auto">
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full group">
              <span>How scoring credibility works</span>
              <ChevronDown className="w-4 h-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="bg-muted/30 border border-border/40 rounded-lg p-5 text-left">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  OptimizeMySuite evaluates websites using objective, criteria-based signals across messaging clarity, conversion paths, trust signals, SEO fundamentals, and technical accessibility. The same scoring methodology is applied before and after improvements to ensure fair comparison. Pages that cannot be accessed publicly are marked as Not Scorable rather than penalized. Scores are never guessed or manually adjusted.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-4 pt-3 border-t border-border/30">
                  Built for agencies to justify recommendations with clear, repeatable evidence.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
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
            Talk to our team about enterprise pricing, custom integrations, and dedicated support for high-volume agencies.
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
              <span className="font-semibold text-foreground">OptimizeMySuite</span> — Proof-based website audits for marketing agencies
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
