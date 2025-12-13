import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PlanId, SubscriptionStatus, getPlanLimits, PlanLimits, isWithinLimit, PLAN_DEFINITIONS } from "@/lib/entitlements";

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  plan: PlanId;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceUsage {
  id: string;
  workspace_id: string;
  analyses_used: number;
  packs_used: number;
  period_start: string;
  period_end: string;
  updated_at: string;
}

export interface WorkspaceBranding {
  id: string;
  workspace_id: string;
  logo_url: string | null;
  footer_text: string | null;
  primary_color: string;
  accent_color: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "analyst" | "viewer";
  invited_email: string | null;
  joined_at: string | null;
  created_at: string;
}

interface WorkspaceState {
  workspace: Workspace | null;
  usage: WorkspaceUsage | null;
  branding: WorkspaceBranding | null;
  members: WorkspaceMember[];
  isLoading: boolean;
  limits: PlanLimits;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isSubscriptionActive: boolean;
  isLocked: boolean;
  isOwnerOverride: boolean;
}

interface WorkspaceContextType extends WorkspaceState {
  refreshWorkspace: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  incrementUsage: (type: "analysis" | "pack") => Promise<boolean>;
  canUseAnalysis: () => boolean;
  canUsePack: () => boolean;
  canUseBatchUrls: (count: number) => boolean;
  canUseFeature: (type: "analyses" | "packs") => boolean;
  getRemainingUsage: (type: "analyses" | "packs") => number;
  updateBranding: (branding: Partial<WorkspaceBranding>) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const getInitialState = (): WorkspaceState => ({
  workspace: null,
  usage: null,
  branding: null,
  members: [],
  isLoading: true,
  limits: getPlanLimits(null),
  isTrialActive: false,
  isTrialExpired: false,
  isSubscriptionActive: false,
  isLocked: true,
  isOwnerOverride: false,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, session, onSignOut } = useAuth();
  
  // Owner status is now determined server-side
  const [isOwner, setIsOwner] = useState(false);
  const [state, setState] = useState<WorkspaceState>(getInitialState);
  
  // Track if we've registered the signOut callback
  const hasRegisteredSignOut = useRef(false);

  // Register signOut callback once to reset workspace state
  useEffect(() => {
    if (!hasRegisteredSignOut.current) {
      hasRegisteredSignOut.current = true;
      onSignOut(() => {
        setIsOwner(false);
        setState(getInitialState());
      });
    }
  }, [onSignOut]);

  const computeStatus = useCallback((workspace: Workspace | null, ownerOverride: boolean): Partial<WorkspaceState> => {
    console.log("[WorkspaceContext] computeStatus called", {
      hasWorkspace: !!workspace,
      workspacePlan: workspace?.plan,
      subscriptionStatus: workspace?.subscription_status,
      trialEndsAt: workspace?.trial_ends_at,
      isOwner: ownerOverride,
    });

    // If this is the owner account (determined server-side), grant full Scale plan access
    if (ownerOverride) {
      console.log("[WorkspaceContext] Applying owner override (server-side verified)");
      return {
        limits: PLAN_DEFINITIONS.scale.limits,
        isTrialActive: false,
        isTrialExpired: false,
        isSubscriptionActive: true,
        isLocked: false,
        isOwnerOverride: true,
      };
    }

    if (!workspace) {
      return {
        limits: getPlanLimits(null),
        isTrialActive: false,
        isTrialExpired: false,
        isSubscriptionActive: false,
        isLocked: true,
        isOwnerOverride: false,
      };
    }

    const now = new Date();
    const trialEndsAt = workspace.trial_ends_at ? new Date(workspace.trial_ends_at) : null;
    const isTrialActive = workspace.subscription_status === "trialing" && trialEndsAt && trialEndsAt > now;
    const isTrialExpired = workspace.subscription_status === "trialing" && trialEndsAt && trialEndsAt <= now;
    const isSubscriptionActive = workspace.subscription_status === "active";
    const isLocked = !isTrialActive && !isSubscriptionActive;

    return {
      limits: getPlanLimits(isLocked ? "free" : workspace.plan),
      isTrialActive: !!isTrialActive,
      isTrialExpired: !!isTrialExpired,
      isSubscriptionActive,
      isLocked,
      isOwnerOverride: false,
    };
  }, []);

  const checkOwnerStatus = useCallback(async (): Promise<boolean> => {
    if (!session?.access_token) return false;
    
    try {
      // Check subscription endpoint returns isOwner from server-side
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error("[WorkspaceContext] Error checking owner status:", error);
        return false;
      }
      
      return data?.isOwner === true;
    } catch (error) {
      console.error("[WorkspaceContext] Error in checkOwnerStatus:", error);
      return false;
    }
  }, [session?.access_token]);

