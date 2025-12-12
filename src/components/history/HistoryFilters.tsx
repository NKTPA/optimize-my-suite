import { cn } from "@/lib/utils";
import { HistoryItemType } from "@/types/history";

interface HistoryFiltersProps {
  activeFilter: HistoryItemType | "all";
  onFilterChange: (filter: HistoryItemType | "all") => void;
  counts: {
    all: number;
    analysis: number;
    implementation: number;
  };
}

export const HistoryFilters = ({
  activeFilter,
  onFilterChange,
  counts,
}: HistoryFiltersProps) => {
  const filters: { key: HistoryItemType | "all"; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "analysis", label: "Analysis Reports", count: counts.analysis },
    { key: "implementation", label: "Implementation Packs", count: counts.implementation },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
            activeFilter === filter.key
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {filter.label}
          <span
            className={cn(
              "ml-2 px-1.5 py-0.5 rounded-full text-xs",
              activeFilter === filter.key
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-border/50 text-muted-foreground"
            )}
          >
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
};
