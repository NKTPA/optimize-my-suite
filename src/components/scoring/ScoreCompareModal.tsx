import { useState } from "react";
import { Loader2, AlertTriangle, Globe, GitCompare, Info, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { AnalysisResult, isNotScorable, detectLovablePlaceholder } from "@/types/analysis";
import { ScoreDisplay } from "./ScoreDisplay";
import { generateBeforeAfterPdf } from "@/lib/generateBeforeAfterPdf";
import { useToast } from "@/hooks/use-toast";
interface ScoreCompareModalProps {
  open: boolean;
  onClose: () => void;
  currentUrl: string;
  originalUrl?: string;
}

// Check if a result is NOT SCORABLE or a placeholder
function isResultNotComparable(results: AnalysisResult): { notComparable: boolean; reason: string } {
  if (isNotScorable(results)) {
    const reasonMap: Record<string, string> = {
      auth_gate: "Authentication required",
      insufficient_html: "Insufficient content",
      blocked_fetch: "Access blocked",
      redirect_loop: "Redirect loop detected",
      placeholder_page: "Placeholder page",
      js_only_shell: "JavaScript-only shell",
      login_required: "Login required",
    };
    return { 
      notComparable: true, 
      reason: reasonMap[results.notScorable?.reason || ""] || "Not scorable"
    };
  }
  
  if (detectLovablePlaceholder(results)) {
    return { notComparable: true, reason: "Lovable placeholder page detected" };
  }
  
  return { notComparable: false, reason: "" };
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
  const { toast } = useToast();
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

  const handleExportPdf = () => {
    if (!productionResults || !previewResults) return;
    
    try {
      generateBeforeAfterPdf({
        originalUrl: productionUrl,
        optimizedUrl: previewUrl,
        originalResults: productionResults,
        optimizedResults: previewResults,
      });
      toast({
        title: "PDF Exported",
        description: "Your Before vs After report has been downloaded.",
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if results are comparable
  const prodStatus = productionResults ? isResultNotComparable(productionResults) : null;
  const prevStatus = previewResults ? isResultNotComparable(previewResults) : null;
  
  const canCompare = productionResults && previewResults && 
    !prodStatus?.notComparable && !prevStatus?.notComparable;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            Before vs After Score Comparison
          </DialogTitle>
          <DialogDescription>
            Compare production and preview/staging environments side-by-side.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="production-url" className="text-sm font-medium">
                Original / Production URL
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
                Rebuilt / Preview URL
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
              {/* Production/Original Column */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Original</h3>
                {prodStatus?.notComparable ? (
                  <NotScorableBadge reason={prodStatus.reason} />
                ) : productionResults ? (
                  <ScoreDisplay results={productionResults} label="Original" compact />
                ) : null}
              </div>

              {/* Preview/Rebuilt Column */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Rebuilt</h3>
                {prevStatus?.notComparable ? (
                  <NotScorableBadge reason={prevStatus.reason} />
                ) : previewResults ? (
                  <ScoreDisplay results={previewResults} label="Rebuilt" compact />
                ) : null}
              </div>
            </div>
          )}

          {/* Section Deltas - only show if both are comparable */}
          {canCompare && (
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold text-sm mb-3">Section Deltas (Rebuilt vs Original)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <DeltaItem label="Messaging" prodScore={productionResults.messaging.score} prevScore={previewResults.messaging.score} />
                <DeltaItem label="Conversion" prodScore={productionResults.conversion.score} prevScore={previewResults.conversion.score} />
                <DeltaItem label="Design" prodScore={productionResults.designUx.score} prevScore={previewResults.designUx.score} />
                <DeltaItem label="Mobile" prodScore={productionResults.mobile.score} prevScore={previewResults.mobile.score} />
                <DeltaItem label="SEO" prodScore={productionResults.seo.score} prevScore={previewResults.seo.score} />
                <DeltaItem label="Trust" prodScore={productionResults.trust.score} prevScore={previewResults.trust.score} />
                <DeltaItem label="Overall" prodScore={productionResults.summary.overallScore} prevScore={previewResults.summary.overallScore} isOverall />
              </div>
            </div>
          )}

          {/* Warning when comparison is not available */}
          {(prodStatus?.notComparable || prevStatus?.notComparable) && productionResults && previewResults && (
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <Info className="w-4 h-4 text-amber-600" />
              <AlertTitle className="text-amber-700 dark:text-amber-400">Comparison Unavailable</AlertTitle>
              <AlertDescription className="text-amber-600/90 dark:text-amber-400/90 text-sm">
                One or both URLs returned NOT SCORABLE. This means the page couldn't be fully analyzed 
                (e.g., it's behind a login, blocked, or has insufficient content). 
                Publish the site or use a publicly accessible URL to enable comparison.
              </AlertDescription>
            </Alert>
          )}

          {/* Export PDF Button */}
          {productionResults && previewResults && (
            <Button
              onClick={handleExportPdf}
              variant="outline"
              className="w-full gap-2"
            >
              <Download className="w-4 h-4" />
              Export Before vs After PDF Report
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * NOT SCORABLE Badge for comparison view
 */
function NotScorableBadge({ reason }: { reason: string }) {
  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center space-y-2">
      <Badge 
        variant="outline" 
        className="text-sm px-3 py-1 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10"
      >
        NOT SCORABLE
      </Badge>
      <p className="text-xs text-muted-foreground">{reason}</p>
      <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
        This is not a negative score — the page simply couldn't be analyzed.
      </p>
    </div>
  );
}

function DeltaItem({ 
  label, 
  prodScore, 
  prevScore, 
  isOverall = false 
}: { 
  label: string; 
  prodScore: number; 
  prevScore: number;
  isOverall?: boolean;
}) {
  const delta = prevScore - prodScore;
  const deltaColor = delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground";
  const deltaSign = delta > 0 ? "+" : "";
  const deltaBg = delta > 0 ? "bg-success/10" : delta < 0 ? "bg-destructive/10" : "bg-muted/50";

  return (
    <div className={`rounded-lg p-2 space-y-1 ${isOverall ? 'col-span-2 sm:col-span-1 border-2 border-primary/20 bg-primary/5' : deltaBg}`}>
      <div className={`font-medium ${isOverall ? 'text-primary' : 'text-muted-foreground'}`}>{label}</div>
      <div className="flex items-center justify-between gap-1">
        <span className="text-foreground text-xs">{prodScore} → {prevScore}</span>
        <span className={`font-bold ${deltaColor} ${isOverall ? 'text-base' : ''}`}>
          {deltaSign}{delta}
        </span>
      </div>
    </div>
  );
}
