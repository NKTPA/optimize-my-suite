import { Info, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type CredibilityDisplayMode = "short" | "standard";

interface ScoreCredibilityStatementProps {
  mode?: CredibilityDisplayMode;
  className?: string;
}

// Approved Score Credibility language - CANONICAL COPY (used across app, PDFs, and pricing)
// DO NOT MODIFY without updating all references
export const CREDIBILITY_BODY = `OptimizeMySuite evaluates websites using objective, criteria-based signals across messaging clarity, conversion paths, trust signals, SEO fundamentals, and technical accessibility. The same scoring methodology is applied before and after improvements to ensure fair comparison. Pages that cannot be accessed publicly are marked as Not Scorable rather than penalized. Scores are never guessed or manually adjusted.`;

export const CREDIBILITY_FOOTER = `Built for agencies to justify recommendations with clear, repeatable evidence.`;

// Legacy export - now uses canonical copy
export const CREDIBILITY_SHORT = CREDIBILITY_BODY;

export const CREDIBILITY_STANDARD = {
  intro: "Scoring Methodology & Credibility",
  description: CREDIBILITY_BODY,
  bullets: [] as string[], // No bullets - body copy is the complete statement
  footer: CREDIBILITY_FOOTER,
};

/**
 * Score Credibility Statement component
 * Displays trust-building language explaining scoring methodology
 */
export function ScoreCredibilityStatement({
  mode = "standard",
  className = "",
}: ScoreCredibilityStatementProps) {
  if (mode === "short") {
    return (
      <div className={`flex items-start gap-3 bg-muted/50 rounded-lg p-4 ${className}`}>
        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {CREDIBILITY_BODY}
          </p>
          <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border/30">
            {CREDIBILITY_FOOTER}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">
              {CREDIBILITY_STANDARD.intro}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {CREDIBILITY_BODY}
            </p>
            <p className="text-sm text-muted-foreground italic border-t border-primary/10 pt-3 mt-3">
              {CREDIBILITY_FOOTER}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
