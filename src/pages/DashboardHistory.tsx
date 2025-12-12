import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, History as HistoryIcon, Loader2, Globe, FileText, Download, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useHistory } from "@/hooks/use-history";
import { useAuth } from "@/hooks/use-auth";
import { HistoryItem, HistoryItemType } from "@/types/history";
import { useToast } from "@/hooks/use-toast";
import { generateAnalysisPdf } from "@/lib/generatePdf";
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

export default function DashboardHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { history, isLoading: historyLoading, deleteItem, filterHistory } = useHistory();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<HistoryItemType | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Calculate counts for filters
  const counts = useMemo(() => {
    return {
      all: history.length,
      analysis: history.filter((item) => item.type === "analysis").length,
      implementation: history.filter((item) => item.type === "implementation").length,
    };
  }, [history]);

  // Filter and sort history
  const filteredHistory = useMemo(() => {
    const typeFilter = activeFilter === "all" ? undefined : activeFilter;
    let filtered = filterHistory(typeFilter, searchQuery);
    
    if (sortBy === "score") {
      filtered = [...filtered].sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    }
    
    return filtered;
  }, [filterHistory, activeFilter, searchQuery, sortBy]);

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
      toast({
        title: "Report deleted",
        description: "The client report has been removed from history.",
      });
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
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
          <div className="flex items-center gap-2">
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
              Implementation Packs ({counts.implementation})
            </Button>
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
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="hover:shadow-card-hover transition-all">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                        item.type === "analysis" ? "bg-primary/10" : "bg-accent/10"
                      }`}>
                        {item.type === "analysis" ? (
                          <Globe className="w-5 h-5 text-primary" />
                        ) : (
                          <FileText className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground truncate max-w-[400px]">
                            {item.url}
                          </p>
                          <Badge variant={item.type === "analysis" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                            {item.type === "analysis" ? "Analysis" : "Implementation"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {item.snippet && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{item.snippet}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {item.overallScore !== undefined && (
                        <div className="text-right mr-2">
                          <span className={`text-xl font-bold ${
                            item.overallScore >= 80 ? "text-success" :
                            item.overallScore >= 60 ? "text-warning" : "text-destructive"
                          }`}>
                            {item.overallScore}
                          </span>
                          <span className="text-muted-foreground text-sm">/100</span>
                        </div>
                      )}

                      <Button variant="ghost" size="icon" onClick={() => handleView(item)} title="View Report">
                        <Eye className="w-4 h-4" />
                      </Button>
                      {item.analysisResult && (
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(item)} title="Download PDF">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item.id)} title="Delete">
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
    </DashboardLayout>
  );
}
