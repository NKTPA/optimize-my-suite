import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowRight, 
  RefreshCw,
  Target, 
  FileText, 
  MessageSquare, 
  MousePointerClick, 
  Palette, 
  Smartphone, 
  Gauge, 
  Search, 
  Shield, 
  Wrench, 
  Sparkles,
  Check,
  ShieldCheck,
  TrendingUp,
  Users,
  BadgeCheck,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PlanSelectionModal } from "@/components/modals/PlanSelectionModal";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import { SEO } from "@/components/SEO";
import { HomepageAuditWidget } from "@/components/marketing/HomepageAuditWidget";
import { MobileNavSheet } from "@/components/marketing/MobileNavSheet";

// FAQ Item component with accordion behavior
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left bg-card hover:bg-muted/30 transition-colors"
      >
        <span className="font-medium text-foreground pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 bg-card">
          <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

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
  { name: "Pro", price: 149, analyses: "150", features: ["150 analyses/month", "Custom branding", "50-URL batch mode", "Client tagging & organization", "Team seats — coming soon"], popular: true, forWho: "Growing agencies scaling client work" },
  { name: "Scale", price: 399, analyses: "500", features: ["500 analyses/month", "Unlimited batch mode", "API access — coming soon", "Priority email support", "Team seats — coming soon"], forWho: "High-volume agencies and white-label resellers" },
];


const SAMPLE_CATEGORIES = [
  { name: "Messaging & Clarity", score: 71 },
  { name: "Conversion & Lead Capture", score: 48 },
  { name: "Design & UX", score: 66 },
  { name: "Mobile Experience", score: 74 },
  { name: "Performance", score: 42 },
  { name: "SEO Fundamentals", score: 69 },
  { name: "Trust & Credibility", score: 58 },
];

