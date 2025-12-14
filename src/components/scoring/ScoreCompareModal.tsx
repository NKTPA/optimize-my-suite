import { useState } from "react";
import { Loader2, AlertTriangle, Globe, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { AnalysisResult } from "@/types/analysis";
import { ScoreDisplay } from "./ScoreDisplay";

interface ScoreCompareModalProps {
  open: boolean;
  onClose: () => void;
  currentUrl: string;
  originalUrl?: string;
}

function isLovablePlaceholderPage(results: AnalysisResult): boolean {
  const summaryText = (results.summary?.overview || "").toLowerCase();
  const titleText = (results.seo?.recommendedTitle || "").toLowerCase();
  
  const placeholderKeywords = ["authenticating", "lovable", "get started", "sign in", "loading"];
  const hasPlaceholderKeyword = placeholderKeywords.some(
    kw => summaryText.includes(kw) || titleText.includes(kw)
  );
  
  const hasLowScores = results.messaging?.score === 0 || results.seo?.score === 0;
  
  return hasPlaceholderKeyword && hasLowScores;
}

function extractCustomerDomain(url: string): string {
  try {
    const parsed = new URL(url);
    // Skip preview domains
    if (
      parsed.hostname.includes("lovable.app") ||
      parsed.hostname.includes("vercel.app") ||
      parsed.hostname.includes("netlify.app") ||
      parsed.hostname.includes("localhost")
    ) {
      return "";
    }
    return url;
  } catch {
    return "";
  }
}

export function ScoreCompareModal({ open, onClose, currentUrl, originalUrl }: ScoreCompareModalProps) {
  const { session } = useAuth();
  const [productionUrl, setProductionUrl] = useState(() => originalUrl || extractCustomerDomain(currentUrl));
  const [previewUrl, setPreviewUrl] = useState(currentUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [productionResults, setProductionResults] = useState<AnalysisResult | null>(null);
  const [previewResults, setPreviewResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeUrl = async (url: string): Promise<AnalysisResult> => {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-website`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ url: formattedUrl }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to analyze website");
    }
    
    return response.json();
  };

  const handleRunComparison = async () => {
    if (!productionUrl.trim() || !previewUrl.trim()) return;
    
    setIsLoading(true);
    setProductionResults(null);
    setPreviewResults(null);
    setError(null);
    
    try {
      // Run both analyses in parallel
      const [prodData, prevData] = await Promise.all([
        analyzeUrl(productionUrl),
        analyzeUrl(previewUrl),
      ]);
      
      setProductionResults(prodData);
      setPreviewResults(prevData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setProductionResults(null);
    setPreviewResults(null);
    setError(null);
    onClose();
  };

  const prodIsPlaceholder = productionResults ? isLovablePlaceholderPage(productionResults) : false;
  const prevIsPlaceholder = previewResults ? isLovablePlaceholderPage(previewResults) : false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            Compare Production vs Preview Scores
          </DialogTitle>
          <DialogDescription>
            Analyze both environments side-by-side to compare scores and section deltas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="production-url" className="text-sm font-medium">
                Production URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="production-url"
                  placeholder="clientsite.com"
                  value={productionUrl}
                  onChange={(e) => setProductionUrl(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="preview-url-compare" className="text-sm font-medium">
                Preview/Staging URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="preview-url-compare"
                  placeholder="preview--mysite.lovable.app"
                  value={previewUrl}
                  onChange={(e) => setPreviewUrl(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleRunComparison}
            disabled={isLoading || !productionUrl.trim() || !previewUrl.trim()}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing both sites...
              </>
            ) : (
              "Run Comparison"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(productionResults || previewResults) && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Production</h3>
                {prodIsPlaceholder && (
                  <Alert variant="destructive" className="bg-warning/10 border-warning text-warning-foreground text-xs p-3">
                    <AlertTriangle className="w-3 h-3 text-warning" />
                    <AlertDescription className="text-warning/90 text-xs">
                      Lovable placeholder page detected
                    </AlertDescription>
                  </Alert>
                )}
                {productionResults && (
                  <ScoreDisplay results={productionResults} label="Production" compact />
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Preview</h3>
                {prevIsPlaceholder && (
                  <Alert variant="destructive" className="bg-warning/10 border-warning text-warning-foreground text-xs p-3">
                    <AlertTriangle className="w-3 h-3 text-warning" />
                    <AlertDescription className="text-warning/90 text-xs">
                      Lovable placeholder page detected
                    </AlertDescription>
                  </Alert>
                )}
                {previewResults && (
                  <ScoreDisplay results={previewResults} label="Preview" compact />
                )}
              </div>
            </div>
          )}

          {productionResults && previewResults && (
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold text-sm mb-3">Section Deltas</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <DeltaItem label="Messaging" prodScore={productionResults.messaging.score} prevScore={previewResults.messaging.score} />
                <DeltaItem label="Conversion" prodScore={productionResults.conversion.score} prevScore={previewResults.conversion.score} />
                <DeltaItem label="Design" prodScore={productionResults.designUx.score} prevScore={previewResults.designUx.score} />
                <DeltaItem label="Mobile" prodScore={productionResults.mobile.score} prevScore={previewResults.mobile.score} />
                <DeltaItem label="Performance" prodScore={productionResults.performance.score} prevScore={previewResults.performance.score} />
                <DeltaItem label="SEO" prodScore={productionResults.seo.score} prevScore={previewResults.seo.score} />
                <DeltaItem label="Trust" prodScore={productionResults.trust.score} prevScore={previewResults.trust.score} />
                <DeltaItem label="Overall" prodScore={productionResults.summary.overallScore} prevScore={previewResults.summary.overallScore} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeltaItem({ label, prodScore, prevScore }: { label: string; prodScore: number; prevScore: number }) {
  const delta = prevScore - prodScore;
  const deltaColor = delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground";
  const deltaSign = delta > 0 ? "+" : "";

  return (
    <div className="bg-muted/50 rounded-lg p-2 space-y-1">
      <div className="text-muted-foreground font-medium">{label}</div>
      <div className="flex items-center justify-between">
        <span className="text-foreground">{prodScore} → {prevScore}</span>
        <span className={`font-semibold ${deltaColor}`}>
          {deltaSign}{delta}
        </span>
      </div>
    </div>
  );
}
