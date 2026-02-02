import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, History as HistoryIcon, Loader2, Globe, FileText, Download, Trash2, Eye, EyeOff, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useHistory } from "@/hooks/use-history";
import { useAuth } from "@/hooks/use-auth";
import { HistoryItem, HistoryItemType } from "@/types/history";
import { useToast } from "@/hooks/use-toast";
import { generateAnalysisPdf } from "@/lib/generatePdf";
import { DomainGroupRow } from "@/components/history/DomainGroupRow";
import { BulkActionBar } from "@/components/history/BulkActionBar";
import { HistoryPagination } from "@/components/history/HistoryPagination";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DomainGroup {
  domain: string;
  items: HistoryItem[];
  latestItem: HistoryItem;
  latestScore: number | null;
  isNotScorable: boolean;
}

const ITEMS_PER_PAGE = 20;

// Score color coding with proper thresholds
const getScoreColor = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return "text-muted-foreground";
  if (score < 40) return "text-destructive"; // Critical (0-39)
  if (score < 60) return "text-warning"; // Needs Work (40-59)
  if (score < 80) return "text-foreground"; // Good (60-79)
  return "text-success"; // Excellent (80-100)
};

// Extract domain from URL
const extractDomain = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

// Check if item is NOT SCORABLE
const isNotScorable = (item: HistoryItem): boolean => {
  return item.snippet?.startsWith("NOT SCORABLE:") || false;
};

export default function DashboardHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { history, isLoading: historyLoading, deleteItem, filterHistory } = useHistory();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<HistoryItemType | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [hideNotScorable, setHideNotScorable] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter, sortBy, hideNotScorable]);

  // Calculate counts for filters
  const counts = useMemo(() => {
    return {
      all: history.length,
      analysis: history.filter((item) => item.type === "analysis").length,
      implementation: history.filter((item) => item.type === "implementation").length,
      notScorable: history.filter((item) => isNotScorable(item)).length,
    };
  }, [history]);

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    const typeFilter = activeFilter === "all" ? undefined : activeFilter;
    let filtered = filterHistory(typeFilter, searchQuery);
    
    // Filter out NOT SCORABLE if toggled
    if (hideNotScorable) {
      filtered = filtered.filter(item => !isNotScorable(item));
    }
    
    if (sortBy === "score") {
      filtered = [...filtered].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    }
    
    return filtered;
  }, [filterHistory, activeFilter, searchQuery, sortBy, hideNotScorable]);

  // Group by domain
  const domainGroups = useMemo((): DomainGroup[] => {
    const groups = new Map<string, HistoryItem[]>();
    
    filteredHistory.forEach(item => {
      const domain = extractDomain(item.url);
      if (!groups.has(domain)) {
        groups.set(domain, []);
      }
      groups.get(domain)!.push(item);
    });

    return Array.from(groups.entries()).map(([domain, items]) => {
      // Sort items by date (newest first)
      const sortedItems = [...items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestItem = sortedItems[0];
      const latestNotScorable = isNotScorable(latestItem);
      
      return {
        domain,
        items: sortedItems,
        latestItem,
        latestScore: latestNotScorable ? null : (latestItem.overallScore ?? null),
        isNotScorable: latestNotScorable,
      };
    }).sort((a, b) => {
      // Sort groups by latest item date
      return new Date(b.latestItem.createdAt).getTime() - new Date(a.latestItem.createdAt).getTime();
    });
  }, [filteredHistory]);

  // Pagination
  const totalPages = Math.ceil(domainGroups.length / ITEMS_PER_PAGE);
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return domainGroups.slice(start, start + ITEMS_PER_PAGE);
  }, [domainGroups, currentPage]);

  const handleView = (item: HistoryItem) => {
    navigate("/dashboard/analyze", {
      state: {
        historyItem: item,
      },
    });
  };

  const handleDownload = (item: HistoryItem) => {
    if (item.analysisResult) {
      generateAnalysisPdf(item.analysisResult, item.url);
      toast({
        title: "PDF Downloaded",
        description: "Client report has been downloaded.",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(itemToDelete);
        return next;
      });
      toast({
        title: "Report deleted",
        description: "The client report has been removed from history.",
      });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Bulk actions
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      const allSelected = ids.every(id => prev.has(id));
      
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  }, []);

  const handleBulkDelete = async () => {
    setBulkDeleteDialogOpen(false);
    const idsToDelete = Array.from(selectedIds);
    
    for (const id of idsToDelete) {
      await deleteItem(id);
    }
    
    setSelectedIds(new Set());
    toast({
      title: "Reports deleted",
      description: `${idsToDelete.length} reports have been removed from history.`,
    });
  };

  const handleBulkDownload = () => {
    const itemsToDownload = filteredHistory.filter(item => 
      selectedIds.has(item.id) && item.analysisResult
    );
    
    if (itemsToDownload.length === 0) {
      toast({
        title: "No downloadable reports",
        description: "Selected items don't have PDF reports available.",
        variant: "destructive",
      });
      return;
    }

    itemsToDownload.forEach(item => {
      if (item.analysisResult) {
        generateAnalysisPdf(item.analysisResult, item.url);
      }
    });
    
    toast({
      title: "PDFs Downloaded",
      description: `${itemsToDownload.length} reports have been downloaded.`,
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  if (authLoading || historyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <HistoryIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Client History</h1>
              <p className="text-muted-foreground">
                Access all your saved website analyses and implementation packs.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by URL or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-border/60"
            />
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={activeFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              All ({counts.all})
            </Button>
            <Button
              variant={activeFilter === "analysis" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("analysis")}
            >
              Analyses ({counts.analysis})
            </Button>
            <Button
              variant={activeFilter === "implementation" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("implementation")}
            >
              Packs ({counts.implementation})
            </Button>
            
            {/* Hide NOT SCORABLE toggle */}
            {counts.notScorable > 0 && (
              <Button
                variant={hideNotScorable ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setHideNotScorable(!hideNotScorable)}
                className="gap-1.5"
              >
                {hideNotScorable ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {hideNotScorable ? "Show" : "Hide"} Not Scorable ({counts.notScorable})
              </Button>
            )}
          </div>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "score")}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="score">Sort by Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <HistoryIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No reports saved yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Run your first client website analysis to start building your report history.
              </p>
              <Link to="/dashboard/analyze">
                <Button>Run First Analysis</Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              No results found for "{searchQuery}"
            </p>
          </div>
        ) : (
          <>
            {/* Domain Groups */}
            <div className="space-y-3">
              {paginatedGroups.map((group) => (
                <DomainGroupRow
                  key={group.domain}
                  group={group}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onView={handleView}
                  onDownload={handleDownload}
                  onDelete={handleDeleteClick}
                  getScoreColor={getScoreColor}
                />
              ))}
            </div>

            {/* Pagination */}
            <HistoryPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={domainGroups.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onDelete={() => setBulkDeleteDialogOpen(true)}
        onDownload={handleBulkDownload}
        onClear={clearSelection}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the saved report from your agency history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} reports?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected reports from your agency history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedIds.size} Reports
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}