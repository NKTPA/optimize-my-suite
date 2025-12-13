import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

// Eagerly loaded - needed for initial render
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded - only loaded when user navigates to these routes
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardAnalyze = lazy(() => import("./pages/DashboardAnalyze"));
const DashboardBatch = lazy(() => import("./pages/DashboardBatch"));
const DashboardHistory = lazy(() => import("./pages/DashboardHistory"));
const DashboardAccount = lazy(() => import("./pages/DashboardAccount"));
const GeneratedSitePreview = lazy(() => import("./pages/GeneratedSitePreview"));
const LogoPreview = lazy(() => import("./pages/LogoPreview"));
const Pricing = lazy(() => import("./pages/Pricing"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <WorkspaceProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/pricing" element={<Pricing />} />
                
                {/* Protected dashboard routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/analyze" element={<DashboardAnalyze />} />
                <Route path="/dashboard/batch" element={<DashboardBatch />} />
                <Route path="/dashboard/history" element={<DashboardHistory />} />
                <Route path="/dashboard/account" element={<DashboardAccount />} />
                
                {/* Other routes */}
                <Route path="/preview" element={<GeneratedSitePreview />} />
                <Route path="/logo-preview" element={<LogoPreview />} />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </TooltipProvider>
        </WorkspaceProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
