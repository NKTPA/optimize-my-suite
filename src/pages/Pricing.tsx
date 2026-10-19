import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Sparkles, ArrowRight, Building2, ShieldCheck, TrendingUp, BadgeCheck, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { STRIPE_PRICE_IDS } from "@/lib/entitlements";
import { SEO } from "@/components/SEO";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MarketingNav, MarketingFooter, Section, SectionHeader, PlainCard } from "@/components/marketing/MarketingLayout";
import { CREDIBILITY_BODY } from "@/components/scoring/ScoreCredibilityStatement";

const plans = [
  {
    name: "Starter",
    price: 49,
    priceId: STRIPE_PRICE_IDS.starter,
    description: "For solo consultants testing the waters",
    whoIsFor: "Perfect if you're a freelancer or solo consultant who wants to add website audits to your service offering.",
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
    features: [
      "150 analyses per month",
      "150 implementation packs",
      "Unlimited history",
      "Priority batch mode (50 URLs)",
      "Custom branding on PDFs",
      "Client tagging & organization",
      "Priority email support",
      "Team seats — coming soon",
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
    features: [
      "500 analyses per month",
      "500 implementation packs",
      "Unlimited batch mode",
      "Unlimited history",
      "Custom branding on PDFs",
      "Client tagging & organization",
      "API access — coming soon",
      "Priority email support",
      "Team seats — coming soon",
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
  { feature: "Client tagging", starter: false, pro: true, scale: true },
  { feature: "Team seats", starter: "Coming soon", pro: "Coming soon", scale: "Coming soon" },
  { feature: "API access", starter: false, pro: false, scale: "Coming soon" },
  { feature: "Support", starter: "Email", pro: "Priority email", scale: "Priority email" },
];

const valueProps = [
  {
    icon: TrendingUp,
    title: "Proof You Can Show Clients",
    description: "Objective, repeatable scores give you evidence to justify website projects instead of promises.",
  },
  {
    icon: ShieldCheck,
    title: "Client-Facing by Design",
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
    // First check if we have a user in local state
    if (!user || !session) {
      navigate("/auth?tab=signup");
      return;
    }

    setLoadingPlan(planName);
    try {
      // Verify session is still valid before calling checkout
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        // Session expired - redirect to login
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        navigate("/auth?tab=login");
        return;
      }

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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEO
        title="Pricing — OptimizeMySuite"
        description="Simple pricing for agencies. Generate unlimited white-label website audit reports with objective scoring. Start free."
        canonicalPath="/pricing"
      />
      <MarketingNav auditHref="/#free-audit" onStartFreeTrial={() => navigate("/auth?tab=signup")} />

      <header className="mx-auto max-w-[1200px] px-4 pt-16 pb-4 sm:px-6 md:pt-28">
        <SectionHeader
          as="h1"
          eyebrow="Pricing"
          title="Plans for solo consultants to full agencies."
          description="Choose a plan that matches your agency's volume. Every tier includes the same professional-grade features — just more capacity. Start with a 3-day free trial. No credit card required. Cancel anytime."
        />
      </header>

      <div className="mx-auto max-w-[1200px] px-4 pb-20 sm:px-6 md:pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col rounded-lg bg-card p-6 ${plan.popular ? "border-2 border-primary" : "border border-border"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                {plan.popular && <span className="text-xs font-medium text-primary">Most popular</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="my-6">
                <span className="text-4xl font-semibold tracking-[-0.02em] text-foreground">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </p>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">Who this is for</p>
              <p className="mb-6 text-sm text-foreground">{plan.whoIsFor}</p>
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.priceId, plan.name)}
                  disabled={loadingPlan === plan.name}
                >
                  {loadingPlan === plan.name ? "Loading..." : plan.cta}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">3-day free trial · No credit card required</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Section>
        <SectionHeader eyebrow="Why agencies choose a plan" title="Built for client-facing work." />
        <div className="grid gap-6 md:grid-cols-3">
          {valueProps.map(({ icon: Icon, title, description }) => (
            <PlainCard key={title}>
              <Icon className="mb-4 h-5 w-5 text-primary" />
              <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </PlainCard>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Compare" title="Compare all features." />
        <div className="-mx-4 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="border-b border-foreground text-sm">
                <th className="py-4 pr-4 text-left font-medium text-muted-foreground pl-4 sm:pl-0">Feature</th>
                <th className="px-4 py-4 text-center font-medium text-foreground">Starter</th>
                <th className="px-4 py-4 text-center font-medium text-primary">Pro</th>
                <th className="px-4 py-4 text-center font-medium text-foreground">Scale</th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((row) => (
                <tr key={row.feature} className="border-b border-border text-sm">
                  <td className="py-4 pr-4 pl-4 text-muted-foreground sm:pl-0">{row.feature}</td>
                  {[row.starter, row.pro, row.scale].map((v, i) => (
                    <td key={i} className="px-4 py-4 text-center">
                      {typeof v === "boolean" ? (
                        v ? <Check className="mx-auto h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-foreground">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <PlainCard>
            <ShieldCheck className="mb-4 h-5 w-5 text-primary" />
            <h3 className="mb-2 text-base font-semibold text-foreground">Designed to be client-facing</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Every report, score, and PDF is built to be shared directly with your clients. No technical jargon, no system logs — just professional deliverables that make your agency look good.
            </p>
            <ul className="space-y-2">
              {["Criteria-based scoring you can explain", "Consistent methodology across all audits", "White-label ready out of the box"].map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </PlainCard>
          <PlainCard>
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 text-left text-base font-semibold text-foreground">
                How scoring credibility works
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <p className="text-sm text-muted-foreground">{CREDIBILITY_BODY}</p>
                <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                  Built for agencies to justify recommendations with clear, repeatable evidence.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </PlainCard>
        </div>
      </Section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-24">
          <div className="rounded-lg bg-foreground px-6 py-14 text-background sm:px-12">
            <h2 className="max-w-[620px] text-3xl md:text-[40px] leading-[1.1] font-semibold tracking-[-0.02em]">
              Need a custom solution?
            </h2>
            <p className="mt-4 max-w-[620px] text-lg text-background/70">
              Talk to us about high-volume or white-label reseller needs.
            </p>
            <Button asChild size="lg" className="mt-8 bg-background text-foreground hover:bg-background/90">
              <a href="mailto:support@optimizemysuite.com?subject=Demo%20request%20%E2%80%94%20OptimizeMySuite">
                Book a demo <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
