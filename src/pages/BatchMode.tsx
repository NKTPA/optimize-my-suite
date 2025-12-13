import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload, Play, FileDown, ArrowLeft, AlertTriangle, FileSpreadsheet, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BatchSite } from "@/types/batch";
import { BatchSummaryCard } from "@/components/batch/BatchSummaryCard";
import { ImplementationModal } from "@/components/batch/ImplementationModal";
import { parseCSV, generateSummaryCSV } from "@/lib/csvParser";
import { generateAnalysisPdf } from "@/lib/generatePdf";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function BatchMode() {
  const { user, session, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sites, setSites] = useState<BatchSite[]>([]);
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSite, setSelectedSite] = useState<BatchSite | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatingSiteId, setGeneratingSiteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-[3px] border-secondary border-t-primary" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        toast({
          title: "No valid URLs found",
          description: "Make sure your CSV has a 'url' column with valid website URLs.",
          variant: "destructive",
        });
        return;
      }

      const newSites: BatchSite[] = parsed.map((row) => ({
        id: generateId(),
        url: row.url.startsWith("http") ? row.url : `https://${row.url}`,
        name: row.name,
        status: "pending",
      }));

      setSites(newSites);
      setOverallError(null);
      toast({
        title: `${newSites.length} sites loaded`,
        description: "Click 'Run Batch Analysis' to start processing.",
      });
    } catch (error) {
      toast({
        title: "Failed to parse CSV",
        description: error instanceof Error ? error.message : "Invalid CSV format.",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const runBatchAnalysis = async () => {
    setIsRunningBatch(true);
    setOverallError(null);
    setCurrentIndex(0);

    for (let i = 0; i < sites.length; i++) {
      setCurrentIndex(i);
      const site = sites[i];

      // Update status to running
      setSites((prev) =>
        prev.map((s) => (s.id === site.id ? { ...s, status: "running" } : s))
      );

      try {
        // Analyze website only (no implementation plan in batch mode)
        const analyzeResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-website`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({ url: site.url }),
          }
        );

        if (!analyzeResponse.ok) {
          const errorData = await analyzeResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Analysis failed (${analyzeResponse.status})`);
        }

        const analysisResult = await analyzeResponse.json();
        const extractedData = {
          url: site.url,
          title: analysisResult.seo?.recommendedTitle,
          phone: analysisResult.conversion?.sampleButtons?.[0],
        };

        // Update site with analysis results only
        setSites((prev) =>
          prev.map((s) =>
            s.id === site.id
              ? {
                  ...s,
                  status: "done",
                  analysisResult,
                  extractedData,
                }
              : s
          )
        );
      } catch (error) {
        console.error(`Error processing ${site.url}:`, error);
        setSites((prev) =>
          prev.map((s) =>
            s.id === site.id
              ? {
                  ...s,
                  status: "error",
                  errorMessage: error instanceof Error ? error.message : "Unknown error",
                }
              : s
          )
        );
      }

      // Rate limit delay between sites
      if (i < sites.length - 1) {
        await delay(500);
      }
    }

    setIsRunningBatch(false);
    toast({
      title: "Batch analysis complete",
      description: "All websites have been analyzed. Click 'Generate Implementation Pack' for detailed recommendations.",
    });
  };

  const handleGenerateImplementation = async (site: BatchSite) => {
    if (!site.analysisResult) return;

    setGeneratingSiteId(site.id);

    try {
      const implementationResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-implementation-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            analysisResult: site.analysisResult,
            extractedData: site.extractedData,
            url: site.url,
          }),
        }
      );

      if (!implementationResponse.ok) {
        const errorData = await implementationResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Implementation plan failed (${implementationResponse.status})`);
      }

      const implementationPlan = await implementationResponse.json();

      // Update site with implementation plan
      setSites((prev) =>
        prev.map((s) =>
          s.id === site.id
            ? { ...s, implementationPlan }
            : s
        )
      );

      // Open modal with the updated site
      const updatedSite = { ...site, implementationPlan };
      setSelectedSite(updatedSite);
      setIsModalOpen(true);

      toast({
        title: "Implementation Pack ready",
        description: "Your detailed implementation plan has been generated.",
      });
    } catch (error) {
      console.error(`Error generating implementation for ${site.url}:`, error);
      toast({
        title: "Failed to generate Implementation Pack",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setGeneratingSiteId(null);
    }
  };

  const handleViewImplementation = (site: BatchSite) => {
    if (site.implementationPlan) {
      setSelectedSite(site);
      setIsModalOpen(true);
    }
  };

  const handleDownloadPdf = (site: BatchSite) => {
    if (site.analysisResult) {
      generateAnalysisPdf(site.analysisResult, site.url);
    }
  };

  const handleExportSummaryCSV = () => {
    const summaryData = sites.map((site) => ({
      url: site.url,
      name: site.name,
      status: site.status,
      overallScore: site.analysisResult?.summary?.overallScore,
      mainQuickWin: site.analysisResult?.summary?.quickWins?.[0],
    }));

    const csvContent = generateSummaryCSV(summaryData);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `batch-analysis-summary-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const completedCount = sites.filter((s) => s.status === "done").length;
  const errorCount = sites.filter((s) => s.status === "error").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Batch Mode</h1>
                <p className="text-sm text-muted-foreground">
                  Analyze multiple websites at once
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* Overall Error Banner */}
        {overallError && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Batch Error</p>
              <p className="text-sm text-destructive/80">{overallError}</p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h2 className="font-semibold text-foreground mb-1">Upload CSV</h2>
                <p className="text-sm text-muted-foreground">
                  CSV must have at least a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">url</code> column.
                  Optional: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">name</code> column.
                </p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                  disabled={isRunningBatch}
                />
                <label htmlFor="csv-upload">
                  <Button
                    variant="outline"
                    className="gap-2 cursor-pointer"
                    disabled={isRunningBatch}
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4" />
                      Choose CSV File
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Run Button & Progress */}
        {sites.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={runBatchAnalysis}
                disabled={sites.length === 0 || isRunningBatch}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Run Batch Analysis
              </Button>
              {isRunningBatch && (
                <span className="text-sm text-muted-foreground">
                  Processing {currentIndex + 1} of {sites.length} websites…
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {sites.length} site{sites.length !== 1 ? "s" : ""} loaded
            </span>
          </div>
        )}

        {/* Empty State */}
        {sites.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No sites loaded</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Upload a CSV file with website URLs to get started. Each row should contain
                a URL, and optionally a business name.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analysis Summaries */}
        {sites.filter((s) => s.status === "done" && s.analysisResult).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Analysis Summaries</h2>
            {sites
              .filter((s) => s.status === "done" && s.analysisResult)
              .map((site, index) => (
                <BatchSummaryCard
                  key={site.id}
                  site={site}
                  index={index}
                  onGenerateImplementation={handleGenerateImplementation}
                  onDownloadPdf={handleDownloadPdf}
                  isGenerating={generatingSiteId === site.id}
                />
              ))}
          </div>
        )}

        {/* Pending/Running sites mini list */}
        {sites.filter((s) => s.status === "pending" || s.status === "running").length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Queued Sites</h3>
              <div className="space-y-1">
                {sites
                  .filter((s) => s.status === "pending" || s.status === "running")
                  .map((site, i) => (
                    <div key={site.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="w-5 text-right">{i + 1}.</span>
                      <span className="truncate">{site.name || site.url}</span>
                      {site.status === "running" && (
                        <span className="text-xs text-primary animate-pulse ml-auto">Analyzing...</span>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error sites */}
        {sites.filter((s) => s.status === "error").length > 0 && (
          <Card className="border-destructive/30">
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold text-destructive mb-2">Failed Sites</h3>
              <div className="space-y-2">
                {sites
                  .filter((s) => s.status === "error")
                  .map((site) => (
                    <div key={site.id} className="text-sm">
                      <p className="text-foreground">{site.name || site.url}</p>
                      <p className="text-destructive/70 text-xs">{site.errorMessage}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Section */}
        {sites.length > 0 && !isRunningBatch && completedCount + errorCount > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    Completed: <span className="text-foreground font-medium">{completedCount}</span> / {sites.length} successful,{" "}
                    <span className={errorCount > 0 ? "text-destructive font-medium" : ""}>{errorCount}</span> error{errorCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleExportSummaryCSV}
                  className="gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Export Summary CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Implementation Modal */}
      <ImplementationModal
        site={selectedSite}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSite(null);
        }}
      />
    </div>
  );
}
