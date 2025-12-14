import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  Zap, 
  Target, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  MousePointerClick, 
  Palette, 
  Smartphone, 
  Gauge, 
  Search, 
  Shield, 
  Wrench, 
  Sparkles,
  LogIn,
  Check,
  ShieldCheck,
  TrendingUp,
  Users,
  Clock,
  BadgeCheck,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PlanSelectionModal } from "@/components/modals/PlanSelectionModal";
import { HeaderBrand } from "@/components/layout/HeaderBrand";

const featureCards = [
  { icon: MessageSquare, title: "Messaging & Clarity Analysis", description: "Prove whether your client's value proposition actually lands — with objective criteria, not opinions." },
  { icon: MousePointerClick, title: "Conversion & Lead Capture", description: "Identify form friction, CTA failures, and missed conversion opportunities your clients can't argue with." },
  { icon: Palette, title: "Design & UX Assessment", description: "Quantify visual credibility issues that hurt trust and make prospects bounce." },
  { icon: Smartphone, title: "Mobile Experience Audit", description: "Show clients exactly where mobile users are dropping off and why." },
  { icon: Gauge, title: "Speed & Performance", description: "Surface slow assets hurting rankings — with data clients can share with their developers." },
  { icon: Search, title: "SEO & Local Visibility", description: "Assess Google findability with scoring agencies can defend in client meetings." },
  { icon: Shield, title: "Trust & Credibility Signals", description: "Check if reviews, certifications, and guarantees are properly showcased." },
  { icon: Wrench, title: "Technical Foundations", description: "SSL, structured data, and essential technical elements that affect rankings." },
  { icon: Sparkles, title: "Actionable Implementation Pack", description: "Done-for-you copy, layout suggestions, and rebuild prompts your team can execute." },
];

const revenueLevers = [
  { 
    icon: TrendingUp, 
    title: "Close More Deals", 
    description: "Use objective before/after scores to justify website rebuilds. Stop selling on promises — sell on proof.",
    outcome: "Higher close rates on website projects"
  },
  { 
    icon: Target, 
    title: "Defend Your Retainers", 
    description: "Show measurable improvement month-over-month. Give clients a reason to stay beyond 'trust us.'",
    outcome: "Reduced churn on recurring accounts"
  },
  { 
    icon: Users, 
    title: "Scale Without Hiring", 
    description: "Analyze 10-200 websites at once with Batch Mode. Turn prospect lists into qualified leads in minutes.",
    outcome: "More prospects touched per hour"
  },
  { 
    icon: FileText, 
    title: "Look Like a $10K Agency", 
    description: "Export polished, white-label PDF reports your clients will actually share with their teams and boards.",
    outcome: "Premium positioning without premium effort"
  },
];

const trustPoints = [
  "Criteria-based scoring — same methodology applied consistently",
  "No manual adjustments or subjective opinions",
  "Transparent scoring you can explain to clients",
  "NOT SCORABLE states are informational, never punitive",
  "Before/after comparisons prove your work objectively",
];

