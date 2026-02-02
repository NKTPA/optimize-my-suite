import { Link, useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { 
  Globe, 
  History, 
  Layers, 
  LogOut, 
  CreditCard,
  LayoutDashboard,
  Settings,
  User,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { TrialBanner } from "@/components/entitlements/TrialBanner";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { plan, isTrial, subscribed } = useSubscription();
  const { workspace, usage, isTrialExpired } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    // Navigate FIRST before auth state changes trigger ProtectedRoute redirect
    navigate("/", { replace: true });
    
    // Clear React Query cache
    queryClient.clear();
    
    // Then sign out (state change won't cause /auth redirect since we're already on /)
    await signOut();
    
    toast({
      title: "Signed out",
      description: "You've been signed out of your agency account.",
    });
  };

  // Main nav items (no Settings - moved to dropdown)
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/analyze", label: "Analyze", icon: Globe },
    { href: "/dashboard/batch", label: "Batch Mode", icon: Layers },
    { href: "/dashboard/history", label: "History", icon: History },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getPlanBadge = () => {
    if (isTrial) {
      return <Badge variant="outline" className="text-xs">Trial</Badge>;
    }
    if (plan) {
      return (
        <Badge 
          variant={plan === "pro" ? "default" : "secondary"} 
          className="text-xs capitalize"
        >
          {plan}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Trial Banner */}
      <TrialBanner />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Agency Name */}
            <div className="flex items-center gap-4">
              <HeaderBrand to="/dashboard/analyze" textFallback />
              {profile && (
                <span className="hidden md:inline text-sm text-muted-foreground border-l border-border pl-4">
                  {profile.agency_name || `${profile.first_name}'s Agency`}
                </span>
              )}
            </div>

            {/* Main Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} to={item.href}>
                    <Button 
                      variant={isActive(item.href) ? "secondary" : "ghost"} 
                      size="sm" 
                      className="gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {/* Plan Badge */}
              <div className="hidden sm:flex items-center">
                {getPlanBadge()}
              </div>

              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-border">
                  <Link to="/dashboard/account">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Settings
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/pricing">
                    <DropdownMenuItem className="gap-2 cursor-pointer">
                      <CreditCard className="w-4 h-4" />
                      Plans & Billing
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden border-b border-border/50 bg-card/50">
        <div className="container">
          <nav className="flex items-center gap-1 py-2 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <Button 
                    variant={isActive(item.href) ? "secondary" : "ghost"} 
                    size="sm" 
                    className="gap-2 whitespace-nowrap"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            {/* Settings in mobile nav for easy access */}
            <Link to="/dashboard/account">
              <Button 
                variant={isActive("/dashboard/account") ? "secondary" : "ghost"} 
                size="sm" 
                className="gap-2 whitespace-nowrap"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-auto">
        <div className="container">
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-semibold text-foreground">OptimizeMySuite</span> — Your agency's automated website analysis engine
          </p>
        </div>
      </footer>
    </div>
  );
}
