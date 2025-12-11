import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { WebsiteBlueprint } from "@/types/blueprint";

interface BlueprintDisplayProps {
  blueprint: WebsiteBlueprint;
  businessName: string;
}

export function BlueprintDisplay({ blueprint, businessName }: BlueprintDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Website Blueprint</h2>
        <p className="text-muted-foreground">Generated for {businessName}</p>
      </div>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">Hero Section</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Headline</p>
            <p className="text-lg font-semibold">{blueprint.hero.headline}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Subheadline</p>
            <p>{blueprint.hero.subheadline}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Bullet Points</p>
            <ul className="list-disc list-inside space-y-1">
              {blueprint.hero.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Primary CTA</p>
              <p className="font-medium text-primary">{blueprint.hero.primaryCTA}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Secondary CTA</p>
              <p>{blueprint.hero.secondaryCTA}</p>
            </div>
          </div>
          {blueprint.hero.offerBadge && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Offer Badge</p>
              <Badge variant="outline">{blueprint.hero.offerBadge}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">Navigation</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {blueprint.navigation.map((item, i) => (
              <Badge key={i} variant="outline">{item}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pages */}
      {Object.entries(blueprint.pages).map(([pageKey, page]) => (
        <Card key={pageKey}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{pageKey} Page</Badge>
              <span className="text-lg">{page.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">SEO Title</p>
                <p className="text-sm font-mono">{page.seoTitle}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Meta Description</p>
                <p className="text-sm font-mono">{page.metaDescription}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              {page.sections.map((section, i) => (
                <div key={i}>
                  <p className="text-sm font-semibold text-foreground">{section.name}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Technical Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="secondary">Technical Notes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Layout</p>
            <p>{blueprint.technical.layout}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Performance Recommendations</p>
            <ul className="list-disc list-inside space-y-1">
              {blueprint.technical.performance.map((item, i) => (
                <li key={i} className="text-sm">{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Accessibility Guidelines</p>
            <ul className="list-disc list-inside space-y-1">
              {blueprint.technical.accessibility.map((item, i) => (
                <li key={i} className="text-sm">{item}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
