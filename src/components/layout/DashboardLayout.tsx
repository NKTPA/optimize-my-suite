import { Link, useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { 
  Globe, 
  History, 
  Layers, 
  User, 
  LogOut, 
  CreditCard,
  LayoutDashboard,
  FileText,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { plan, isTrial, subscribed } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You've been signed out of your agency account.",
    });
    navigate("/");
  };

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
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Agency Name */}
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground">
                  Optimize My <span className="text-gradient">Biz</span>
                </span>
              </Link>
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

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {getPlanBadge()}
              <Link to="/pricing">
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="hidden lg:inline">Plans</span>
                </Button>
              </Link>
              <Link to="/dashboard/account">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">Account</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
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
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-auto">
        <div className="container">
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-semibold text-foreground">Optimize My Biz</span> — Your agency's automated website analysis engine
          </p>
        </div>
      </footer>
    </div>
  );
}
