import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Building2, Lock, CreditCard, Save, Loader2, Eye, EyeOff, Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ApiAccess } from "@/components/settings/ApiAccess";

export default function DashboardAccount() {
  const { user, profile, signOut, isLoading: authLoading } = useAuth();
  const { plan, subscribed, isTrial, subscriptionEnd } = useSubscription();
  const { workspace, branding, updateBranding } = useWorkspace();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [agencyWebsite, setAgencyWebsite] = useState("");
  const [brandColor, setBrandColor] = useState("#3b82f6");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setAgencyName(profile.agency_name || "");
      setAgencyWebsite(profile.agency_website || "");
    }
  }, [profile]);

  useEffect(() => {
    if (branding) {
      setBrandColor(branding.accent_color || "#3b82f6");
      setLogoPreview(branding.logo_url || null);
    }
  }, [branding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PNG, JPG, or SVG file.",
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

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      // Upload to Supabase Storage
      // NOTE: The agency-logos bucket is intentionally public for reads.
      // Logos must be accessible via public URL for PDF report generation
      // (generated PDFs embed logo URLs that are rendered outside authenticated contexts).
      // Write access is restricted to authenticated users via storage RLS policies.
      const { error: uploadError } = await supabase.storage
        .from("agency-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("agency-logos")
        .getPublicUrl(filePath);

      const logoUrl = urlData.publicUrl;

      // Update branding with logo URL
      await updateBranding({ logo_url: logoUrl });
      setLogoPreview(logoUrl);

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
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    if (!user) return;

    try {
      // Remove from storage
      const { error: deleteError } = await supabase.storage
        .from("agency-logos")
        .remove([`${user.id}/logo.png`, `${user.id}/logo.jpg`, `${user.id}/logo.svg`]);

      // Update branding to remove logo URL
      await updateBranding({ logo_url: null });
      setLogoPreview(null);

      toast({
        title: "Logo Removed",
        description: "Your logo has been removed.",
      });
    } catch (error) {
      console.error("Logo removal error:", error);
      toast({
        title: "Removal Failed",
        description: "Could not remove logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          agency_name: agencyName.trim(),
          agency_website: agencyWebsite.trim() || null,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update branding with brand color
      await updateBranding({ accent_color: brandColor });

      toast({
        title: "Profile Updated",
        description: "Your agency profile has been saved.",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description: "Could not save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Incorrect Current Password",
          description: "The current password you entered is incorrect.",
          variant: "destructive",
        });
        return;
      }

      // Now update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password change error:", error);
      toast({
        title: "Password Change Failed",
        description: error instanceof Error ? error.message : "Could not change password.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleManageBilling = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Billing portal error:", error);
      toast({
        title: "Billing Portal Error",
        description: "Could not open billing portal. You may not have an active subscription.",
        variant: "destructive",
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleSignOut = async () => {
    // Navigate FIRST before auth state changes trigger ProtectedRoute redirect
    navigate("/", { replace: true });
    await signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your agency profile, password, and billing.</p>
        </div>

        <div className="space-y-6">
          {/* Current Plan */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your subscription status</CardDescription>
                </div>
                <Badge variant={isTrial ? "outline" : "default"} className="text-sm capitalize">
                  {isTrial ? "Trial" : plan || "No Plan"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  {isTrial && (
                    <p className="text-sm text-muted-foreground">
                      Your 3-day free trial is active. Add a payment method to continue after trial.
                    </p>
                  )}
                  {subscribed && !isTrial && subscriptionEnd && (
                    <p className="text-sm text-muted-foreground">
                      Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                    </p>
                  )}
                  {!subscribed && !isTrial && (
                    <p className="text-sm text-muted-foreground">
                      No active subscription. Choose a plan to access all features.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {(!subscribed || isTrial) && (
                    <Button onClick={() => navigate("/pricing")} size="sm">
                      {isTrial ? "Add Payment Method" : "Choose Plan"}
                    </Button>
                  )}
                  {subscribed && (
                    <Button onClick={handleManageBilling} disabled={isOpeningPortal} variant="outline" size="sm">
                      {isOpeningPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : "Manage Billing"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agency Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Agency Profile
              </CardTitle>
              <CardDescription>Update your agency information for white-label reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Acme Marketing Agency"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyWebsite">Agency Website (optional)</Label>
                <Input
                  id="agencyWebsite"
                  value={agencyWebsite}
                  onChange={(e) => setAgencyWebsite(e.target.value)}
                  placeholder="https://acmeagency.com"
                />
              </div>

              {/* Brand Logo Upload */}
              <div className="space-y-2">
                <Label>Brand Logo</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <Image className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="gap-2"
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Upload Logo
                      </Button>
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="text-destructive gap-1"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, or SVG (max 2MB). This logo appears on your white-label PDF reports.
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand Color */}
              <div className="space-y-2">
                <Label htmlFor="brandColor">Brand Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="brandColor"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-10 h-10 rounded border-0 cursor-pointer"
                  />
                  <Input
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="w-28"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Used as the accent color in your PDF reports.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={user.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Contact support to change your email.</p>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="gap-2">
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button 
                onClick={handleChangePassword} 
                disabled={isChangingPassword || !currentPassword.trim()} 
                variant="outline" 
                className="gap-2"
              >
                {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Change Password
              </Button>
            </CardContent>
          </Card>

          {/* API Access (Coming Soon) */}
          <ApiAccess />

          {/* Sign Out - Simple text button */}
          <div className="pt-4 border-t border-border">
            <button
              onClick={handleSignOut}
              className="text-sm text-destructive/80 hover:text-destructive hover:underline transition-colors"
            >
              Sign out of your account
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
