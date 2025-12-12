import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe, ArrowRight, Zap, Target, TrendingUp, Layers, AlertCircle, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingState } from "@/components/LoadingState";
import { AnalysisResults } from "@/components/AnalysisResults";
import { BlueprintForm } from "@/components/BlueprintForm";
import { BlueprintDisplay } from "@/components/BlueprintDisplay";
import { AnalysisResult } from "@/types/analysis";
import { BlueprintFormData, WebsiteBlueprint } from "@/types/blueprint";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
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
  const {
    toast
  } = useToast();
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
        description: "Enter the website URL you want to analyze.",
        variant: "destructive"
      });
      return;
    }
    if (!isValidUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL (e.g., example.com).",
        variant: "destructive"
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
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          url: formattedUrl
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze website");
      }
      const data = await response.json();
      setResults(data);
      setAnalyzedUrl(formattedUrl);
      toast({
        title: "Analysis Complete",
        description: "Your website analysis is ready. Scroll down to see the results."
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive"
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
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify(formData)
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
        description: "Your website blueprint is ready. Scroll down to see it."
      });
    } catch (error) {
      console.error("Blueprint generation error:", error);
      setBlueprintError(error instanceof Error ? error.message : "Failed to generate blueprint");
      toast({
        title: "Blueprint Generation Failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingBlueprint(false);
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        {/* Navigation */}
        <nav className="container relative pt-4">
          <div className="flex justify-end">
            <Link to="/batch">
              <Button variant="outline" size="sm" className="gap-2">
                <Layers className="w-4 h-4" />
                Batch Mode
              </Button>
            </Link>
          </div>
        </nav>
        
        <div className="container relative py-12 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Optimize My <span className="text-gradient">Biz</span>
              </h1>
            </Link>
            
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Get a detailed analysis of your home services website with actionable recommendations to 
              <strong className="text-foreground"> increase leads and book more jobs</strong>.
            </p>

            {/* Blueprint Error Banner */}
            {blueprintError && <Alert variant="destructive" className="max-w-xl mx-auto mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{blueprintError}</AlertDescription>
              </Alert>}

            {/* URL Input Form */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card max-w-xl mx-auto">
              <label htmlFor="website-url" className="block text-sm font-medium text-foreground mb-3 text-left">
                Website URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="website-url" type="text" placeholder="yourcompany.com" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !isLoading && handleAnalyze()} className="pl-10 h-12 text-base" disabled={isLoading || isGeneratingBlueprint} />
                </div>
                <Button variant="hero" size="lg" onClick={handleAnalyze} disabled={isLoading || isGeneratingBlueprint} className="w-full sm:w-auto">
                  {isLoading ? "Analyzing..." : "Analyze Website"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-left">
                Works best for HVAC, Plumbing, Electrical, Roofing, Dental, Med Spas websites & more.
              </p>
              
              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              
              {/* Blueprint Form Button */}
              <BlueprintForm onSubmit={handleGenerateBlueprint} isLoading={isGeneratingBlueprint} />
            </div>

          </div>
        </div>
      </header>

      {/* Results Section */}
      <main className="container py-8 lg:py-12">
        {isLoading && <LoadingState />}
        
        {isGeneratingBlueprint && <div className="max-w-2xl mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Generating your website blueprint...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take 30-60 seconds</p>
          </div>}
        
        {results && !isLoading && <AnalysisResults results={results} url={analyzedUrl} />}
        
        {blueprint && !isGeneratingBlueprint && (
          <>
            {/* Build Website Layout Button */}
            <div className="max-w-4xl mx-auto mb-8 flex justify-center">
              <Button 
                variant="hero" 
                size="lg"
                className="gap-2"
                onClick={() => {
                  if (!blueprint) {
                    toast({
                      title: "Generate a blueprint first",
                      description: "You need to create a website blueprint before building a layout.",
                      variant: "destructive"
                    });
                    return;
                  }
                  navigate("/preview", { 
                    state: { 
                      blueprint, 
                      businessName: blueprintBusinessName,
                      phone: blueprintPhone,
                      email: blueprintEmail,
                      industry: blueprintIndustry
                    } 
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
        {!isLoading && !isGeneratingBlueprint && !results && !blueprint && <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                What You'll Get
              </h2>
              <p className="text-muted-foreground">
                A comprehensive analysis covering everything that matters for your business website.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[{
            title: "Messaging & Clarity",
            description: "Is it clear what you do and where you operate?"
          }, {
            title: "Lead Capture",
            description: "Are you making it easy for visitors to contact you?"
          }, {
            title: "Design & UX",
            description: "Does your site look professional and trustworthy?"
          }, {
            title: "Mobile Experience",
            description: "Does your site work well on phones and tablets?"
          }, {
            title: "Page Speed",
            description: "Are slow images or scripts hurting your rankings?"
          }, {
            title: "SEO & Local SEO",
            description: "Can Google find you when customers search locally?"
          }, {
            title: "Trust Signals",
            description: "Do you showcase reviews, certifications, and guarantees?"
          }, {
            title: "Technical Basics",
            description: "SSL, favicon, and other essential technical elements."
          }, {
            title: "AI-Powered Tips",
            description: "Specific copy and layout recommendations you can use today."
          }].map((item, index) => <div key={index} className="p-4 rounded-xl bg-card border border-border hover:shadow-card transition-shadow duration-300">
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>)}
            </div>
          </div>}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            Optimize My Biz — Free website analysis for home services businesses
          </p>
        </div>
      </footer>
    </div>;
};
export default Index;