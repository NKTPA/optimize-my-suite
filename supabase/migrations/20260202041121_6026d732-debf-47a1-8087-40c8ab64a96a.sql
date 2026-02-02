-- Drop and recreate the member view to explicitly exclude Stripe billing fields
DROP VIEW IF EXISTS public.workspaces_member_view;

CREATE VIEW public.workspaces_member_view
WITH (security_invoker=on, security_barrier=true) AS
SELECT 
  id,
  name,
  owner_id,
  plan,
  subscription_status,
  trial_ends_at,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
  -- Explicitly NOT selecting: stripe_customer_id, stripe_subscription_id
FROM public.workspaces
WHERE 
  owner_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.workspace_members wm 
    WHERE wm.workspace_id = workspaces.id 
    AND wm.user_id = auth.uid()
  );

COMMENT ON VIEW public.workspaces_member_view IS 'Safe view for workspace members - excludes sensitive Stripe billing fields (stripe_customer_id, stripe_subscription_id)';