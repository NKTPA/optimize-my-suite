import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowLeft, History as HistoryIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/hooks/use-history";
import { useAuth } from "@/hooks/use-auth";
import { HistoryCard } from "@/components/history/HistoryCard";
import { HistoryEmptyState } from "@/components/history/HistoryEmptyState";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { HistoryItem, HistoryItemType } from "@/types/history";
import { useToast } from "@/hooks/use-toast";
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

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const { history, isLoading: historyLoading, deleteItem, filterHistory } = useHistory();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<HistoryItemType | "all">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Redirect to auth if not logged in
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

  // Filter history based on active filter and search query
  const filteredHistory = useMemo(() => {
    const typeFilter = activeFilter === "all" ? undefined : activeFilter;
    return filterHistory(typeFilter, searchQuery);
  }, [filterHistory, activeFilter, searchQuery]);

  const handleView = (item: HistoryItem) => {
    // Navigate to the main page with the stored data
    navigate("/", {
      state: {
        historyItem: item,
      },
    });
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete);
      toast({
        title: "Item deleted",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 gradient-hero opacity-[0.02]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_hsl(221_83%_53%_/_0.1),_transparent)]" />

        <div className="container relative py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <HistoryIcon className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Client History</h1>
              </div>
              <p className="text-muted-foreground">
                Review all your past Client Website Analyses & Implementation Packs.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Back Button & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link to="/">
            <Button variant="secondary" size="default" className="gap-2 font-medium shadow-sm hover:shadow-md transition-all">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>

          {history.length > 0 && (
            <HistoryFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={counts}
            />
          )}
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <HistoryEmptyState />
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              No results found for "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            {filteredHistory.map((item) => (
              <HistoryCard
                key={item.id}
                item={item}
                onView={handleView}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </main>

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

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-auto">
        <div className="container">
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-semibold text-foreground">OptimizeMySuite</span> — Website audits & optimization for marketing agencies
          </p>
        </div>
      </footer>
    </div>
  );
};

export default History;
