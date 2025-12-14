import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import { supabase } from "@/integrations/supabase/client";
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  agencyName: z.string().min(1, "Agency name is required"),
  agencyWebsite: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Check URL for tab parameter
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get("tab") === "signup" ? "signup" : "login";
  
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupAgencyName, setSignupAgencyName] = useState("");
  const [signupAgencyWebsite, setSignupAgencyWebsite] = useState("");
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate("/dashboard/analyze");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validation = loginSchema.safeParse({
      email: loginEmail,
      password: loginPassword,
    });

    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(error.message);
      }
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in to your agency dashboard.",
      });
      navigate("/dashboard/analyze");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotPasswordSuccess(false);

    const emailValidation = z.string().email("Please enter a valid email address").safeParse(forgotPasswordEmail);
    if (!emailValidation.success) {
      setError(emailValidation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    // Always show success message regardless of whether email exists (security best practice)
    await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setIsSubmitting(false);

    // Always show success - prevents account enumeration attacks
    setForgotPasswordSuccess(true);
    toast({
      title: "Request received",
      description: "If this email is registered, you'll receive a reset link shortly.",
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = signupSchema.safeParse({
      agencyName: signupAgencyName,
      agencyWebsite: signupAgencyWebsite,
      firstName: signupFirstName,
      lastName: signupLastName,
      email: signupEmail,
      password: signupPassword,
      confirmPassword: signupConfirmPassword,
    });

    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    const { error } = await signUp(signupEmail, signupPassword, {
      first_name: signupFirstName,
      last_name: signupLastName,
      agency_name: signupAgencyName,
      agency_website: signupAgencyWebsite || undefined,
    });
    setIsSubmitting(false);

    if (error) {
      if (error.message.includes("User already registered")) {
        setError("This email is already registered. Please log in instead.");
      } else {
        setError(error.message);
      }
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to OptimizeMySuite. Let's start auditing client websites.",
      });
      navigate("/dashboard/analyze");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,_hsl(221_83%_53%_/_0.15),_transparent)]" />

      <div className="container relative py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <HeaderBrand variant="auth" textFallback />
            </div>
            <p className="text-muted-foreground">
              Audit client websites instantly. Win more retainers.
            </p>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardHeader className="pb-4">
              <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "login" | "signup"); setError(null); }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Create Account</TabsTrigger>
                </TabsList>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <TabsContent value="login" className="mt-4">
                  <CardTitle className="text-lg">Welcome back</CardTitle>
                  <CardDescription>
                    Login to access your agency dashboard
                  </CardDescription>
                </TabsContent>

                <TabsContent value="signup" className="mt-4">
                  <CardTitle className="text-lg">Create Agency Account</CardTitle>
                  <CardDescription>
                    Start auditing client websites in minutes
                  </CardDescription>
                </TabsContent>
              </Tabs>
            </CardHeader>

            <CardContent>
              {activeTab === "login" ? (
                showForgotPassword ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {forgotPasswordSuccess ? (
                      <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>
                          If the email address you entered is registered, you'll receive a password reset email shortly. Please check your inbox and spam folder.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Email</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="you@agency.com"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Send Reset Link"
                          )}
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordSuccess(false);
                        setForgotPasswordEmail("");
                        setError(null);
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@agency.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setError(null);
                            setForgotPasswordEmail(loginEmail);
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login to Your Agency Dashboard"
                      )}
                    </Button>
                  </form>
                )
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-first-name">First Name *</Label>
                      <Input
                        id="signup-first-name"
                        placeholder="John"
                        value={signupFirstName}
                        onChange={(e) => setSignupFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-last-name">Last Name *</Label>
                      <Input
                        id="signup-last-name"
                        placeholder="Smith"
                        value={signupLastName}
                        onChange={(e) => setSignupLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-agency-name">Agency Name *</Label>
                    <Input
                      id="signup-agency-name"
                      placeholder="Smith Digital Marketing"
                      value={signupAgencyName}
                      onChange={(e) => setSignupAgencyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-agency-website">Agency Website (optional)</Label>
                    <Input
                      id="signup-agency-website"
                      placeholder="https://smithdigital.com"
                      value={signupAgencyWebsite}
                      onChange={(e) => setSignupAgencyWebsite(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@agency.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password *</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm *</Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Agency Account"
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
