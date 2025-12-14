import { useState } from "react";
import { Loader2, AlertTriangle, Globe, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { AnalysisResult } from "@/types/analysis";
import { ScoreDisplay } from "./ScoreDisplay";

interface PreviewTestModalProps {
  open: boolean;
  onClose: () => void;
  currentUrl: string;
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

function isPreviewUrl(url: string): boolean {
  const previewPatterns = [
    /preview--.*\.lovable\.app/i,
    /lovable\.app/i,
    /vercel\.app/i,
    /netlify\.app/i,
    /localhost/i,
    /127\.0\.0\.1/i,
  ];
  return previewPatterns.some(pattern => pattern.test(url));
}

export function PreviewTestModal({ open, onClose, currentUrl }: PreviewTestModalProps) {
  const { session } = useAuth();
  const [url, setUrl] = useState(() => isPreviewUrl(currentUrl) ? currentUrl : "");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    if (!url.trim()) return;
    
    setIsLoading(true);
    setResults(null);
    setError(null);
    
    try {
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
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setResults(null);
    setError(null);
    onClose();
  };

  const isPlaceholder = results ? isLovablePlaceholderPage(results) : false;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-primary" />
            Test Preview Environment Scoring
          </DialogTitle>
          <DialogDescription>
            Analyze a preview/staging URL to check how it scores before going live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="preview-url" className="text-sm font-medium">
              Preview/Staging URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="preview-url"
                placeholder="preview--mysite.lovable.app"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleRunTest()}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            onClick={handleRunTest}
            disabled={isLoading || !url.trim()}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Run Test"
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && (
            <div className="space-y-4">
              {isPlaceholder && (
                <Alert variant="destructive" className="bg-warning/10 border-warning text-warning-foreground">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <AlertTitle className="text-warning">Lovable Placeholder Detected</AlertTitle>
                  <AlertDescription className="text-warning/90">
                    This URL appears to be a Lovable authentication/placeholder page (not publicly accessible). 
                    Publish the site or use the public deployment URL/custom domain.
                  </AlertDescription>
                </Alert>
              )}

              <ScoreDisplay results={results} label="Preview Score" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
