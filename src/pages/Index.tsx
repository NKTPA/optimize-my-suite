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
import { SEO } from "@/components/SEO";
import { HomepageAuditWidget } from "@/components/marketing/HomepageAuditWidget";
import { MarketingNav, MarketingFooter, Section, SectionHeader, PlainCard } from "@/components/marketing/MarketingLayout";

// FAQ Item component with accordion behavior
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-medium text-foreground">{question}</span>
        <ChevronDown className={`h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <p className="pb-5 pr-9 text-sm text-muted-foreground">{answer}</p>}
    </div>
  );
}

const faqs = [
  { q: "How is this different from running a Lighthouse audit?", a: "Lighthouse checks technical performance. OptimizeMySuite evaluates what actually wins clients: messaging clarity, conversion elements, trust signals, mobile UX, and design credibility — all scored with criteria you can explain in a client meeting." },
  { q: "What does the white-label PDF look like?", a: "A polished, branded report with your logo, your colors, and your agency name. Clients see your brand, not ours. It includes scores, specific findings, and prioritized recommendations." },
  { q: "Can I try it before committing?", a: "Yes. Every plan starts with a 3-day free trial. Run audits, generate PDFs, test batch mode — no credit card required." },
  { q: "How does the scoring work?", a: "Every score is based on transparent, repeatable criteria — not AI opinions. We check for specific elements (like whether a CTA exists above the fold, whether trust signals are present, whether mobile tap targets are sized correctly) and score based on what we find. If we can't access something, it's marked NOT SCORABLE rather than penalized." },
  { q: "Can my team use this too?", a: "Team seats are coming soon on Pro and Scale. Today each subscription is single-user — one login per workspace. We'll email existing subscribers when invites go live." },
  { q: "What if I need more analyses than my plan allows?", a: "You can upgrade anytime. Overages are handled gracefully — we'll let you know when you're approaching your limit so there are no surprises." },
];

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
      <MarketingNav auditHref="#free-audit" onStartFreeTrial={() => setShowPlanModal(true)} />

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
        <Section>
          <SectionHeader
            eyebrow="Why it works"
            title="Stop selling promises. Start selling proof."
            description="Every score is backed by something clients can verify — not opinion dressed as analysis."
          />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: RefreshCw, title: "Deterministic scoring", body: "Same site, same score, every run. Binary facts are parsed from the DOM, never guessed by AI." },
              { icon: Gauge, title: "Real Google data", body: "Performance is measured via Google PageSpeed Insights (median of 3 runs), the same data Google uses in ranking." },
              { icon: ShieldCheck, title: "Evidence-gated AI", body: "Every subjective judgment must cite verbatim page text or it's discarded before scoring." },
            ].map(({ icon: Icon, title, body }) => (
              <PlainCard key={title}>
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </PlainCard>
            ))}
          </div>
          <a
            href="/sample-audit-report.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            See a real report →
          </a>
        </Section>

        <Section>
          <SectionHeader
            eyebrow="Built for agencies"
            title="What makes the report client-ready."
            description="Your reputation is on the line with every client report. We built this for agencies who need to look professional, not experimental."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <PlainCard>
              <ShieldCheck className="mb-4 h-5 w-5 text-primary" />
              <h3 className="mb-2 text-base font-semibold text-foreground">Scoring you can defend in client meetings</h3>
              <p className="text-sm text-muted-foreground">
                Every score is based on transparent, repeatable criteria — not AI guesses or subjective opinions. When clients ask "why did my site score a 67?", you can explain it.
              </p>
              <p className="mt-6 border-t border-border pt-6 text-sm text-muted-foreground">
                "NOT SCORABLE" means we couldn't access the page — it's never a negative judgment. We don't guess when we can't see the content. This protects your credibility.
              </p>
            </PlainCard>
            <PlainCard>
              <ul className="space-y-4">
                {trustPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </PlainCard>
          </div>
        </Section>

        <Section id="revenue">
          <SectionHeader
            eyebrow="How it works"
            title="From URL to signed project in three steps."
            description="Every feature is designed to help agencies close deals, retain clients, and scale services."
          />
          <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              { n: "01", title: "Audit the site", body: "Paste a prospect's or client's URL — or up to hundreds at once with Batch Mode. Get objective scores across 7 categories." },
              { n: "02", title: "Show the gaps", body: "Use the scores and the Implementation Pack to justify the rebuild with proof instead of promises." },
              { n: "03", title: "Send your report", body: "Export a polished, white-label PDF under your agency's name, then re-run later to show before/after improvement." },
            ].map((s) => (
              <li key={s.n} className="border-t-2 border-foreground pt-5">
                <p className="mb-3 text-sm font-semibold text-primary tabular-nums">{s.n}</p>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="features">
          <SectionHeader
            eyebrow="What's scored"
            title="Seven categories, scored the same way every time."
            description="White-labeled insights covering everything that matters — formatted for client presentations, not technical deep-dives."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, description }) => (
              <PlainCard key={title}>
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </PlainCard>
            ))}
          </div>
        </Section>

        <Section id="pricing">
          <SectionHeader
            eyebrow="Pricing"
            title="Plans for solo consultants to full agencies."
            description="Start with a 3-day free trial. No credit card required."
          />
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
                <p className="mt-1 text-sm text-muted-foreground">{plan.forWho}</p>
                <p className="my-6">
                  <span className="text-4xl font-semibold tracking-[-0.02em] text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </p>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="mt-auto w-full"
                  onClick={() => setShowPlanModal(true)}
                >
                  Start Free Trial
                </Button>
              </div>
            ))}
          </div>
          <Link to="/pricing" className="mt-8 inline-flex text-sm font-medium text-primary hover:underline underline-offset-4">
            View full pricing details →
          </Link>
        </Section>

        <Section>
          <SectionHeader
            eyebrow="Your trial"
            title="What success looks like during your trial."
            description="Here's how to evaluate OptimizeMySuite in your first 3 days:"
          />
          <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {[
              { title: "Run an audit on a prospect's website", body: "See how the scoring works and what the PDF looks like." },
              { title: "Generate an Implementation Pack", body: "Get actionable copy and layout recommendations you can actually use." },
              { title: "Export a white-label PDF", body: "Send it to a client or use it in a proposal to see how it lands." },
              { title: "Decide if it helps you close or retain clients", body: "If it does, the subscription pays for itself many times over." },
            ].map((s, i) => (
              <li key={s.title} className="border-t border-border pt-5">
                <p className="mb-3 text-sm font-semibold text-primary tabular-nums">0{i + 1}</p>
                <h3 className="mb-2 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="faq">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <SectionHeader eyebrow="FAQ" title="Common questions." />
            <div className="border-t border-border">
              {faqs.map((f) => (
                <FaqItem key={f.q} question={f.q} answer={f.a} />
              ))}
            </div>
          </div>
        </Section>

        <section className="border-t border-border">
          <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6 md:py-24">
            <div className="rounded-lg bg-foreground px-6 py-14 text-background sm:px-12">
              <h2 className="max-w-[620px] text-3xl md:text-[40px] leading-[1.1] font-semibold tracking-[-0.02em]">
                Run your first audit in a few minutes.
              </h2>
              <p className="mt-4 max-w-[620px] text-lg text-background/70">
                Use OptimizeMySuite to back your recommendations and retainers with objective proof.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <a href="#free-audit">
                  <Button size="lg" className="w-full bg-background text-foreground hover:bg-background/90 sm:w-auto">
                    Run a free audit
                  </Button>
                </a>
                <Link to="/pricing" className="text-sm font-medium text-background hover:underline underline-offset-4">
                  See pricing →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />

      <PlanSelectionModal open={showPlanModal} onOpenChange={setShowPlanModal} />
    </div>
  );
}
