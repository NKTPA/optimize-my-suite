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
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PlanSelectionModal } from "@/components/modals/PlanSelectionModal";

const featureCards = [
  { icon: MessageSquare, title: "Client Messaging Analysis", description: "Evaluate if your client's value proposition and local targeting are clear and compelling." },
  { icon: MousePointerClick, title: "Conversion & Lead Capture", description: "Identify form issues, CTA problems, and missed conversion opportunities." },
  { icon: Palette, title: "Design & User Experience", description: "Evaluate visual credibility and professional appearance." },
  { icon: Smartphone, title: "Mobile Performance", description: "Check if the site works flawlessly on phones and tablets." },
  { icon: Gauge, title: "Speed & Performance", description: "Find slow assets hurting search rankings and conversions." },
  { icon: Search, title: "SEO & Local Visibility", description: "Assess Google findability when customers search locally." },
  { icon: Shield, title: "Trust & Credibility", description: "Check if reviews, certifications, and guarantees are showcased." },
  { icon: Wrench, title: "Technical Foundations", description: "SSL, favicon, and essential technical elements." },
  { icon: Sparkles, title: "AI Recommendations", description: "Done-for-you copy and layout suggestions your team can implement." },
];

const benefits = [
  { icon: Zap, title: "Win More Retainers", description: "Impress prospects with instant, professional audits that showcase your expertise." },
  { icon: Target, title: "Scale Client Services", description: "Analyze 10-200 websites at once with Batch Mode. No more manual audits." },
  { icon: FileText, title: "White-Label Reports", description: "Export polished PDF reports your clients will love to share with their teams." },
  { icon: BarChart3, title: "Data-Driven Proposals", description: "Use concrete scores and findings to justify higher-value engagements." },
];

const plans = [
  { name: "Starter", price: 49, analyses: "25", features: ["25 analyses/month", "White-label PDFs", "10-URL batch mode"] },
  { name: "Pro", price: 149, analyses: "150", features: ["150 analyses/month", "Custom branding", "50-URL batch mode", "5 team members"], popular: true },
  { name: "Scale", price: 399, analyses: "500", features: ["500 analyses/month", "Unlimited team", "API access", "Dedicated support"] },
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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_hsl(221_83%_53%_/_0.15),_transparent)]" />

        <nav className="container relative pt-6">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-foreground">
              Optimize My <span className="text-gradient">Biz</span>
            </span>
            <div className="flex items-center gap-2">
              <Link to="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
              <Link to="/auth"><Button variant="ghost" size="sm">Login</Button></Link>
              <Button variant="default" size="sm" onClick={() => setShowPlanModal(true)}>
                Start Free Trial
              </Button>
            </div>
          </div>
        </nav>

        <div className="container relative py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Your Agency's Automated Website Analysis Engine
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight">
              Scale Your Agency With{" "}
              <span className="text-gradient">AI-Powered</span>{" "}
              Website Audits
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Generate client-ready reports in minutes. Perfect for SEO agencies, marketing firms, and web designers serving local businesses.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" className="gap-2 min-w-[220px]" onClick={() => setShowPlanModal(true)}>
                Start 3-Day Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="gap-2 min-w-[160px]">
                  <LogIn className="w-5 h-5" />
                  Login
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </header>

      {/* Benefits */}
      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Why Agencies Choose Us</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Deliver premium client reports instantly. Scale your web audits without hiring.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="p-6 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4"><Icon className="w-6 h-6" /></div>
                  <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Comprehensive Website Analysis</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              White-labeled insights covering everything that matters for your clients.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {featureCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="group p-5 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Icon className="w-5 h-5" /></div>
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
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Start with a 3-day free trial. No credit card required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`p-6 rounded-2xl bg-card border ${plan.popular ? "border-primary shadow-lg" : "border-border/50"}`}>
                {plan.popular && <div className="text-xs font-medium text-primary mb-2">Most Popular</div>}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <div className="my-4"><span className="text-3xl font-bold">${plan.price}</span><span className="text-muted-foreground">/mo</span></div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary" />{f}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.popular ? "default" : "outline"} className="w-full" onClick={() => setShowPlanModal(true)}>
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

      {/* CTA */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready to Scale Your Agency?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join agencies using Optimize My Biz to win more retainers and deliver better client results.
            </p>
            <Button variant="hero" size="lg" className="gap-2" onClick={() => setShowPlanModal(true)}>
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Optimize My Biz</span> — Your agency's automated website analysis engine
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
