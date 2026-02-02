-- FIX ISSUE 1 & 3: Properly secure workspaces and the member view

-- First, drop the existing view to recreate it correctly
DROP VIEW IF EXISTS public.workspaces_member_view;

-- Ensure the base workspaces table only allows owners to SELECT (for full access including Stripe fields)
-- Drop any existing SELECT policies first
DROP POLICY IF EXISTS "Owners can view full workspace data" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;

-- Create owner-only SELECT policy on base table
-- Owners get full access to all columns including stripe_customer_id and stripe_subscription_id
CREATE POLICY "Owners can view full workspace data"
  ON public.workspaces
  FOR SELECT
  USING (owner_id = auth.uid());

-- Create a secure view for members that:
-- 1. DOES NOT use security_invoker (so it bypasses base table RLS)
-- 2. Includes its own access control in the WHERE clause
-- 3. Uses security_barrier to prevent predicate pushdown attacks
-- 4. Only exposes non-sensitive columns (excludes Stripe fields)
CREATE VIEW public.workspaces_member_view
WITH (security_barrier = true) AS
SELECT 
  id,
  owner_id,
  name,
  plan,
  subscription_status,
  trial_ends_at,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
  -- Deliberately excludes: stripe_customer_id, stripe_subscription_id
FROM public.workspaces
WHERE 
  -- Access control: only return workspaces where user is owner or member
  owner_id = auth.uid() 
  OR public.is_workspace_member(id, auth.uid());

-- Add comment explaining the security model
COMMENT ON VIEW public.workspaces_member_view IS 
  'Secure view for workspace access. Excludes sensitive Stripe payment fields (stripe_customer_id, stripe_subscription_id). Access control is enforced in the WHERE clause - only owners and members can see their workspaces. Owners should query the base workspaces table directly for full access to Stripe fields for billing management.';