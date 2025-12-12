import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Globe, ArrowRight, Zap, Target, TrendingUp, Layers, AlertCircle, LayoutTemplate, Sparkles, CheckCircle2, Shield, Smartphone, Palette, Search, MousePointerClick, Gauge, MessageSquare, Wrench, Clock, LogIn, LogOut, User, Play, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "@/components/LoadingState";
import { AnalysisResults } from "@/components/AnalysisResults";
import { BlueprintForm } from "@/components/BlueprintForm";
import { BlueprintDisplay } from "@/components/BlueprintDisplay";
import { AnalysisResult } from "@/types/analysis";
import { BlueprintFormData, WebsiteBlueprint } from "@/types/blueprint";
import { HistoryItem } from "@/types/history";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { useAuth } from "@/hooks/use-auth";

const featureCards = [
  {
    icon: MessageSquare,
    title: "Client Messaging & Positioning",
    description: "Analyze if your client's value proposition and local targeting are clear.",
  },
  {
    icon: MousePointerClick,
    title: "Conversion & Lead Capture",
    description: "Identify form issues, CTA problems, and missed conversion opportunities.",
  },
  {
    icon: Palette,
    title: "Design & User Experience",
    description: "Evaluate visual credibility and professional appearance.",
  },
  {
    icon: Smartphone,
    title: "Mobile Performance",
    description: "Check if the site works flawlessly on phones and tablets.",
  },
  {
    icon: Gauge,
    title: "Speed & Performance",
    description: "Find slow assets hurting search rankings and conversions.",
  },
  {
    icon: Search,
    title: "Client Visibility & Local SEO",
    description: "Assess Google findability when customers search locally.",
  },
  {
    icon: Shield,
    title: "Trust & Credibility Signals",
    description: "Check if reviews, certifications, and guarantees are showcased.",
  },
  {
    icon: Wrench,
    title: "Technical Foundations",
    description: "SSL, favicon, and essential technical elements.",
  },
  {
    icon: Sparkles,
    title: "AI-Generated Recommendations",
    description: "Done-for-you copy and layout suggestions your team can implement.",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Win More Retainers",
    description: "Impress prospects with instant, professional audits that showcase your expertise.",
  },
  {
    icon: Target,
    title: "Scale Client Services",
    description: "Analyze 10-200 websites at once with Batch Mode. No more manual audits.",
  },
  {
    icon: FileText,
    title: "White-Label Reports",
    description: "Export polished PDF reports your clients will love to share with their teams.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Proposals",
    description: "Use concrete scores and findings to justify higher-value engagements.",
  },
];

