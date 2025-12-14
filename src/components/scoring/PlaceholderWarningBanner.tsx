import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PlaceholderWarningBannerProps {
  className?: string;
}

export function PlaceholderWarningBanner({ className }: PlaceholderWarningBannerProps) {
  return (
    <Alert variant="destructive" className={`bg-amber-500/10 border-amber-500/30 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-600 dark:text-amber-400">
        Lovable Placeholder Page Detected
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        This URL appears to be a Lovable authentication/placeholder page (not publicly accessible). 
        The scores shown do not reflect actual website quality.
        <br />
        <strong>Action:</strong> Publish the site or use the public deployment URL/custom domain.
      </AlertDescription>
    </Alert>
  );
}