import { useState, useRef, useEffect, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Play, FileDown, AlertTriangle, FileSpreadsheet, RotateCcw, Download, ArrowRight, ClipboardList, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const SAMPLE_CSV = `url,name
https://example-plumber.com,Joe's Plumbing
https://example-dentist.com,Bright Smile Dental
https://example-hvac.com,Cool Air Services`;

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
  const [inputTab, setInputTab] = useState<"paste" | "csv">("paste");
  const [pastedUrls, setPastedUrls] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const planLimits = workspace ? getPlanLimits(workspace.plan as any) : getPlanLimits("starter");
  const maxBatchUrls = planLimits.batchUrlLimit === "unlimited" ? Infinity : planLimits.batchUrlLimit;
  const planDisplayLimit = planLimits.batchUrlLimit === "unlimited" ? "Unlimited" : planLimits.batchUrlLimit;
  const planName = workspace?.plan ? workspace.plan.charAt(0).toUpperCase() + workspace.plan.slice(1) : "Starter";

  // Parse pasted URLs
  const parsedPastedUrls = pastedUrls
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && (line.startsWith("http://") || line.startsWith("https://") || line.includes(".")));

  const urlCount = sites.length > 0 ? sites.length : parsedPastedUrls.length;
  const isOverLimit = maxBatchUrls !== Infinity && urlCount > maxBatchUrls;

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

  const handleDownloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "sample-batch-urls.csv";
    link.click();
  };

  const processCSVText = (text: string) => {
    try {
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
        description: "Click 'Start Batch Analysis' to begin processing.",
      });
    } catch (error) {
      toast({
        title: "Failed to parse CSV",
        description: error instanceof Error ? error.message : "Invalid CSV format.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    processCSVText(text);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file",
        description: "Please drop a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const text = await file.text();
    processCSVText(text);
  };

  const handleLoadPastedUrls = () => {
    if (parsedPastedUrls.length === 0) {
      toast({
        title: "No valid URLs",
        description: "Please enter at least one valid URL.",
        variant: "destructive",
      });
      return;
    }

    if (parsedPastedUrls.length > maxBatchUrls) {
      toast({
        title: "Batch limit exceeded",
        description: `Your plan allows up to ${maxBatchUrls} URLs per batch. Please reduce your list or upgrade.`,
        variant: "destructive",
      });
      return;
    }

    const newSites: BatchSite[] = parsedPastedUrls.map((url) => ({
      id: generateId(),
      url: url.startsWith("http") ? url : `https://${url}`,
      status: "pending",
    }));

    setSites(newSites);
    setOverallError(null);
    setPastedUrls("");
    toast({
      title: `${newSites.length} URLs loaded`,
      description: "Click 'Start Batch Analysis' to begin processing.",
    });
  };

  const handleReset = () => {
    setSites([]);
    setOverallError(null);
    setCurrentIndex(0);
    setSelectedSite(null);
    setIsModalOpen(false);
    setGeneratingSiteId(null);
    setPastedUrls("");
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
  const canStartBatch = (inputTab === "paste" && parsedPastedUrls.length > 0) || sites.length > 0;

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
            {/* Plan Limit Badge */}
            <Badge variant="secondary" className="mt-2 text-xs font-normal">
              Your plan: {planName} — up to {planDisplayLimit} URLs per batch
            </Badge>
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

        {/* Input Section with Tabs */}
        {sites.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <Tabs value={inputTab} onValueChange={(v) => setInputTab(v as "paste" | "csv")}>
                <TabsList className="mb-4">
                  <TabsTrigger value="paste">Paste URLs</TabsTrigger>
                  <TabsTrigger value="csv">Upload CSV</TabsTrigger>
                </TabsList>

                {/* Paste URLs Tab */}
                <TabsContent value="paste" className="space-y-4">
                  <Textarea
                    value={pastedUrls}
                    onChange={(e) => setPastedUrls(e.target.value)}
                    placeholder={`Enter website URLs, one per line:\nhttps://example1.com\nhttps://example2.com\nhttps://example3.com`}
                    className="min-h-[160px] font-mono text-sm"
                    disabled={isRunningBatch}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {parsedPastedUrls.length > 0 && (
                        <span className={isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {parsedPastedUrls.length} of {planDisplayLimit} URLs
                          {isOverLimit && " — Reduce URLs or upgrade your plan"}
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={handleLoadPastedUrls}
                      disabled={parsedPastedUrls.length === 0 || isOverLimit || isRunningBatch}
                      className="gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start Batch Analysis
                    </Button>
                  </div>
                </TabsContent>

                {/* Upload CSV Tab */}
                <TabsContent value="csv" className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                      ${isDragOver 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                      }
                    `}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? "text-primary" : "text-muted-foreground/50"}`} />
                    <p className="font-medium text-foreground mb-1">
                      {isDragOver ? "Drop CSV file here" : "Drag and drop your CSV file here"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CSV must have a <code className="bg-muted px-1.5 py-0.5 rounded">url</code> column.
                      Optional: <code className="bg-muted px-1.5 py-0.5 rounded">name</code> column for client names.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isRunningBatch}
                  />
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleDownloadSampleCSV}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download sample CSV
                    </button>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isRunningBatch}>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose CSV File
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Run Button & Progress (when sites are loaded) */}
        {sites.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={runBatchAnalysis}
                disabled={sites.length === 0 || isRunningBatch}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Start Batch Analysis
              </Button>
              {isRunningBatch && (
                <span className="text-sm text-muted-foreground">
                  Processing {currentIndex + 1} of {sites.length} client websites…
                </span>
              )}
            </div>
            <span className={`text-sm ${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}>
              {sites.length} of {planDisplayLimit} URLs
              {isOverLimit && " — Reduce URLs or upgrade"}
            </span>
          </div>
        )}

        {/* Empty State - Action-oriented */}
        {sites.length === 0 && inputTab === "paste" && pastedUrls.length === 0 && (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="py-10">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Analyze up to {planDisplayLimit} websites in one click
                </h3>
                <p className="text-sm text-muted-foreground">
                  Run bulk audits for your agency prospects and clients
                </p>
              </div>
              
              {/* Three Steps */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">1</div>
                  <span>Paste URLs or upload CSV</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 hidden sm:block" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">2</div>
                  <span>Run batch analysis</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 hidden sm:block" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">3</div>
                  <span>Download all reports</span>
                </div>
              </div>
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
