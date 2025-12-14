import { Info, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type CredibilityDisplayMode = "short" | "standard";

interface ScoreCredibilityStatementProps {
  mode?: CredibilityDisplayMode;
  className?: string;
}

// Approved Score Credibility language
export const CREDIBILITY_SHORT = `Our scores are based on objective, industry-standard criteria for website performance, user experience, and conversion optimization. Each factor is weighted according to its proven impact on business outcomes for local service businesses. We only score pages we can fully access—sites behind logins, paywalls, or with insufficient content are marked 'Not Scorable' rather than receiving an artificial score.`;

export const CREDIBILITY_STANDARD = {
  intro: "How We Calculate Your Score",
  description: "Our scoring methodology is designed to provide actionable, defensible insights based on proven best practices:",
  bullets: [
    "We evaluate 8 key areas: Messaging, Conversion, Design, Mobile, Performance, SEO, Trust, and Technical fundamentals",
    "Each category is scored 0-100 based on industry-standard benchmarks and research-backed criteria",
    "Scores reflect real-world factors that directly impact lead generation and customer conversion",
    "We only score pages we can fully access—sites behind logins, paywalls, or with insufficient content are marked 'Not Scorable' rather than receiving an artificial score",
    "Preview and staging environments are evaluated separately from production sites to ensure fair comparisons",
    "'Not Scorable' is not a negative score—it simply means we couldn't access enough content to provide an accurate analysis",
  ],
  footer: "This approach ensures your score represents genuine strengths and opportunities, not guesswork.",
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
        <p className="text-sm text-muted-foreground leading-relaxed">
          {CREDIBILITY_SHORT}
        </p>
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
            <p className="text-sm text-muted-foreground">
              {CREDIBILITY_STANDARD.description}
            </p>
            <ul className="space-y-2">
              {CREDIBILITY_STANDARD.bullets.map((bullet, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground italic border-t border-primary/10 pt-3 mt-3">
              {CREDIBILITY_STANDARD.footer}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
