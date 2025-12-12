import { FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const HistoryEmptyState = () => {
  return (
    <div className="text-center py-16 sm:py-24">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary/50 mb-6">
        <FileText className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        No client reports yet
      </h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Your Client Website Analyses and Implementation Packs will appear here once you run your first audit.
      </p>
      <Link to="/">
        <Button variant="hero" size="lg" className="gap-2">
          Run First Client Analysis
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
};
