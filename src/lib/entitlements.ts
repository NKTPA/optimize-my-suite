// Centralized entitlement definitions for all plans

export type PlanId = "free" | "starter" | "pro" | "scale";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "free";

export interface PlanLimits {
  analysesPerMonth: number;
  implementationsPerMonth: number;
  historyLimit: number | "unlimited";
  batchUrlLimit: number | "unlimited";
  teamMemberLimit: number | "unlimited";
  hasCustomBranding: boolean;
  hasClientTagging: boolean;
  hasApiAccess: boolean;
  hasWhiteLabelPdf: boolean;
  hasPrioritySupport: boolean;
  hasDedicatedSuccessManager: boolean;
  blueprintAccess: boolean;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  limits: PlanLimits;
  priceId: string; // Stripe price ID
}

// Stripe price IDs for OptimizeSuite plans
export const STRIPE_PRICE_IDS = {
  starter: "price_1Sdg76JDZeHuCLwazGgchPkh",
  pro: "price_1Sdg7gJDZeHuCLwardbQggEZ",
  scale: "price_1Sdg80JDZeHuCLwaVVp0uBbh",
};

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free (Locked)",
    price: 0,
    description: "Trial expired or subscription canceled",
    priceId: "",
    limits: {
      analysesPerMonth: 0,
      implementationsPerMonth: 0,
      historyLimit: 0,
      batchUrlLimit: 0,
      teamMemberLimit: 1,
      hasCustomBranding: false,
      hasClientTagging: false,
      hasApiAccess: false,
      hasWhiteLabelPdf: false,
      hasPrioritySupport: false,
      hasDedicatedSuccessManager: false,
      blueprintAccess: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 49,
    description: "Perfect for solo consultants and small agencies",
    priceId: STRIPE_PRICE_IDS.starter,
    limits: {
      analysesPerMonth: 25,
      implementationsPerMonth: 25,
      historyLimit: 5,
      batchUrlLimit: 10,
      teamMemberLimit: 1,
      hasCustomBranding: false,
      hasClientTagging: false,
      hasApiAccess: false,
      hasWhiteLabelPdf: true, // Basic white-label (remove "Built by Lovable")
      hasPrioritySupport: false,
      hasDedicatedSuccessManager: false,
      blueprintAccess: true,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 149,
    description: "For growing agencies scaling their services",
    priceId: STRIPE_PRICE_IDS.pro,
    limits: {
      analysesPerMonth: 150,
      implementationsPerMonth: 150,
      historyLimit: "unlimited",
      batchUrlLimit: 50,
      teamMemberLimit: 5,
      hasCustomBranding: true,
      hasClientTagging: true,
      hasApiAccess: false,
      hasWhiteLabelPdf: true,
      hasPrioritySupport: true,
      hasDedicatedSuccessManager: false,
      blueprintAccess: true,
    },
  },
  scale: {
    id: "scale",
    name: "Scale",
    price: 399,
    description: "Enterprise-ready for high-volume agencies",
    priceId: STRIPE_PRICE_IDS.scale,
    limits: {
      analysesPerMonth: 500,
      implementationsPerMonth: 500,
      historyLimit: "unlimited",
      batchUrlLimit: "unlimited",
      teamMemberLimit: "unlimited",
      hasCustomBranding: true,
      hasClientTagging: true,
      hasApiAccess: true,
      hasWhiteLabelPdf: true,
      hasPrioritySupport: true,
      hasDedicatedSuccessManager: true,
      blueprintAccess: true,
    },
  },
};

export function getPlanLimits(planId: PlanId | null): PlanLimits {
  if (!planId || !PLAN_DEFINITIONS[planId]) {
    return PLAN_DEFINITIONS.free.limits;
  }
  return PLAN_DEFINITIONS[planId].limits;
}

export function getPlanById(planId: PlanId | null): PlanDefinition {
  if (!planId || !PLAN_DEFINITIONS[planId]) {
    return PLAN_DEFINITIONS.free;
  }
  return PLAN_DEFINITIONS[planId];
}

export function canUseFeature(
  planId: PlanId | null,
  feature: keyof PlanLimits
): boolean {
  const limits = getPlanLimits(planId);
  const value = limits[feature];
  
  if (typeof value === "boolean") return value;
  if (value === "unlimited") return true;
  if (typeof value === "number") return value > 0;
  
  return false;
}

export function getRequiredPlanForFeature(feature: keyof PlanLimits): PlanId {
  // Return the minimum plan required for a feature
  const plans: PlanId[] = ["starter", "pro", "scale"];
  
  for (const planId of plans) {
    if (canUseFeature(planId, feature)) {
      return planId;
    }
  }
  
  return "scale";
}

export function isWithinLimit(
  current: number,
  limit: number | "unlimited"
): boolean {
  if (limit === "unlimited") return true;
  return current < limit;
}

export function getRemainingUsage(
  used: number,
  limit: number | "unlimited"
): number | "unlimited" {
  if (limit === "unlimited") return "unlimited";
  return Math.max(0, limit - used);
}

export function getUsagePercentage(
  used: number,
  limit: number | "unlimited"
): number {
  if (limit === "unlimited") return 0;
  if (limit === 0) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}
