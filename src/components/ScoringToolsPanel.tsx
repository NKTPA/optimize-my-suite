import { useState } from "react";
import { Beaker, GitCompare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PreviewTestModal } from "./scoring/PreviewTestModal";
import { ScoreCompareModal } from "./scoring/ScoreCompareModal";
import { AnalysisResult } from "@/types/analysis";

interface ScoringToolsPanelProps {
  currentUrl: string;
  currentResults: AnalysisResult;
  originalUrl?: string;
}

export function ScoringToolsPanel({ currentUrl, currentResults, originalUrl }: ScoringToolsPanelProps) {
  const [showPreviewTest, setShowPreviewTest] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  return (
    <>
      <Card className="border-dashed border-border/60 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Beaker className="w-4 h-4 text-primary" />
            Scoring Tools
          </CardTitle>
          <CardDescription className="text-xs">
            Test and compare scores across environments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreviewTest(true)}
              className="gap-2"
            >
              <Beaker className="w-3.5 h-3.5" />
              Test preview environment scoring
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCompare(true)}
              className="gap-2"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare production vs preview scores
            </Button>
          </div>
          
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-background/50 rounded-lg p-3 border border-border/40">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p>
              <strong>Tip:</strong> preview--*.lovable.app links can require authentication. 
              If the analyzer sees a Lovable placeholder page, publish the site or use the public deployment/custom domain.
            </p>
          </div>
        </CardContent>
      </Card>

      <PreviewTestModal
        open={showPreviewTest}
        onClose={() => setShowPreviewTest(false)}
        currentUrl={currentUrl}
      />

      <ScoreCompareModal
        open={showCompare}
        onClose={() => setShowCompare(false)}
        currentUrl={currentUrl}
        originalUrl={originalUrl}
      />
    </>
  );
}
