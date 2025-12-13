import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardAnalyze from "./pages/DashboardAnalyze";
import DashboardBatch from "./pages/DashboardBatch";
import DashboardHistory from "./pages/DashboardHistory";
import DashboardAccount from "./pages/DashboardAccount";
import GeneratedSitePreview from "./pages/GeneratedSitePreview";
import LogoPreview from "./pages/LogoPreview";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SubscriptionProvider>
        <WorkspaceProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
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
          </BrowserRouter>
          </TooltipProvider>
        </WorkspaceProvider>
      </SubscriptionProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
