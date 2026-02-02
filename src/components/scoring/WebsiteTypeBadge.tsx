import { 
  Building2, 
  Code2, 
  ShoppingCart, 
  Briefcase, 
  FileText, 
  UtensilsCrossed, 
  Heart, 
  User,
  Globe,
  Info
} from "lucide-react";
import { WebsiteTypeInfo, WebsiteType } from "@/types/analysis";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WebsiteTypeBadgeProps {
  websiteType: WebsiteTypeInfo;
  className?: string;
  showConfidence?: boolean;
}

const TYPE_ICONS: Record<WebsiteType, typeof Building2> = {
  local_service: Building2,
  saas_software: Code2,
  ecommerce: ShoppingCart,
  professional_services: Briefcase,
  content_media: FileText,
  restaurant_hospitality: UtensilsCrossed,
  nonprofit: Heart,
  portfolio_personal: User,
  unknown: Globe,
};

const TYPE_COLORS: Record<WebsiteType, string> = {
  local_service: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  saas_software: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  ecommerce: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  professional_services: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  content_media: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  restaurant_hospitality: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  nonprofit: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  portfolio_personal: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  unknown: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

const CONFIDENCE_LABELS: Record<'high' | 'medium' | 'low', string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function WebsiteTypeBadge({ 
  websiteType, 
  className,
  showConfidence = true 
}: WebsiteTypeBadgeProps) {
  const Icon = TYPE_ICONS[websiteType.type];
  const colorClass = TYPE_COLORS[websiteType.type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium",
              colorClass,
              className
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{websiteType.displayName}</span>
            {showConfidence && (
              <Info className="w-3 h-3 opacity-60" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">
              Detected: {websiteType.displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {CONFIDENCE_LABELS[websiteType.confidence]} detection. Scoring criteria adapted for this website type.
            </p>
            {websiteType.signals.length > 0 && (
              <div className="pt-1 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Signals: {websiteType.signals.join(", ")}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}