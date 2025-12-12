import { format } from "date-fns";
import { ExternalLink, Trash2, FileText, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HistoryItem } from "@/types/history";

interface HistoryCardProps {
  item: HistoryItem;
  onView: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

export const HistoryCard = ({ item, onView, onDelete }: HistoryCardProps) => {
  const formattedDate = format(new Date(item.createdAt), "MMM d, yyyy - h:mm a");

  return (
    <Card className="p-5 sm:p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 animate-fade-in">
      <div className="flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors truncate block text-sm sm:text-base"
            >
              {item.url}
            </a>
          </div>
          <Badge
            variant={item.type === "analysis" ? "default" : "secondary"}
            className={`shrink-0 ${
              item.type === "analysis"
                ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                : "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
            }`}
          >
            {item.type === "analysis" ? (
              <>
                <FileText className="w-3 h-3 mr-1" />
                Analysis Report
              </>
            ) : (
              <>
                <Wrench className="w-3 h-3 mr-1" />
                Implementation Pack
              </>
            )}
          </Badge>
        </div>

        {/* Score and Date Row */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {item.overallScore !== undefined && (
            <>
              <span className="font-medium">
                Overall Score:{" "}
                <span
                  className={`${
                    item.overallScore >= 70
                      ? "text-success"
                      : item.overallScore >= 50
                      ? "text-warning"
                      : "text-destructive"
                  }`}
                >
                  {item.overallScore}
                </span>
              </span>
              <span className="text-border">|</span>
            </>
          )}
          <span>Generated: {formattedDate}</span>
        </div>

        {/* Snippet */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          "{item.snippet}"
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Button
            variant="default"
            size="sm"
            onClick={() => onView(item)}
            className="gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {item.type === "analysis" ? "View Report" : "View Pack"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};
