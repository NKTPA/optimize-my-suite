import { useState } from "react";
import { BatchSite } from "@/types/batch";
import { FindingInput } from "@/types/analysis";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Download, 
  Loader2,
  MessageSquare,
  Target,
  Palette,
  Smartphone,
  Zap,
  Search,
  AlertTriangle
} from "lucide-react";

interface BatchSummaryCardProps {
  site: BatchSite;
  index: number;
  onGenerateImplementation: (site: BatchSite) => void;
  onDownloadPdf: (site: BatchSite) => void;
  isGenerating: boolean;
}

function getFindingText(f: FindingInput): string {
  if (typeof f === "string") return f;
  return f.text;
}

function ScoreIndicator({ score, label, icon: Icon }: { score: number; label: string; icon: React.ElementType }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-500";
    if (s >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (s: number) => {
    if (s >= 80) return "bg-green-500/10";
    if (s >= 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  return (
    <div className={`flex items-center gap-2 p-2 rounded-md ${getScoreBg(score)}`}>
      <Icon className={`w-4 h-4 ${getScoreColor(score)}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`font-bold ml-auto ${getScoreColor(score)}`}>{score}</span>
    </div>
  );
}

function getOverallGrade(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: "A+", color: "text-green-500" };
  if (score >= 80) return { grade: "A", color: "text-green-500" };
  if (score >= 70) return { grade: "B", color: "text-yellow-500" };
  if (score >= 60) return { grade: "C", color: "text-yellow-600" };
  if (score >= 50) return { grade: "D", color: "text-orange-500" };
  return { grade: "F", color: "text-red-500" };
}

export function BatchSummaryCard({
  site,
  index,
  onGenerateImplementation,
  onDownloadPdf,
  isGenerating,
}: BatchSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const analysis = site.analysisResult;

  if (!analysis) return null;

  const overallScore = analysis.summary?.overallScore ?? 0;
  const { grade, color } = getOverallGrade(overallScore);

  // Collect top 5 issues from all findings
  const allIssues: string[] = [];
  
  if (analysis.messaging?.findings) {
    allIssues.push(...analysis.messaging.findings.slice(0, 1).map(getFindingText));
  }
  if (analysis.conversion?.findings) {
    allIssues.push(...analysis.conversion.findings.slice(0, 1).map(getFindingText));
  }
  if (analysis.designUx?.findings) {
    allIssues.push(...analysis.designUx.findings.slice(0, 1).map(getFindingText));
  }
  if (analysis.mobile?.findings) {
    allIssues.push(...analysis.mobile.findings.slice(0, 1).map(getFindingText));
  }
  if (analysis.performance?.findings) {
    allIssues.push(...analysis.performance.findings.slice(0, 1).map(getFindingText));
  }
  if (analysis.seo?.findings) {
    allIssues.push(...analysis.seo.findings.slice(0, 1).map(getFindingText));
  }

  const topIssues = allIssues.slice(0, 5);

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors py-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground w-8">#{index + 1}</span>
            <div>
              <h3 className="font-semibold text-foreground">
                {site.name || new URL(site.url).hostname}
              </h3>
              <p className="text-sm text-muted-foreground truncate max-w-[400px]">{site.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className={`text-2xl font-bold ${color}`}>{grade}</span>
              <p className="text-xs text-muted-foreground">{overallScore}/100</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 pb-4 space-y-4">
          {/* Score Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <ScoreIndicator 
              score={analysis.messaging?.score ?? 0} 
              label="Messaging" 
              icon={MessageSquare} 
            />
            <ScoreIndicator 
              score={analysis.conversion?.score ?? 0} 
              label="Conversion" 
              icon={Target} 
            />
            <ScoreIndicator 
              score={analysis.designUx?.score ?? 0} 
              label="Design" 
              icon={Palette} 
            />
            <ScoreIndicator 
              score={analysis.mobile?.score ?? 0} 
              label="Mobile" 
              icon={Smartphone} 
            />
            <ScoreIndicator 
              score={analysis.performance?.score ?? 0} 
              label="Performance" 
              icon={Zap} 
            />
            <ScoreIndicator 
              score={analysis.seo?.score ?? 0} 
              label="SEO" 
              icon={Search} 
            />
          </div>

          {/* Quick Overview */}
          {analysis.summary?.overview && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">{analysis.summary.overview}</p>
            </div>
          )}

          {/* Top 5 Issues */}
          {topIssues.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Top Issues to Fix
              </h4>
              <ul className="space-y-1.5">
                {topIssues.map((issue, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Badge variant="outline" className="text-xs px-1.5 py-0 mt-0.5">
                      {i + 1}
                    </Badge>
                    <span className="line-clamp-2">{typeof issue === 'string' ? issue : String(issue)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Wins */}
          {analysis.summary?.quickWins && analysis.summary.quickWins.length > 0 && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-green-600 mb-2">Quick Recommendation</h4>
              <p className="text-sm text-muted-foreground">{analysis.summary.quickWins[0]}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {site.implementationPlan ? (
              <Badge variant="secondary" className="text-xs">
                Implementation Pack Ready
              </Badge>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerateImplementation(site);
                }}
                disabled={isGenerating}
                size="sm"
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate Implementation Pack
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadPdf(site);
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
