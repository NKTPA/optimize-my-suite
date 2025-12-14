import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe, ArrowRight, AlertCircle, LayoutTemplate, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "@/components/LoadingState";
import { AnalysisResults } from "@/components/AnalysisResults";
import { BlueprintForm } from "@/components/BlueprintForm";
import { BlueprintDisplay } from "@/components/BlueprintDisplay";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnalysisResult } from "@/types/analysis";
import { BlueprintFormData, WebsiteBlueprint } from "@/types/blueprint";
import { HistoryItem } from "@/types/history";
import { useToast } from "@/hooks/use-toast";
import { useHistory } from "@/hooks/use-history";
import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { UsageLimitModal } from "@/components/entitlements/UsageLimitModal";
import { Loader2 } from "lucide-react";

export default function Analyze() {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, session, isLoading: authLoading } = useAuth();
  const { addAnalysis, getBaselineForUrl } = useHistory();
  const { toast } = useToast();
  const { canUseFeature, incrementUsage, getRemainingUsage, isTrialExpired } = useWorkspace();
  
  const [url, setUrl] = useState("");
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
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

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

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
    
    // Check usage limits
    if (!canUseFeature("analyses")) {
      setShowUsageLimitModal(true);
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
          Authorization: `Bearer ${session?.access_token}`,
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
      
      // Increment usage
      await incrementUsage("analysis");
      
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
    // Check usage limits for blueprints (counts as analysis)
    if (!canUseFeature("analyses")) {
      setShowUsageLimitModal(true);
      return;
    }
    
    setIsGeneratingBlueprint(true);
    setBlueprintError("");
    setBlueprint(null);
    setResults(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-website-blueprint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
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
      
      // Increment usage
      await incrementUsage("analysis");
      
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

  useEffect(() => {
    if (!results && !blueprint) {
      urlInputRef.current?.focus();
    }
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <UsageLimitModal
        open={showUsageLimitModal}
        onClose={() => setShowUsageLimitModal(false)}
        featureType="analyses"
      />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_hsl(221_83%_53%_/_0.15),_transparent)]" />

        <div className="container relative py-12 lg:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Analyze Client Website
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
                <div className="flex items-center justify-between mb-4">
                  <label htmlFor="website-url" className="block text-sm font-semibold text-foreground text-left">
                    Client Website URL
                  </label>
                  {(results || blueprint) && (
                    <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2 text-muted-foreground hover:text-foreground">
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  )}
                </div>
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
                    {isLoading ? "Analyzing..." : "Run Analysis"}
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
      </section>

      {/* Results Section */}
      <section className="container py-12 lg:py-16">
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

        {results && !isLoading && (
          <AnalysisResults 
            results={results} 
            url={analyzedUrl} 
            onReset={handleReset}
            baselineData={getBaselineForUrl(analyzedUrl)}
          />
        )}

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
      </section>
    </DashboardLayout>
  );
}