const plans = [
  { name: "Starter", price: 49, analyses: "25", features: ["25 analyses/month", "White-label PDFs", "10-URL batch mode"], forWho: "Solo consultants testing the waters" },
  { name: "Pro", price: 149, analyses: "150", features: ["150 analyses/month", "Custom branding", "50-URL batch mode", "5 team members"], popular: true, forWho: "Growing agencies scaling client work" },
  { name: "Scale", price: 399, analyses: "500", features: ["500 analyses/month", "Unlimited team", "API access", "Dedicated support"], forWho: "High-volume agencies and white-label resellers" },
];

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPlanModal, setShowPlanModal] = useState(false);

  // If logged in, redirect to dashboard
  if (!isLoading && user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_hsl(221_83%_53%_/_0.15),_transparent)]" />

        <nav className="container relative pt-6 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <HeaderBrand textFallback />
            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/pricing"><Button variant="ghost" size="sm" className="px-2 sm:px-3">Pricing</Button></Link>
              <Link to="/auth"><Button variant="ghost" size="sm" className="px-2 sm:px-3 hidden sm:inline-flex">Login</Button></Link>
              <Button variant="default" size="sm" className="text-xs sm:text-sm px-2 sm:px-4" onClick={() => setShowPlanModal(true)}>
                Start Free Trial
              </Button>
            </div>
          </div>
        </nav>

        <div className="container relative py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6 max-w-full">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">Built for Marketing Agencies & SEO Consultants</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight break-words">
              Stop Selling Promises.{" "}
              <span className="text-gradient">Start Selling Proof.</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
              Generate objective, criteria-based website audits that help you close clients, justify rebuilds, and prove your value with before/after score comparisons.
            </p>
            
            <p className="text-sm sm:text-base text-foreground/70 mb-8 max-w-2xl mx-auto font-medium">
              White-label reports. Batch analysis. Implementation packs. Everything agencies need to win and retain accounts.
            </p>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4 w-full max-w-lg sm:max-w-none mx-auto">
              <Button variant="hero" size="lg" className="gap-2 w-full sm:w-auto sm:min-w-[260px] text-base" onClick={() => setShowPlanModal(true)}>
                Start Your 3-Day Free Trial
                <ArrowRight className="w-5 h-5 flex-shrink-0" />
              </Button>
              <Link to="/pricing" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto sm:min-w-[200px]">
                  See How Agencies Use This
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                One closed client pays for itself
              </span>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Why Agencies Risk Section */}
        <section className="py-16 lg:py-20 border-t border-border/50">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Why Agencies Trust OptimizeMySuite
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Your reputation is on the line with every client report. We built this for agencies who need to look professional, not experimental.
                </p>
              </div>
              
              <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-card">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg mb-2">Scoring You Can Defend in Client Meetings</h3>
                    <p className="text-muted-foreground">
                      Every score is based on transparent, repeatable criteria — not AI guesses or subjective opinions. When clients ask "why did my site score a 67?", you can explain it.
                    </p>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {trustPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <BadgeCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-sm text-foreground/80 italic">
                    "NOT SCORABLE" means we couldn't access the page — it's never a negative judgment. We don't guess when we can't see the content. This protects your credibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Revenue Levers Section */}
        <section className="py-16 lg:py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">This Helps You Make Money</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Every feature is designed to help agencies close deals, retain clients, and scale services.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {revenueLevers.map((lever, index) => {
                const Icon = lever.icon;
                return (
                  <div key={index} className="p-6 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">{lever.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">{lever.description}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" />
                          {lever.outcome}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* What You Get Section */}
        <section className="py-16 lg:py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Comprehensive, Client-Ready Analysis</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                White-labeled insights covering everything that matters — formatted for client presentations, not technical deep-dives.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {featureCards.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="group p-5 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-16 lg:py-20 bg-primary/5">
          <div className="container">
            <div className="text-center mb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Pricing That Pays for Itself</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                One closed website project covers months of OptimizeMySuite. Built for agencies who measure ROI.
              </p>
            </div>
            <p className="text-center text-sm text-foreground/70 mb-8 font-medium">
              Start with a 3-day free trial. No credit card required.
            </p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <div 
                  key={plan.name} 
                  className={`relative p-6 rounded-2xl bg-card border transition-all duration-300 ${
                    plan.popular 
                      ? "border-primary border-2 shadow-xl scale-[1.02] ring-4 ring-primary/10" 
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-md">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-foreground mt-2">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">{plan.forWho}</p>
                  <div className="my-4">
                    <span className={`text-4xl font-bold ${plan.popular ? "text-primary" : ""}`}>${plan.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className={`w-4 h-4 ${plan.popular ? "text-primary" : "text-primary"}`} />{f}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.popular ? "hero" : "outline"} 
                    className={`w-full ${plan.popular ? "shadow-lg" : ""}`} 
                    onClick={() => setShowPlanModal(true)}
                  >
                    Start Free Trial
                  </Button>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/pricing"><Button variant="ghost">View Full Pricing Details →</Button></Link>
            </div>
          </div>
        </section>

        {/* Trial Success Section */}
        <section className="py-16 lg:py-20 border-t border-border/50">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  What Success Looks Like During Your Trial
                </h2>
                <p className="text-muted-foreground">
                  Here's how agencies typically evaluate OptimizeMySuite in their first 3 days:
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Run an audit on a prospect's website</h4>
                    <p className="text-sm text-muted-foreground">See how the scoring works and what the PDF looks like.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Generate an Implementation Pack</h4>
                    <p className="text-sm text-muted-foreground">Get actionable copy and layout recommendations you can actually use.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Export a white-label PDF</h4>
                    <p className="text-sm text-muted-foreground">Send it to a client or use it in a proposal to see how it lands.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">4</div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Decide if it helps you close or retain clients</h4>
                    <p className="text-sm text-muted-foreground">If it does, the subscription pays for itself many times over.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-20 bg-primary/5">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Ready to Prove Your Value?
              </h2>
              <p className="text-muted-foreground text-lg mb-4">
                Join agencies using OptimizeMySuite to close more deals and defend their retainers with objective proof.
              </p>
              <p className="text-sm text-foreground/70 font-medium mb-8">
                One closed website project pays for months of OptimizeMySuite.
              </p>
              <Button variant="hero" size="lg" className="gap-2" onClick={() => setShowPlanModal(true)}>
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">OptimizeMySuite</span> — Proof-based website audits for marketing agencies
            </p>
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Login</Link>
            </div>
          </div>
        </div>
      </footer>

      <PlanSelectionModal open={showPlanModal} onOpenChange={setShowPlanModal} />
    </div>
  );
}