// Logged-out marketing landing page
const MarketingLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_hsl(221_83%_53%_/_0.15),_transparent)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_hsl(199_89%_48%_/_0.08),_transparent_70%)]" />

        {/* Navigation */}
        <nav className="container relative pt-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold text-foreground">
              Optimize My <span className="text-gradient">Biz</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button variant="default" size="sm">
                  Create Agency Account
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <div className="container relative py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Website Audits for Agencies
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight leading-tight">
              Give Your Agency an{" "}
              <span className="text-gradient">AI-Powered</span>{" "}
              Website Audit Assistant
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Audit client websites, spot conversion leaks, and generate implementation plans in minutes — built for agencies serving local home-service businesses.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?tab=signup">
                <Button variant="hero" size="lg" className="gap-2 min-w-[220px]">
                  Create Agency Account
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="gap-2 min-w-[160px]">
                  <LogIn className="w-5 h-5" />
                  Login
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Built for agencies serving HVAC, plumbing, electrical, dental, med spas, and other local-service industries.
            </p>
          </div>
        </div>
      </header>

      {/* Benefits Section */}
      <section className="py-16 lg:py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Why Agencies Choose Us</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to deliver higher-impact results with less manual work.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">What Your Agency Gains</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Generate done-for-you analysis reports your clients will love — covering everything that matters.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featureCards.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="group relative p-5 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 opacity-0 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-primary/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
              Ready to Scale Your Client Services?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join agencies using Optimize My Biz to win more retainers and deliver better results.
            </p>
            <Link to="/auth?tab=signup">
              <Button variant="hero" size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Optimize My Biz</span> — Website audits & optimization for marketing agencies
            </p>
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <Link to="/auth?tab=signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Logged-in app dashboard
const AppDashboard = () => {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const { addAnalysis } = useHistory();
  const [url, setUrl] = useState("");
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  // Blueprint state
  const [blueprint, setBlueprint] = useState<WebsiteBlueprint | null>(null);
  const [blueprintBusinessName, setBlueprintBusinessName] = useState("");
  const [blueprintPhone, setBlueprintPhone] = useState("");
  const [blueprintEmail, setBlueprintEmail] = useState("");
  const [blueprintIndustry, setBlueprintIndustry] = useState("");
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);
  const [blueprintError, setBlueprintError] = useState("");
  const { toast } = useToast();

  // Load from history if navigating from History page
  useEffect(() => {
    const state = location.state as { historyItem?: HistoryItem } | null;
    if (state?.historyItem) {
      const item = state.historyItem;
      setAnalyzedUrl(item.url);
      if (item.type === "analysis" && item.analysisResult) {
        setResults(item.analysisResult);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const isValidUrl = (string: string) => {
    try {
      let testUrl = string;
      if (!testUrl.startsWith("http://") && !testUrl.startsWith("https://")) {
        testUrl = "https://" + testUrl;
      }
      new URL(testUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "Please enter a URL",
        description: "Enter the client website URL you want to analyze.",
        variant: "destructive",
      });
      return;
    }
    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL (e.g., clientsite.com).",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setResults(null);
    setBlueprint(null);
    setBlueprintError("");
    try {
      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = "https://" + formattedUrl;
      }
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-website`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          url: formattedUrl,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze website");
      }
      const data = await response.json();
      setResults(data);
      setAnalyzedUrl(formattedUrl);
      if (user) {
        addAnalysis(formattedUrl, data);
      }
      toast({
        title: "Analysis Complete",
        description: "Client website analysis is ready. Scroll down to see the results.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBlueprint = async (formData: BlueprintFormData) => {
    setIsGeneratingBlueprint(true);
    setBlueprintError("");
    setBlueprint(null);
    setResults(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-website-blueprint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate blueprint");
      }
      const data = await response.json();
      setBlueprint(data);
      setBlueprintBusinessName(formData.businessName);
      setBlueprintPhone(formData.mainPhone || "");
      setBlueprintEmail(formData.contactEmail || "");
      setBlueprintIndustry(formData.industry || "");
      toast({
        title: "Blueprint Generated",
        description: "Client website blueprint is ready. Scroll down to see it.",
      });
    } catch (error) {
      console.error("Blueprint generation error:", error);
      setBlueprintError(error instanceof Error ? error.message : "Failed to generate blueprint");
      toast({
        title: "Blueprint Generation Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };

  const handleReset = () => {
    setUrl("");
    setAnalyzedUrl("");
    setResults(null);
    setBlueprint(null);
    setBlueprintBusinessName("");
    setBlueprintPhone("");
    setBlueprintEmail("");
    setBlueprintIndustry("");
    setBlueprintError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      urlInputRef.current?.focus();
    }, 100);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out of your account.",
    });
  };

  useEffect(() => {
    if (!results && !blueprint) {
      urlInputRef.current?.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_hsl(221_83%_53%_/_0.15),_transparent)]" />

        {/* Navigation */}
        <nav className="container relative pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-xl font-bold text-foreground">
                Optimize My <span className="text-gradient">Biz</span>
              </Link>
              {profile && (
                <span className="hidden sm:inline text-sm text-muted-foreground border-l border-border pl-3">
                  {profile.agency_name || `${profile.first_name}'s Agency`}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Link to="/history">
                <Button variant="outline" size="sm" className="gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Client History</span>
                </Button>
              </Link>
              <Link to="/batch">
                <Button variant="outline" size="sm" className="gap-2">
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Batch Mode</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </nav>

        <div className="container relative py-12 lg:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Run New Client Analysis
            </h1>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Enter a client's website URL to generate a comprehensive audit report with actionable recommendations.
            </p>

            {blueprintError && (
              <Alert variant="destructive" className="max-w-xl mx-auto mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{blueprintError}</AlertDescription>
              </Alert>
            )}

            {/* URL Input Form */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-info/20 to-accent/20 rounded-3xl blur-xl opacity-60" />
              
              <div className="relative bg-card rounded-2xl border border-border/50 p-6 sm:p-8 shadow-xl max-w-xl mx-auto backdrop-blur-sm">
                <label htmlFor="website-url" className="block text-sm font-semibold text-foreground mb-4 text-left">
                  Client Website URL
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      ref={urlInputRef}
                      id="website-url"
                      type="text"
                      placeholder="clientwebsite.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !isLoading && handleAnalyze()}
                      className="pl-12 h-12 text-base rounded-xl border-border/60 focus:border-primary/50 transition-colors"
                      disabled={isLoading || isGeneratingBlueprint}
                    />
                  </div>
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={handleAnalyze}
                    disabled={isLoading || isGeneratingBlueprint}
                    className="w-full sm:w-auto min-w-[180px]"
                  >
                    {isLoading ? "Analyzing..." : "Run Client Analysis"}
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>

                {/* Blueprint Form Button */}
                <BlueprintForm onSubmit={handleGenerateBlueprint} isLoading={isGeneratingBlueprint} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Results Section */}
      <main className="container py-12 lg:py-16">
        {isLoading && <LoadingState />}

        {isGeneratingBlueprint && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="relative inline-flex">
              <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-secondary border-t-primary" />
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mt-6">Generating client website blueprint...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take 30-60 seconds</p>
          </div>
        )}

        {results && !isLoading && <AnalysisResults results={results} url={analyzedUrl} onReset={handleReset} />}

        {blueprint && !isGeneratingBlueprint && (
          <>
            <div className="max-w-4xl mx-auto mb-10 flex justify-center">
              <Button
                variant="hero"
                size="lg"
                className="gap-2"
                onClick={() => {
                  navigate("/preview", {
                    state: {
                      blueprint,
                      businessName: blueprintBusinessName,
                      phone: blueprintPhone,
                      email: blueprintEmail,
                      industry: blueprintIndustry,
                    },
                  });
                }}
              >
                <LayoutTemplate className="w-5 h-5" />
                Build Website Layout from Blueprint
              </Button>
            </div>
            <BlueprintDisplay blueprint={blueprint} businessName={blueprintBusinessName} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-8">
        <div className="container">
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-semibold text-foreground">Optimize My Biz</span> — Website audits & optimization for marketing agencies
          </p>
        </div>
      </footer>
    </div>
  );
};

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-secondary border-t-primary" />
      </div>
    );
  }

  // Show marketing page for logged-out users, app dashboard for logged-in users
  return user ? <AppDashboard /> : <MarketingLanding />;
};

export default Index;
