import { useState, useRef } from "react";
import { Palette, Upload, Loader2, Save, Image, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { FeatureLock } from "@/components/entitlements/FeatureLock";
import { supabase } from "@/integrations/supabase/client";

export function BrandingSettings() {
  const { workspace, branding, limits, updateBranding } = useWorkspace();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [agencyName, setAgencyName] = useState(branding?.agency_name || "");
  const [footerText, setFooterText] = useState(branding?.footer_text || "");
  const [primaryColor, setPrimaryColor] = useState(branding?.primary_color || "#1e3a5f");
  const [accentColor, setAccentColor] = useState(branding?.accent_color || "#3b82f6");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(branding?.logo_url || "");

  const hasWhiteLabel = limits.hasWhiteLabelPdf;
  const hasCustom = limits.hasCustomBranding;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        agency_name: agencyName.trim() || null,
        footer_text: footerText.trim() || null,
      };
      if (hasCustom) {
        payload.primary_color = primaryColor;
        payload.accent_color = accentColor;
      }
      await updateBranding(payload as never);

      toast({
        title: "Branding Updated",
        description: "Your PDF branding settings have been saved.",
      });
    } catch (error) {
      console.error("Branding save error:", error);
      toast({
        title: "Save Failed",
        description: "Could not save branding settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspace) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (PNG, JPG, or SVG).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo must be under 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create a local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Note: In production, you would upload to Supabase Storage
      // For now, we'll use base64 encoding (not recommended for production)
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      await updateBranding({ logo_url: base64 });

      toast({
        title: "Logo Uploaded",
        description: "Your logo has been saved and will appear on PDF reports.",
      });
    } catch (error) {
      console.error("Logo upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          PDF Branding
        </CardTitle>
        <CardDescription>
          Customize your white-label PDF reports with your agency's branding.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agency Name */}
        <div className="space-y-2">
          <Label htmlFor="agencyName">Agency Name</Label>
          <Input
            id="agencyName"
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            placeholder="Your Agency, Inc."
          />
          <p className="text-xs text-muted-foreground">
            Shown in the "Prepared by" block on PDF reports. Setting this removes the OptimizeMySuite wordmark.
          </p>
        </div>

        {/* Footer Text */}
        <div className="space-y-2">
          <Label htmlFor="footerText">PDF Footer Text</Label>
          <Input
            id="footerText"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="© 2025 Your Agency Name | yourwebsite.com"
          />
          <p className="text-xs text-muted-foreground">
            This text appears at the bottom of every page in your PDF reports.
          </p>
        </div>

        {/* Logo Upload (Pro/Scale only) */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              Agency Logo
              {!hasCustom && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
            </Label>
            {!hasCustom && (
              <span className="text-xs text-muted-foreground">Upgrade to Pro</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div 
              className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => hasCustom && fileInputRef.current?.click()}
            >
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Image className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={!hasCustom}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !hasCustom}
                className="gap-2"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Logo
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                PNG, JPG, or SVG. Max 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Color Pickers (Pro/Scale only) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              Brand Colors
              {!hasCustom && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
            </Label>
            {!hasCustom && (
              <span className="text-xs text-muted-foreground">Upgrade to Pro</span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded border-0 cursor-pointer"
                disabled={!hasCustom}
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1"
                disabled={!hasCustom}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="accentColor"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-10 h-10 rounded border-0 cursor-pointer"
                disabled={!hasCustom}
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1"
                disabled={!hasCustom}
              />
            </div>
          </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasWhiteLabel}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Branding
        </Button>
      </CardContent>
    </Card>
  );

  if (!hasWhiteLabel) {
    return (
      <FeatureLock
        feature="hasWhiteLabelPdf"
        featureLabel="White-Label PDF Branding"
        showLockIcon={false}
      >
        {content}
      </FeatureLock>
    );
  }

  return content;
}
