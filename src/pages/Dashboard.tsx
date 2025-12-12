import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Globe, 
  Layers, 
  History, 
  FileText, 
  ArrowRight,
  TrendingUp,
  Users,
  Zap,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useHistory } from "@/hooks/use-history";
import { Loader2 } from "lucide-react";

const quickActions = [
  {
    title: "Analyze Client Website",
    description: "Run a comprehensive audit on any website",
    icon: Globe,
    href: "/dashboard/analyze",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Batch Analysis",
    description: "Analyze multiple websites at once",
    icon: Layers,
    href: "/dashboard/batch",
    color: "bg-accent/10 text-accent",
  },
  {
    title: "View History",
    description: "Access all your saved reports",
    icon: History,
    href: "/dashboard/history",
    color: "bg-info/10 text-info",
  },
  {
    title: "Create Blueprint",
    description: "Generate a new website plan from scratch",
    icon: FileText,
    href: "/dashboard/analyze",
    color: "bg-success/10 text-success",
  },
];

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { plan, subscribed, isTrial, usageLimit } = useSubscription();
  const { history, isLoading: historyLoading } = useHistory();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const analysisCount = history.filter(h => h.type === "analysis").length;
  const implementationCount = history.filter(h => h.type === "implementation").length;

  return (
    <DashboardLayout>
      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Your Agency Dashboard
          </h1>
          <p className="text-muted-foreground">
            Generate client-ready reports in minutes. Scale your agency with automated website audits.
          </p>
        </div>

        {/* Onboarding Checklist */}
        <div className="mb-8">
          <OnboardingChecklist />
        </div>

        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Analyses This Month</p>
                  <p className="text-2xl font-bold text-foreground">{analysisCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
              </div>
              {usageLimit > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {usageLimit - analysisCount} remaining
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Implementation Packs</p>
                  <p className="text-2xl font-bold text-foreground">{implementationCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/10">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-2xl font-bold text-foreground capitalize">
                    {isTrial ? "Trial" : plan || "Free"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-success/10">
                  <Zap className="w-5 h-5 text-success" />
                </div>
              </div>
              {isTrial && (
                <p className="text-xs text-muted-foreground mt-2">
                  3-day free trial active
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saved Reports</p>
                  <p className="text-2xl font-bold text-foreground">{history.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-info/10">
                  <History className="w-5 h-5 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href + action.title} to={action.href}>
                  <Card className="h-full hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group">
                    <CardContent className="pt-6">
                      <div className={`p-3 rounded-xl ${action.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
              <Link to="/dashboard/history">
                <Button variant="ghost" size="sm" className="gap-2">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {history.slice(0, 5).map((item) => (
                <Card key={item.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          item.type === "analysis" ? "bg-primary/10" : "bg-accent/10"
                        }`}>
                          {item.type === "analysis" ? (
                            <Globe className="w-4 h-4 text-primary" />
                          ) : (
                            <FileText className="w-4 h-4 text-accent" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm truncate max-w-[300px]">
                            {item.url}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString()} • {item.type === "analysis" ? "Analysis" : "Implementation"}
                          </p>
                        </div>
                      </div>
                      {item.overallScore !== undefined && (
                        <div className="text-right">
                          <span className={`text-lg font-bold ${
                            item.overallScore >= 80 ? "text-success" :
                            item.overallScore >= 60 ? "text-warning" : "text-destructive"
                          }`}>
                            {item.overallScore}
                          </span>
                          <span className="text-muted-foreground text-sm">/100</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
