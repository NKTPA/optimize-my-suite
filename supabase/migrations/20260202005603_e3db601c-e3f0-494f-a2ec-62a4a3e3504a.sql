-- Create a secure view for workspace members that excludes Stripe payment data
-- This view will be used by non-owner members to access workspace information

CREATE VIEW public.workspaces_member_view
WITH (security_invoker = true, security_barrier = true) AS
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
FROM public.workspaces;

-- Comment explaining the view's purpose
COMMENT ON VIEW public.workspaces_member_view IS 
  'Secure view for workspace members that excludes sensitive Stripe payment data. Owners should query the workspaces table directly for full access.';

-- Drop the existing SELECT policy that allows members to see all data
DROP POLICY IF EXISTS "Users can view their workspaces" ON public.workspaces;

-- Create new policy: Only owners can SELECT from the base workspaces table (full access including Stripe fields)
CREATE POLICY "Owners can view full workspace data"
  ON public.workspaces
  FOR SELECT
  USING (owner_id = auth.uid());

-- The view inherits RLS from the base table via security_invoker=true
-- Members will query the view which only exposes non-sensitive columns
-- The view's security_barrier prevents predicate pushdown attacks