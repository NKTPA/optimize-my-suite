import { useState } from "react";
import { ChevronRight, ChevronDown, Globe, FileText, Eye, Download, Trash2, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HistoryItem } from "@/types/history";
import { cn } from "@/lib/utils";

interface DomainGroup {
  domain: string;
  items: HistoryItem[];
  latestItem: HistoryItem;
  latestScore: number | null;
  isNotScorable: boolean;
}

interface DomainGroupRowProps {
  group: DomainGroup;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onView: (item: HistoryItem) => void;
  onDownload: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  getScoreColor: (score: number | null | undefined) => string;
}

export function DomainGroupRow({
  group,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onDownload,
  onDelete,
  getScoreColor,
}: DomainGroupRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const allSelected = group.items.every(item => selectedIds.has(item.id));
  const someSelected = group.items.some(item => selectedIds.has(item.id)) && !allSelected;

  const handleGroupSelect = () => {
    const groupIds = group.items.map(item => item.id);
    onToggleSelectAll(groupIds);
  };

  const isNotScorable = (item: HistoryItem) => {
    return item.snippet?.startsWith("NOT SCORABLE:");
  };

  return (
    <div className="space-y-0">
      {/* Domain Header Row */}
      <Card className={cn(
        "transition-all",
        isExpanded && "rounded-b-none border-b-0"
      )}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3">
            {/* Checkbox */}
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  (el as any).indeterminate = someSelected;
                }
              }}
              onCheckedChange={handleGroupSelect}
              className="flex-shrink-0"
            />

            {/* Expand Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>

            {/* Domain Icon */}
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Globe className="w-4 h-4 text-primary" />
            </div>

            {/* Domain Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">
                  {group.domain}
                </p>
                {group.items.length > 1 && (
                  <Badge variant="outline" className="text-xs">
                    ×{group.items.length}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Last analyzed: {new Date(group.latestItem.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Score */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {group.isNotScorable ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-muted-foreground opacity-60">
                      <span className="text-xl font-bold">—</span>
                      <Info className="w-3 h-3" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Latest analysis could not be scored</p>
                  </TooltipContent>
                </Tooltip>
              ) : group.latestScore !== null ? (
                <div className="text-right">
                  <span className={cn("text-xl font-bold", getScoreColor(group.latestScore))}>
                    {group.latestScore}
                  </span>
                  <span className="text-muted-foreground text-sm">/100</span>
                </div>
              ) : null}

              {/* Quick Actions */}
              <Button variant="ghost" size="icon" onClick={() => onView(group.latestItem)} title="View Latest">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Individual Runs */}
      {isExpanded && (
        <div className="border border-t-0 rounded-b-lg bg-muted/30">
          {group.items.map((item, index) => {
            const itemNotScorable = isNotScorable(item);
            
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-b-0",
                  itemNotScorable && "opacity-60"
                )}
              >
                {/* Indent + Checkbox */}
                <div className="w-8" /> {/* Spacer for indent */}
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={() => onToggleSelect(item.id)}
                  className="flex-shrink-0"
                />

                {/* Type Icon */}
                <div className={cn(
                  "p-1.5 rounded-lg flex-shrink-0",
                  item.type === "analysis" ? "bg-primary/10" : "bg-accent/10"
                )}>
                  {item.type === "analysis" ? (
                    <Globe className="w-3 h-3 text-primary" />
                  ) : (
                    <FileText className="w-3 h-3 text-accent" />
                  )}
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {item.url}
                    </p>
                    <Badge variant={item.type === "analysis" ? "default" : "secondary"} className="text-xs">
                      {item.type === "analysis" ? "Analysis" : "Pack"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Score */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {itemNotScorable ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="text-lg font-bold">—</span>
                          <Info className="w-3 h-3" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px]">
                        <p>{item.snippet?.replace("NOT SCORABLE: ", "")}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : item.overallScore !== undefined && item.overallScore !== null ? (
                    <div className="text-right">
                      <span className={cn("text-lg font-bold", getScoreColor(item.overallScore))}>
                        {item.overallScore}
                      </span>
                      <span className="text-muted-foreground text-sm">/100</span>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(item)} title="View">
                    <Eye className="w-3 h-3" />
                  </Button>
                  {item.analysisResult && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDownload(item)} title="Download PDF">
                      <Download className="w-3 h-3" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(item.id)} title="Delete">
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}