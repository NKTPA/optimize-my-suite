import { useState, useRef } from "react";
import { Palette, Upload, Loader2, Save, Image } from "lucide-react";
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

  const [footerText, setFooterText] = useState(branding?.footer_text || "");
  const [primaryColor, setPrimaryColor] = useState(branding?.primary_color || "#1e3a5f");
  const [accentColor, setAccentColor] = useState(branding?.accent_color || "#3b82f6");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(branding?.logo_url || "");

  const hasAccess = limits.hasCustomBranding;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBranding({
        footer_text: footerText.trim() || null,
        primary_color: primaryColor,
        accent_color: accentColor,
      });

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
        {/* Logo Upload */}
        <div className="space-y-3">
          <Label>Agency Logo</Label>
          <div className="flex items-center gap-4">
            <div 
              className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => hasAccess && fileInputRef.current?.click()}
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
                disabled={!hasAccess}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !hasAccess}
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

        {/* Footer Text */}
        <div className="space-y-2">
          <Label htmlFor="footerText">PDF Footer Text</Label>
          <Input
            id="footerText"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            placeholder="© 2025 Your Agency Name | yourwebsite.com"
            disabled={!hasAccess}
          />
          <p className="text-xs text-muted-foreground">
            This text appears at the bottom of every page in your PDF reports.
          </p>
        </div>

        {/* Color Pickers */}
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
                disabled={!hasAccess}
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1"
                disabled={!hasAccess}
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
                disabled={!hasAccess}
              />
              <Input
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1"
                disabled={!hasAccess}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasAccess}
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

  if (!hasAccess) {
    return (
      <FeatureLock
        feature="hasCustomBranding"
        featureLabel="Custom PDF Branding"
        showLockIcon={false}
      >
        {content}
      </FeatureLock>
    );
  }

  return content;
}