function SampleAuditCard() {
  return (
    <figure className="min-w-0 rounded-lg border border-border bg-card p-6 shadow-card-elevated">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">Sample audit</p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">acme-dental.com</p>
        </div>
        <p className="shrink-0 text-right">
          <span className="text-4xl font-semibold tracking-[-0.02em] text-foreground">62</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </p>
      </div>
      <ul className="mt-5 space-y-4">
        {SAMPLE_CATEGORIES.map((c) => {
          const low = c.score < 50;
          return (
            <li key={c.name}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-foreground">{c.name}</span>
                <span className={`tabular-nums font-medium ${low ? "text-warning" : "text-foreground"}`}>{c.score}</span>
              </div>
              <div className="h-1 w-full rounded-full bg-secondary">
                <div className={`h-1 rounded-full ${low ? "bg-warning" : "bg-primary"}`} style={{ width: `${c.score}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <figcaption className="mt-5 text-xs text-muted-foreground">Sample data.</figcaption>
    </figure>
  );
}

export default function Index() {
  const currentYear = new Date().getFullYear();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  // Prevent flash of landing page while redirecting
  if (!isLoading && user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Top navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
          <HeaderBrand textFallback />
          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/pricing" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <a href="/sample-audit-report.pdf" target="_blank" rel="noopener noreferrer" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm">Sample report</Button>
            </a>
            <Link to="/auth" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <a href="#free-audit">
              <Button size="sm" className="px-2.5 text-xs sm:px-4 sm:text-sm">Run a free audit</Button>
            </a>
            <MobileNavSheet onStartFreeTrial={() => setShowPlanModal(true)} />
          </div>
        </div>
      </nav>

      <SEO
        title="OptimizeMySuite — White-Label Website Audit Tool for Agencies"
        description="Generate white-label website audit reports with objective, repeatable scoring. Built for marketing agencies, SEO consultants, and web design firms."
        canonicalPath="/"
        schema={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "OptimizeMySuite",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          offers: {
            "@type": "Offer",
            price: "49",
            priceCurrency: "USD",
          },
        }}
      />

      {/* Hero */}
      <header className="bg-background">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-4 pt-16 pb-16 sm:px-6 md:pt-28 md:pb-20 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-16">
          <div className="min-w-0">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
              White-label website audits for agencies &amp; consultants
            </p>
            <h1 className="mb-6 text-4xl sm:text-5xl md:text-6xl leading-[1.05] font-semibold tracking-[-0.02em] text-foreground">
              Show clients exactly what their website is costing them.
            </h1>
            <p className="mb-8 max-w-[560px] text-lg text-muted-foreground">
              Objective scores across 7 categories, powered by real Google data. Agencies white-label the report and close clients with before/after proof.
            </p>

            <div className="max-w-[600px]">
              <HomepageAuditWidget compact />
            </div>

            <div className="mt-5 flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
              <a
                href="/sample-audit-report.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline underline-offset-4"
              >
                See a sample report →
              </a>
              <button
                type="button"
                onClick={() => setShowPlanModal(true)}
                className="text-left font-medium text-primary hover:underline underline-offset-4"
              >
                Start a 3-day free trial
              </button>
            </div>
          </div>

          <SampleAuditCard />
        </div>
      </header>

      <main>
        {/* Built to Justify Your Recommendations */}
        <section className="py-16 lg:py-20 border-t border-border/50 bg-secondary/20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Stop Selling Promises. Start Selling Proof.
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Every score is backed by something clients can verify — not opinion dressed as analysis.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
              <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-card">
                <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Deterministic scoring</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Same site, same score, every run. Binary facts are parsed from the DOM, never guessed by AI.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-card">
                <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                  <Gauge className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Real Google data</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Performance is measured via Google PageSpeed Insights (median of 3 runs), the same data Google uses in ranking.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-card">
                <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">Evidence-gated AI</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Every subjective judgment must cite verbatim page text or it's discarded before scoring.
                </p>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/sample-audit-report.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <FileText className="w-4 h-4" />
                  See a real report
                </Button>
              </a>
            </div>
          </div>
        </section>

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
        <section id="revenue" className="py-16 lg:py-20 bg-secondary/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">How Agencies Turn Audits Into Revenue</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Every feature is designed to help agencies close deals, retain clients, and scale services.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {revenueLevers.map((lever, index) => {
                const Icon = lever.icon;
                return (
                  <div key={index} className="p-6 rounded-2xl bg-card border border-border/50 border-l-[3px] border-l-primary/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
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
        <section id="features" className="py-16 lg:py-20">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Comprehensive, Client-Ready Analysis</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                White-labeled insights covering everything that matters — formatted for client presentations, not technical deep-dives.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {featureCards.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="group relative p-4 rounded-xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-primary before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm mb-0.5">{item.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
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
                      ? "border-primary border-2 shadow-xl md:scale-[1.02] ring-4 ring-primary/10" 
                      : "border-border/50 hover:border-primary/30 hover:shadow-md"
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
                        <Check className={`w-4 h-4 ${plan.popular ? "text-primary" : "text-emerald-500"}`} />{f}
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
              
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[19px] top-[52px] bottom-[52px] w-px bg-border" />
                
                <div className="space-y-4 relative">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0 relative z-10">1</div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Run an audit on a prospect's website</h4>
                      <p className="text-sm text-muted-foreground">See how the scoring works and what the PDF looks like.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0 relative z-10">2</div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Generate an Implementation Pack</h4>
                      <p className="text-sm text-muted-foreground">Get actionable copy and layout recommendations you can actually use.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0 relative z-10">3</div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Export a white-label PDF</h4>
                      <p className="text-sm text-muted-foreground">Send it to a client or use it in a proposal to see how it lands.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0 relative z-10">4</div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Decide if it helps you close or retain clients</h4>
                      <p className="text-sm text-muted-foreground">If it does, the subscription pays for itself many times over.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 lg:py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Common Questions From Agencies
                </h2>
              </div>
              
              <div className="space-y-3">
                <FaqItem 
                  question="How is this different from running a Lighthouse audit?"
                  answer="Lighthouse checks technical performance. OptimizeMySuite evaluates what actually wins clients: messaging clarity, conversion elements, trust signals, mobile UX, and design credibility — all scored with criteria you can explain in a client meeting."
                />
                <FaqItem 
                  question="What does the white-label PDF look like?"
                  answer="A polished, branded report with your logo, your colors, and your agency name. Clients see your brand, not ours. It includes scores, specific findings, and prioritized recommendations."
                />
                <FaqItem 
                  question="Can I try it before committing?"
                  answer="Yes. Every plan starts with a 3-day free trial. Run audits, generate PDFs, test batch mode — no credit card required."
                />
                <FaqItem 
                  question="How does the scoring work?"
                  answer="Every score is based on transparent, repeatable criteria — not AI opinions. We check for specific elements (like whether a CTA exists above the fold, whether trust signals are present, whether mobile tap targets are sized correctly) and score based on what we find. If we can't access something, it's marked NOT SCORABLE rather than penalized."
                />
                <FaqItem 
                  question="Can my team use this too?"
                  answer="Team seats are coming soon on Pro and Scale. Today each subscription is single-user — one login per workspace. We'll email existing subscribers when invites go live."
                />
                <FaqItem 
                  question="What if I need more analyses than my plan allows?"
                  answer="You can upgrade anytime. Overages are handled gracefully — we'll let you know when you're approaching your limit so there are no surprises."
                />
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
                Use OptimizeMySuite to back your recommendations and retainers with objective proof.
              </p>
              <p className="text-sm text-foreground/70 font-medium mb-8">
                One closed website project pays for months of OptimizeMySuite.
              </p>
              <Button variant="hero" size="lg" className="gap-2 shadow-hero-button" onClick={() => setShowPlanModal(true)}>
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand column */}
            <div>
              <p className="font-semibold text-foreground text-lg mb-2">OptimizeMySuite</p>
              <p className="text-sm text-muted-foreground mb-4">
                Website audit tool for agencies. White-label website reports. Agency SEO audit tool.
              </p>
              <p className="text-xs text-muted-foreground">
                © {currentYear} OptimizeMySuite
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Made by{" "}
                <a
                  href="https://vibingsolutions.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors underline-offset-2 hover:underline"
                >
                  VibingSolutions.ai
                </a>
              </p>
            </div>
            
            {/* Product column */}
            <div>
              <p className="font-semibold text-foreground text-sm mb-4">Product</p>
              <ul className="space-y-2">
                <li>
                  <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#revenue" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    For Agencies
                  </a>
                </li>
                <li>
                  <a 
                    href="/sample-audit-report.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sample Report
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Support column */}
            <div>
              <p className="font-semibold text-foreground text-sm mb-4">Support</p>
              <ul className="space-y-2">
                <li>
                  <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@optimizemysuite.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contact Support
                  </a>
                </li>
                <li>
                  <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Company column */}
            <div>
              <p className="font-semibold text-foreground text-sm mb-4">Company</p>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://vibingsolutions.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Built by VibingSolutions.ai
                  </a>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom bar with additional trust signal */}
          <div className="mt-8 pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>Built for marketing agencies, SEO consultants, and web design firms.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                256-bit SSL
              </span>
              <span className="flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" />
                GDPR Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>

      <PlanSelectionModal open={showPlanModal} onOpenChange={setShowPlanModal} />
    </div>
  );
}