  const refreshWorkspace = useCallback(async () => {
    if (!user) {
      setIsOwner(false);
      setState(prev => ({
        ...prev,
        workspace: null,
        usage: null,
        branding: null,
        members: [],
        isLoading: false,
        isOwnerOverride: false,
        ...computeStatus(null, false),
      }));
      return;
    }

    try {
      // Check owner status from server first
      const ownerStatus = await checkOwnerStatus();
      setIsOwner(ownerStatus);
      
      // Fetch workspace (user might be owner or member)
      const { data: workspaces, error: workspaceError } = await supabase
        .from("workspaces")
        .select("*")
        .limit(1);

      if (workspaceError) throw workspaceError;
      
      const workspace = workspaces?.[0] as Workspace | undefined;

      if (!workspace) {
        setState(prev => ({
          ...prev,
          workspace: null,
          usage: null,
          branding: null,
          members: [],
          isLoading: false,
          isOwnerOverride: ownerStatus,
          ...computeStatus(null, ownerStatus),
        }));
        return;
      }

      // Fetch usage, branding, and members in parallel
      const [usageResult, brandingResult, membersResult] = await Promise.all([
        supabase.from("workspace_usage").select("*").eq("workspace_id", workspace.id).single(),
        supabase.from("workspace_branding").select("*").eq("workspace_id", workspace.id).single(),
        supabase.from("workspace_members").select("*").eq("workspace_id", workspace.id),
      ]);

      setState(prev => ({
        ...prev,
        workspace: workspace as Workspace,
        usage: usageResult.data as WorkspaceUsage | null,
        branding: brandingResult.data as WorkspaceBranding | null,
        members: (membersResult.data || []) as WorkspaceMember[],
        isLoading: false,
        ...computeStatus(workspace, ownerStatus),
      }));
    } catch (error) {
      console.error("Error fetching workspace:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, computeStatus, checkOwnerStatus]);

  const refreshUsage = useCallback(async () => {
    if (!state.workspace) return;

    try {
      const { data, error } = await supabase
        .from("workspace_usage")
        .select("*")
        .eq("workspace_id", state.workspace.id)
        .single();

      if (!error && data) {
        setState(prev => ({
          ...prev,
          usage: data as WorkspaceUsage,
        }));
      }
    } catch (error) {
      console.error("Error refreshing usage:", error);
    }
  }, [state.workspace]);

  const incrementUsage = useCallback(async (type: "analysis" | "pack"): Promise<boolean> => {
    // Owner bypass (server-side verified)
    if (state.isOwnerOverride) return true;
    
    if (!state.workspace || !state.usage) return false;

    const field = type === "analysis" ? "analyses_used" : "packs_used";
    const currentValue = type === "analysis" ? state.usage.analyses_used : state.usage.packs_used;
    const limit = type === "analysis" ? state.limits.analysesPerMonth : state.limits.implementationsPerMonth;

    if (!isWithinLimit(currentValue, limit)) {
      return false;
    }

    try {
      const { error } = await supabase
        .from("workspace_usage")
        .update({ [field]: currentValue + 1 })
        .eq("workspace_id", state.workspace.id);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        usage: prev.usage ? {
          ...prev.usage,
          [field]: currentValue + 1,
        } : null,
      }));

      return true;
    } catch (error) {
      console.error("Error incrementing usage:", error);
      return false;
    }
  }, [state.workspace, state.usage, state.limits, state.isOwnerOverride]);

  const canUseAnalysis = useCallback((): boolean => {
    if (state.isOwnerOverride) return true;
    if (state.isLocked || !state.usage) return false;
    return isWithinLimit(state.usage.analyses_used, state.limits.analysesPerMonth);
  }, [state.isLocked, state.usage, state.limits, state.isOwnerOverride]);

  const canUsePack = useCallback((): boolean => {
    if (state.isOwnerOverride) return true;
    if (state.isLocked || !state.usage) return false;
    return isWithinLimit(state.usage.packs_used, state.limits.implementationsPerMonth);
  }, [state.isLocked, state.usage, state.limits, state.isOwnerOverride]);

  const canUseBatchUrls = useCallback((count: number): boolean => {
    if (state.isOwnerOverride) return true;
    if (state.isLocked) return false;
    if (state.limits.batchUrlLimit === "unlimited") return true;
    return count <= state.limits.batchUrlLimit;
  }, [state.isLocked, state.limits, state.isOwnerOverride]);

  const canUseFeatureCheck = useCallback((type: "analyses" | "packs"): boolean => {
    if (type === "analyses") return canUseAnalysis();
    return canUsePack();
  }, [canUseAnalysis, canUsePack]);

  const getRemainingUsageCount = useCallback((type: "analyses" | "packs"): number => {
    if (state.isOwnerOverride) return 999999;
    if (!state.usage) return 0;
    const used = type === "analyses" ? state.usage.analyses_used : state.usage.packs_used;
    const limit = type === "analyses" ? state.limits.analysesPerMonth : state.limits.implementationsPerMonth;
    if (typeof limit === "string" || limit === -1) return 999999;
    return Math.max(0, limit - used);
  }, [state.usage, state.limits, state.isOwnerOverride]);

  const updateBranding = useCallback(async (branding: Partial<WorkspaceBranding>): Promise<void> => {
    if (!state.workspace) return;

    try {
      const { data, error } = await supabase
        .from("workspace_branding")
        .update(branding)
        .eq("workspace_id", state.workspace.id)
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        branding: data as WorkspaceBranding,
      }));
    } catch (error) {
      console.error("Error updating branding:", error);
      throw error;
    }
  }, [state.workspace]);

  useEffect(() => {
    if (user && session) {
      refreshWorkspace();
    } else {
      setIsOwner(false);
      setState(prev => ({
        ...prev,
        workspace: null,
        usage: null,
        branding: null,
        members: [],
        isLoading: false,
        isOwnerOverride: false,
        ...computeStatus(null, false),
      }));
    }
  }, [user, session, refreshWorkspace, computeStatus]);

  return (
    <WorkspaceContext.Provider
      value={{
        ...state,
        refreshWorkspace,
        refreshUsage,
        incrementUsage,
        canUseAnalysis,
        canUsePack,
        canUseBatchUrls,
        canUseFeature: canUseFeatureCheck,
        getRemainingUsage: getRemainingUsageCount,
        updateBranding,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
