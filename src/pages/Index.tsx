import { useState } from "react";
import { Globe, ArrowRight, Sparkles, Zap, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/LoadingState";
import { AnalysisResults } from "@/components/AnalysisResults";
import { AnalysisResult } from "@/types/analysis";
import { useToast } from "@/hooks/use-toast";
const Index = () => {
  const [url, setUrl] = useState("");
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
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
    try {
      // Format URL properly
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
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container relative py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            
            
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Optimize My <span className="text-gradient">Biz</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Get a detailed analysis of your home services website with actionable recommendations to 
              <strong className="text-foreground"> increase leads and book more jobs</strong>.
            </p>

            {/* URL Input Form */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card max-w-xl mx-auto">
              <label htmlFor="website-url" className="block text-sm font-medium text-foreground mb-3 text-left">
                Website URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input id="website-url" type="text" placeholder="yourcompany.com" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !isLoading && handleAnalyze()} className="pl-10 h-12 text-base" disabled={isLoading} />
                </div>
                <Button variant="hero" size="lg" onClick={handleAnalyze} disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? "Analyzing..." : "Analyze Website"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-left">Works best for HVAC, Plumbing, Electrical, Roofing, Dental, Med Spas websites & more.</p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {[{
              icon: Target,
              text: "Lead Capture"
            }, {
              icon: Zap,
              text: "Performance"
            }, {
              icon: TrendingUp,
              text: "SEO"
            }].map(feature => {})}
            </div>
          </div>
        </div>
      </header>

      {/* Results Section */}
      <main className="container py-8 lg:py-12">
        {isLoading && <LoadingState />}
        {results && !isLoading && <AnalysisResults results={results} url={analyzedUrl} />}
        
        {/* Empty State with Benefits */}
        {!isLoading && !results && <div className="max-w-4xl mx-auto">
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