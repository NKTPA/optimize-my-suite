import { Trash2, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onDownload: () => void;
  onClear: () => void;
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onDownload,
  onClear,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-xl shadow-lg">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} selected
        </span>
        
        <div className="h-4 w-px bg-border" />
        
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Download as PDF
        </Button>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Selected
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}