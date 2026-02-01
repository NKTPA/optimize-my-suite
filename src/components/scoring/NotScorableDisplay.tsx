import { AlertTriangle, ExternalLink, Info, XCircle } from "lucide-react";
import { NotScorableState } from "@/types/analysis";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NotScorableDisplayProps {
  state: NotScorableState;
  url: string;
}

const REASON_LABELS: Record<NotScorableState['reason'], string> = {
  auth_gate: 'Authentication Required',
  insufficient_html: 'Insufficient Content',
  blocked_fetch: 'Access Blocked',
  redirect_loop: 'Redirect Loop',
  placeholder_page: 'Placeholder Page Detected',
  js_only_shell: 'JavaScript-Only Shell',
  login_required: 'Login Required',
  age_verification: 'Age Verification Required',
};

const REASON_ICONS: Record<NotScorableState['reason'], typeof AlertTriangle> = {
  auth_gate: XCircle,
  insufficient_html: AlertTriangle,
  blocked_fetch: XCircle,
  redirect_loop: AlertTriangle,
  placeholder_page: AlertTriangle,
  js_only_shell: AlertTriangle,
  login_required: XCircle,
  age_verification: AlertTriangle,
};

export function NotScorableDisplay({ state, url }: NotScorableDisplayProps) {
  const ReasonIcon = REASON_ICONS[state.reason] || AlertTriangle;
  
  return (
    <Card className="border-2 border-amber-500/30 bg-amber-500/5 p-6 sm:p-8">
      <div className="flex flex-col items-center text-center gap-6">
        {/* NOT SCORABLE Badge */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
            <ReasonIcon className="w-10 h-10 text-amber-500" />
          </div>
          <Badge 
            variant="outline" 
            className="text-lg px-4 py-2 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10"
          >
            NOT SCORABLE
          </Badge>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {REASON_LABELS[state.reason]}
          </h2>
          <p className="text-muted-foreground max-w-lg">
            {state.reasonDisplay}
          </p>
        </div>

        {/* Technical Details */}
        <div className="w-full max-w-md bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Analyzed URL:</span>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 truncate max-w-[200px]"
            >
              {url}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>
          {state.finalUrl && state.finalUrl !== url && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Final URL:</span>
              <span className="text-foreground truncate max-w-[200px]">{state.finalUrl}</span>
            </div>
          )}
          {state.httpStatus && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">HTTP Status:</span>
              <span className="text-foreground">{state.httpStatus}</span>
            </div>
          )}
          {state.htmlSizeKb !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">HTML Size:</span>
              <span className="text-foreground">{state.htmlSizeKb.toFixed(1)} KB</span>
            </div>
          )}
        </div>

        {/* Fix Instructions */}
        <div className="w-full max-w-lg bg-primary/5 border border-primary/20 rounded-lg p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            How to Fix This
          </h3>
          <ul className="space-y-2 text-left">
            {state.fixInstructions.map((instruction, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Info Note */}
        <p className="text-xs text-muted-foreground max-w-md">
          We only score pages we can access and read. If a site is behind login, blocked, 
          or returns only a placeholder/JS shell, we mark it NOT SCORABLE instead of guessing.
        </p>
      </div>
    </Card>
  );
}