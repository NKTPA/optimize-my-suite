import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface SpaDetectedBannerProps {
  className?: string;
}

export function SpaDetectedBanner({ className }: SpaDetectedBannerProps) {
  return (
    <Alert
      variant="default"
      className={cn(
        "border-amber-500/40 bg-amber-500/5",
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-600 dark:text-amber-400 font-semibold">
        Single Page App Detected
      </AlertTitle>
      <AlertDescription className="text-muted-foreground text-sm mt-1">
        This site uses client-side rendering (React, Vue, or Angular). Our advanced crawler
        with JavaScript execution was used to render the page before scoring. Some dynamic
        content loaded after initial render may still be missing from the analysis.
      </AlertDescription>
    </Alert>
  );
}
