-- Fix the SECURITY DEFINER view warning by explicitly setting SECURITY INVOKER
-- Drop and recreate the view with proper security settings

DROP VIEW IF EXISTS public.api_keys_safe;

CREATE VIEW public.api_keys_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  workspace_id,
  name,
  key_prefix,
  created_at,
  last_used_at,
  revoked_at
FROM public.api_keys;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.api_keys_safe TO authenticated;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.api_keys_safe IS 'Secure view of api_keys that excludes key_hash to prevent exposure to workspace members. Uses SECURITY INVOKER to respect RLS policies of the querying user.';