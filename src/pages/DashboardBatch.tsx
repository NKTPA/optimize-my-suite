import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Play, FileDown, AlertTriangle, FileSpreadsheet, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BatchSite } from "@/types/batch";
import { BatchSummaryCard } from "@/components/batch/BatchSummaryCard";
import { ImplementationModal } from "@/components/batch/ImplementationModal";
import { parseCSV, generateSummaryCSV } from "@/lib/csvParser";
import { generateAnalysisPdf } from "@/lib/generatePdf";
import { generateImplementationPdf } from "@/lib/generateImplementationPdf";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { UsageLimitModal } from "@/components/entitlements/UsageLimitModal";
import { getPlanLimits } from "@/lib/entitlements";
import { Loader2 } from "lucide-react";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function DashboardBatch() {
  const { user, session, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { workspace, canUseFeature, incrementUsage, getRemainingUsage } = useWorkspace();
  const [sites, setSites] = useState<BatchSite[]>([]);
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [overallError, setOverallError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSite, setSelectedSite] = useState<BatchSite | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatingSiteId, setGeneratingSiteId] = useState<string | null>(null);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState<"analyses" | "packs">("analyses");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const planLimits = workspace ? getPlanLimits(workspace.plan as any) : getPlanLimits("starter");
  const maxBatchUrls = planLimits.batchUrlLimit === "unlimited" ? Infinity : planLimits.batchUrlLimit;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

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

      // Check batch URL limit
      if (parsed.length > maxBatchUrls) {
        toast({
          title: "Batch limit exceeded",
          description: `Your plan allows up to ${maxBatchUrls} URLs per batch. Please reduce your list or upgrade.`,
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
        title: `${newSites.length} client sites loaded`,
        description: "Click 'Run Batch Analysis' to start processing.",
      });
    } catch (error) {
      toast({
        title: "Failed to parse CSV",
        description: error instanceof Error ? error.message : "Invalid CSV format.",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    setSites([]);
    setOverallError(null);
    setCurrentIndex(0);
    setSelectedSite(null);
    setIsModalOpen(false);
    setGeneratingSiteId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const runBatchAnalysis = async () => {
    // Check remaining usage
    const remaining = getRemainingUsage("analyses");
    if (remaining < sites.length) {
      setLimitModalType("analyses");
      setShowUsageLimitModal(true);
      toast({
        title: "Insufficient analyses remaining",
        description: `You have ${remaining} analyses left, but ${sites.length} sites to analyze.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsRunningBatch(true);
    setOverallError(null);
    setCurrentIndex(0);

    for (let i = 0; i < sites.length; i++) {
      setCurrentIndex(i);
      const site = sites[i];

      setSites((prev) =>
        prev.map((s) => (s.id === site.id ? { ...s, status: "running" } : s))
      );

      try {
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
        
        // Increment usage for each successful analysis
        await incrementUsage("analysis");
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

      if (i < sites.length - 1) {
        await delay(500);
      }
    }

    setIsRunningBatch(false);
    toast({
      title: "Batch analysis complete",
      description: "All client websites have been analyzed. Generate implementation packs for detailed recommendations.",
    });
  };

  const handleGenerateImplementation = async (site: BatchSite) => {
    if (!site.analysisResult) return;
    
    // Check pack usage
    if (!canUseFeature("packs")) {
      setLimitModalType("packs");
      setShowUsageLimitModal(true);
      return;
    }

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

      setSites((prev) =>
        prev.map((s) =>
          s.id === site.id
            ? { ...s, implementationPlan }
            : s
        )
      );
      
      // Increment pack usage
      await incrementUsage("pack");

      const updatedSite = { ...site, implementationPlan };
      setSelectedSite(updatedSite);
      setIsModalOpen(true);

      toast({
        title: "Implementation Pack ready",
        description: "Your detailed client implementation plan has been generated.",
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

  const handleDownloadImplementationPdf = (site: BatchSite) => {
    if (site.implementationPlan) {
      generateImplementationPdf(site.implementationPlan, site.url);
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
    link.download = `client-batch-analysis-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const completedCount = sites.filter((s) => s.status === "done").length;
  const errorCount = sites.filter((s) => s.status === "error").length;

  return (
    <DashboardLayout>
      <UsageLimitModal
        open={showUsageLimitModal}
        onClose={() => setShowUsageLimitModal(false)}
        featureType={limitModalType}
      />
      
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Batch Analysis</h1>
            <p className="text-muted-foreground">
              Analyze multiple client websites at once. Scale your agency audits.
            </p>
          </div>
          {sites.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>

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
                <h2 className="font-semibold text-foreground mb-1">Upload Client List (CSV)</h2>
                <p className="text-sm text-muted-foreground">
                  CSV must have at least a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">url</code> column.
                  Optional: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">name</code> column for client names.
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
                  Processing {currentIndex + 1} of {sites.length} client websites…
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {sites.length} client site{sites.length !== 1 ? "s" : ""} loaded
            </span>
          </div>
        )}

        {/* Empty State */}
        {sites.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <FileSpreadsheet className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No client sites loaded</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Upload a CSV file with client website URLs to get started. Each row should contain
                a URL, and optionally a client/business name.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analysis Summaries */}
        {sites.filter((s) => s.status === "done" && s.analysisResult).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Client Analysis Summaries</h2>
            {sites
              .filter((s) => s.status === "done" && s.analysisResult)
              .map((site, index) => (
                <BatchSummaryCard
                  key={site.id}
                  site={site}
                  index={index}
                  onGenerateImplementation={handleGenerateImplementation}
                  onDownloadPdf={handleDownloadPdf}
                  onDownloadImplementationPdf={handleDownloadImplementationPdf}
                  isGenerating={generatingSiteId === site.id}
                />
              ))}
          </div>
        )}

        {/* Pending/Running sites mini list */}
        {sites.filter((s) => s.status === "pending" || s.status === "running").length > 0 && (
          <Card>
            <CardContent className="pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Queued Client Sites</h3>
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
                  <h3 className="font-semibold text-foreground mb-1">Batch Summary</h3>
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
      </div>

      {/* Implementation Modal */}
      <ImplementationModal
        site={selectedSite}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSite(null);
        }}
      />
    </DashboardLayout>
  );
}
