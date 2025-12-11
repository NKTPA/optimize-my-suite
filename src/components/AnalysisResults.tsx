import { useState } from "react";
import {
  MessageSquare,
  MousePointerClick,
  Palette,
  Smartphone,
  Gauge,
  Search,
  Shield,
  Wrench,
  Quote,
  Target,
  FileText,
  Download,
  Cog,
  Loader2,
} from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { ImplementationPlan } from "@/types/implementation";
import { OverallScore } from "./OverallScore";
import { AnalysisSection } from "./AnalysisSection";
import { FindingsList } from "./FindingsList";
import { RecommendationCard } from "./RecommendationCard";
import { AIServicePitch } from "./AIServicePitch";
import { ImplementationPack } from "./ImplementationPack";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { generateAnalysisPdf } from "@/lib/generatePdf";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResultsProps {
  results: AnalysisResult;
  url: string;
}

export function AnalysisResults({ results, url }: AnalysisResultsProps) {
  const [implementationPlan, setImplementationPlan] = useState<ImplementationPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [implementationError, setImplementationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const { toast } = useToast();

  const handleExportPdf = () => {
    generateAnalysisPdf(results, url);
  };

  const handleGenerateImplementation = async () => {
    setIsGenerating(true);
    setImplementationError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-implementation-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            analysisResult: results,
            extractedData: {
              url,
              title: results.seo?.recommendedTitle,
              phone: results.conversion?.sampleButtons?.[0],
            },
            url,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate implementation plan");
      }

      const data = await response.json();
      setImplementationPlan(data);
      setActiveTab("implementation");
      toast({
        title: "Implementation Plan Ready",
        description: "Your implementation pack has been generated. Switch to the Implementation tab to view it.",
      });
    } catch (error) {
      console.error("Implementation generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setImplementationError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          onClick={handleGenerateImplementation}
          variant="outline"
          className="gap-2"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating implementation plan...
            </>
          ) : (
            <>
              <Cog className="w-4 h-4" />
              Generate Implementation Plan
            </>
          )}
        </Button>
        <Button onClick={handleExportPdf} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export PDF Report
        </Button>
      </div>

      {/* Error Message */}
      {implementationError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive text-sm">
          <strong>Error:</strong> {implementationError}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="analysis">Analysis Report</TabsTrigger>
          <TabsTrigger value="implementation" disabled={!implementationPlan}>
            Implementation Pack
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="mt-6">
          {/* Overall Summary */}
          <OverallScore
            score={results.summary.overallScore}
            overview={results.summary.overview}
            quickWins={results.summary.quickWins}
          />

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* Messaging & Offer Clarity */}
            <AnalysisSection
              icon={MessageSquare}
              title="Messaging & Offer Clarity"
              score={results.messaging.score}
              delay={100}
            >
              <FindingsList findings={results.messaging.findings} />
              <RecommendationCard title="Recommended Headline" content={results.messaging.recommendedHeadline} />
              <RecommendationCard
                title="Recommended Subheadline"
                content={results.messaging.recommendedSubheadline}
              />
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Elevator Pitch
                </h4>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  "{results.messaging.elevatorPitch}"
                </p>
              </div>
            </AnalysisSection>

            {/* Conversion / Lead Capture */}
            <AnalysisSection
              icon={MousePointerClick}
              title="Conversion & Lead Capture"
              score={results.conversion.score}
              delay={200}
            >
              <FindingsList findings={results.conversion.findings} />
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Recommendations</h4>
                <ul className="space-y-1.5">
                  {results.conversion.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-foreground mr-2">Sample CTAs:</span>
                {results.conversion.sampleButtons.map((btn, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full"
                  >
                    {btn}
                  </span>
                ))}
              </div>
            </AnalysisSection>

            {/* Design & UX */}
            <AnalysisSection
              icon={Palette}
              title="Design & User Experience"
              score={results.designUx.score}
              delay={300}
            >
              <FindingsList findings={results.designUx.findings} />
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Design Recommendations</h4>
                <ul className="space-y-1.5">
                  {results.designUx.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Palette className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </AnalysisSection>

            {/* Mobile Experience */}
            <AnalysisSection
              icon={Smartphone}
              title="Mobile Experience"
              score={results.mobile.score}
              delay={400}
            >
              <FindingsList findings={results.mobile.findings} />
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Mobile Fixes</h4>
                <ul className="space-y-1.5">
                  {results.mobile.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Smartphone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </AnalysisSection>

            {/* Speed & Performance */}
            <AnalysisSection
              icon={Gauge}
              title="Speed & Performance"
              score={results.performance.score}
              delay={500}
            >
              <FindingsList findings={results.performance.findings} />
              {results.performance.heavyImages.length > 0 && (
                <div className="bg-warning/10 rounded-lg p-3">
                  <h4 className="font-semibold text-foreground mb-2 text-sm">Heavy Images Detected</h4>
                  <ul className="space-y-1">
                    {results.performance.heavyImages.map((img, index) => (
                      <li key={index} className="text-xs text-muted-foreground truncate">
                        {img}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Performance Tips</h4>
                <ul className="space-y-1.5">
                  {results.performance.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Gauge className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </AnalysisSection>

            {/* SEO & Local SEO */}
            <AnalysisSection icon={Search} title="SEO & Local SEO" score={results.seo.score} delay={600}>
              <FindingsList findings={results.seo.findings} />
              <RecommendationCard title="Recommended Title Tag" content={results.seo.recommendedTitle} />
              <RecommendationCard
                title="Recommended Meta Description"
                content={results.seo.recommendedMetaDescription}
              />
              <RecommendationCard title="Recommended H1" content={results.seo.recommendedH1} />
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-foreground mr-2">Target Keywords:</span>
                {results.seo.keywords.map((kw, index) => (
                  <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                    {kw}
                  </span>
                ))}
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Local SEO Checklist</h4>
                <ul className="space-y-1.5">
                  {results.seo.checklist.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Search className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnalysisSection>

            {/* Trust & Credibility */}
            <AnalysisSection
              icon={Shield}
              title="Trust & Credibility"
              score={results.trust.score}
              delay={700}
            >
              <FindingsList findings={results.trust.findings} />
              <div className="bg-success/10 rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-3">Recommended "Why Choose Us" Section</h4>
                <ul className="space-y-2">
                  {results.trust.whyChooseUs.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-primary" />
                  Sample Testimonials Block
                </h4>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  {results.trust.testimonialsBlock}
                </p>
              </div>
            </AnalysisSection>

            {/* Technical / Basics */}
            <AnalysisSection icon={Wrench} title="Technical Basics" delay={800}>
              <FindingsList findings={results.technical.findings} />
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Technical Recommendations</h4>
                <ul className="space-y-1.5">
                  {results.technical.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Wrench className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </AnalysisSection>
          </div>

          {/* AI Service Pitch */}
          <div className="mt-6">
            <AIServicePitch paragraph={results.aiServicePitch.paragraph} bullets={results.aiServicePitch.bullets} />
          </div>
        </TabsContent>

        <TabsContent value="implementation" className="mt-6">
          {implementationPlan && <ImplementationPack plan={implementationPlan} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
