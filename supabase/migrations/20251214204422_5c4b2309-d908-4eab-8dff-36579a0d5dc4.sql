-- Drop the existing view
DROP VIEW IF EXISTS public.api_keys_safe;

-- Recreate the view with security_invoker = true
-- This ensures the view respects RLS policies on the underlying api_keys table
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