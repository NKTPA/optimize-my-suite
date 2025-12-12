import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Globe, ArrowRight, Zap, Target, TrendingUp, Layers, AlertCircle, LayoutTemplate, Sparkles, CheckCircle2, Shield, Smartphone, Palette, Search, MousePointerClick, Gauge, MessageSquare, Wrench, Clock, LogIn, LogOut, User } from "lucide-react";
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
    title: "Messaging & Clarity",
    description: "Is it clear what your client does and where they operate?",
  },
  {
    icon: MousePointerClick,
    title: "Lead Capture",
    description: "Are visitors easily able to contact your client's business?",
  },
  {
    icon: Palette,
    title: "Design & UX",
    description: "Does the site look professional and build trust?",
  },
  {
    icon: Smartphone,
    title: "Mobile Experience",
    description: "Does the site work flawlessly on phones and tablets?",
  },
  {
    icon: Gauge,
    title: "Page Speed",
    description: "Are slow assets hurting search rankings and conversions?",
  },
  {
    icon: Search,
    title: "SEO & Local SEO",
    description: "Can Google find your client when customers search locally?",
  },
  {
    icon: Shield,
    title: "Trust Signals",
    description: "Are reviews, certifications, and guarantees showcased?",
  },
  {
    icon: Wrench,
    title: "Technical Basics",
    description: "SSL, favicon, and essential technical elements.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Done-for-you copy and layout recommendations ready to implement.",
  },
];

const Index = () => {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
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
      // Clear the state to prevent re-loading on refresh
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
      // Save to history if logged in
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

  // Reset handler to start a new analysis
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

  // Auto-focus URL input on mount if no analysis exists
  useEffect(() => {
    if (!results && !blueprint) {
      urlInputRef.current?.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_hsl(221_83%_53%_/_0.15),_transparent)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_hsl(199_89%_48%_/_0.08),_transparent_70%)]" />

        {/* Navigation */}
        <nav className="container relative pt-6">
          <div className="flex items-center justify-between">
            {/* User info */}
            <div className="flex items-center gap-3">
              {user && profile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{profile.agency_name || profile.first_name}</span>
                </div>
              )}
            </div>
            
            {/* Nav buttons */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
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
                </>
              ) : (
                <>
                  <Link to="/batch">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Layers className="w-4 h-4" />
                      <span className="hidden sm:inline">Batch Mode</span>
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="gap-2">
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">Login</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <div className="container relative py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
                Optimize My <span className="text-gradient">Biz</span>
              </h1>
            </Link>

            <p className="text-lg lg:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
              Website Audits & Optimization Packs for Marketing Agencies
            </p>
            
            <p className="text-base text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Analyze client websites instantly with AI-powered insights built for digital agencies.{" "}
              <strong className="text-foreground font-semibold">Win more retainers. Deliver higher-impact results. Scale your client services.</strong>
            </p>

            {/* Blueprint Error Banner */}
            {blueprintError && (
              <Alert variant="destructive" className="max-w-xl mx-auto mb-8">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{blueprintError}</AlertDescription>
              </Alert>
            )}

            {/* URL Input Form */}
            <div className="relative">
              {/* Glow effect */}
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
                <p className="text-xs text-muted-foreground mt-4 text-left leading-relaxed">
                  Built for agencies serving HVAC, plumbing, electrical, dental, med spas, and other local-service industries.
                </p>

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
            {/* Build Website Layout Button */}
            <div className="max-w-4xl mx-auto mb-10 flex justify-center">
              <Button
                variant="hero"
                size="lg"
                className="gap-2"
                onClick={() => {
                  if (!blueprint) {
                    toast({
                      title: "Generate a blueprint first",
                      description: "You need to create a client website blueprint before building a layout.",
                      variant: "destructive",
                    });
                    return;
                  }
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

        {/* Empty State with Benefits */}
        {!isLoading && !isGeneratingBlueprint && !results && !blueprint && (
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
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 mt-8">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Optimize My Biz</span> — Website audits & optimization for marketing agencies
            </p>
            {!user && (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Login to Save Reports
                </Button>
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
