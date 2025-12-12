import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PlanType = "starter" | "pro" | "scale" | null;

interface SubscriptionState {
  isLoading: boolean;
  subscribed: boolean;
  plan: PlanType;
  subscriptionEnd: string | null;
  usageLimit: number;
  isTrial: boolean;
  trialEndsAt: string | null;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const PLAN_LIMITS = {
  starter: { analyses: 25, implementations: 25, batchUrls: 10 },
  pro: { analyses: 150, implementations: 150, batchUrls: 50 },
  scale: { analyses: 500, implementations: 500, batchUrls: 999 },
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    subscribed: false,
    plan: null,
    subscriptionEnd: null,
    usageLimit: 0,
    isTrial: false,
    trialEndsAt: null,
  });

  const checkSubscription = async () => {
    if (!session) {
      setState({
        isLoading: false,
        subscribed: false,
        plan: null,
        subscriptionEnd: null,
        usageLimit: 0,
        isTrial: false,
        trialEndsAt: null,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Subscription check error:", error);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setState({
        isLoading: false,
        subscribed: data?.subscribed || false,
        plan: data?.plan || null,
        subscriptionEnd: data?.subscription_end || null,
        usageLimit: data?.usage_limit || 0,
        isTrial: data?.is_trial || false,
        trialEndsAt: data?.trial_ends_at || null,
      });
    } catch (error) {
      console.error("Subscription check failed:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (user && session) {
      checkSubscription();
    } else {
      setState({
        isLoading: false,
        subscribed: false,
        plan: null,
        subscriptionEnd: null,
        usageLimit: 0,
        isTrial: false,
        trialEndsAt: null,
      });
    }
  }, [user, session]);

  // Refresh subscription status periodically
  useEffect(() => {
    if (!user || !session) return;
    
    const interval = setInterval(checkSubscription, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user, session]);

  return (
    <SubscriptionContext.Provider value={{ ...state, checkSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
