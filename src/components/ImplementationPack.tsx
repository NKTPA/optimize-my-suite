import { ImplementationPlan } from "@/types/implementation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  FileText,
  MousePointerClick,
  Search,
  Palette,
  Wrench,
  CheckSquare,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ImplementationPackProps {
  plan: ImplementationPlan;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 text-muted-foreground hover:text-foreground"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

function CopyableBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="bg-muted rounded-lg p-4 relative group">
      <div className="flex justify-between items-start gap-2 mb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <CopyButton text={content} />
      </div>
      <p className="text-sm text-foreground leading-relaxed">{content}</p>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function ImplementationPack({ plan }: ImplementationPackProps) {
  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Implementation Pack</h2>
        <p className="text-muted-foreground">
          Ready-to-apply copy and specifications. Click the copy icon to grab any section.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hero Section */}
        <Section icon={Sparkles} title="Hero Section">
          <CopyableBlock label="Headline" content={plan.heroSection.headline} />
          <CopyableBlock label="Subheadline" content={plan.heroSection.subheadline} />
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Supporting Bullets
            </span>
            <ul className="space-y-1.5">
              {plan.heroSection.supportingBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground bg-muted rounded-lg p-2">
                  <span className="text-primary">•</span>
                  {bullet}
                  <CopyButton text={bullet} />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[150px]">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Primary CTA
              </span>
              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium text-center flex items-center justify-between">
                {plan.heroSection.primaryCTA}
                <CopyButton text={plan.heroSection.primaryCTA} />
              </div>
            </div>
            <div className="flex-1 min-w-[150px]">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                Secondary CTA
              </span>
              <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium text-center flex items-center justify-between">
                {plan.heroSection.secondaryCTA}
                <CopyButton text={plan.heroSection.secondaryCTA} />
              </div>
            </div>
          </div>
        </Section>

        {/* Key Pages Copy */}
        <Section icon={FileText} title="Key Pages Copy">
          <div className="space-y-4">
            <div className="border-b border-border pb-4">
              <h4 className="font-semibold text-foreground mb-3">Homepage</h4>
              <CopyableBlock label="Intro Paragraph" content={plan.keyPages.home.intro} />
              <div className="mt-3">
                <CopyableBlock label="Services Overview" content={plan.keyPages.home.servicesOverview} />
              </div>
              <div className="mt-3 space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Why Choose Us
                </span>
                {plan.keyPages.home.whyChooseUs.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted rounded-lg p-2 text-sm">
                    <span className="text-foreground">{item}</span>
                    <CopyButton text={item} />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b border-border pb-4">
              <h4 className="font-semibold text-foreground mb-3">About Page</h4>
              <CopyableBlock label="Headline" content={plan.keyPages.aboutPage.headline} />
              <div className="mt-3">
                <CopyableBlock label="Body" content={plan.keyPages.aboutPage.body} />
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Contact Page</h4>
              <CopyableBlock label="Headline" content={plan.keyPages.contactPage.headline} />
              <div className="mt-3">
                <CopyableBlock label="Body" content={plan.keyPages.contactPage.body} />
              </div>
            </div>
          </div>
        </Section>

        {/* Forms & CTAs */}
        <Section icon={MousePointerClick} title="Forms & CTAs">
          <CopyableBlock label="Primary Phone Number" content={plan.formsAndCTAs.primaryPhoneNumber} />
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Contact Form Fields
            </span>
            <div className="flex flex-wrap gap-2">
              {plan.formsAndCTAs.contactFormSpec.fields.map((field, i) => (
                <span key={i} className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full">
                  {field}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic">{plan.formsAndCTAs.contactFormSpec.notes}</p>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CTA Buttons</span>
            <div className="flex flex-wrap gap-2">
              {plan.formsAndCTAs.ctaButtons.map((cta, i) => (
                <div key={i} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                  {cta}
                  <CopyButton text={cta} />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Placement Guidelines
            </span>
            <ul className="space-y-1.5">
              {plan.formsAndCTAs.placementGuidelines.map((guide, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">→</span>
                  {guide}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* SEO Setup */}
        <Section icon={Search} title="SEO Setup">
          <div className="space-y-3">
            <CopyableBlock label="Title Tag" content={plan.seoSetup.home.title} />
            <CopyableBlock label="Meta Description" content={plan.seoSetup.home.metaDescription} />
            <CopyableBlock label="H1 Heading" content={plan.seoSetup.home.h1} />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Other SEO Suggestions
            </span>
            <ul className="space-y-1.5">
              {plan.seoSetup.otherSuggestions.map((sug, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Search className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {sug}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Image Alt Text Examples
            </span>
            {plan.seoSetup.imageAltTextExamples.map((ex, i) => (
              <div key={i} className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">{ex.forImageType}</p>
                <p className="text-sm text-foreground">alt="{ex.altText}"</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Design & Layout */}
        <Section icon={Palette} title="Design & Layout Tweaks">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Suggested Color Palette
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Primary</div>
                <div className="bg-muted rounded-lg p-2 text-sm font-mono text-foreground">
                  {plan.designAndLayout.colorPaletteSuggestion.primary}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Secondary</div>
                <div className="bg-muted rounded-lg p-2 text-sm font-mono text-foreground">
                  {plan.designAndLayout.colorPaletteSuggestion.secondary}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Accent</div>
                <div className="bg-muted rounded-lg p-2 text-sm font-mono text-foreground">
                  {plan.designAndLayout.colorPaletteSuggestion.accent}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Layout Changes</span>
            <ul className="space-y-1.5">
              {plan.designAndLayout.layoutChanges.map((change, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Palette className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {change}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Technical Fixes */}
        <Section icon={Wrench} title="Technical Fixes">
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks</span>
            <ul className="space-y-1.5">
              {plan.technicalFixes.tasks.map((task, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <Wrench className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {task}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority Order</span>
            <ol className="space-y-1.5">
              {plan.technicalFixes.priorityOrder.map((priority, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {priority}
                </li>
              ))}
            </ol>
          </div>
        </Section>
      </div>

      {/* Execution Checklist - Full Width */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckSquare className="w-5 h-5 text-primary" />
            Execution Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plan.executionChecklist.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-muted rounded-lg p-3"
              >
                <span className="bg-primary text-primary-foreground text-xs w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
