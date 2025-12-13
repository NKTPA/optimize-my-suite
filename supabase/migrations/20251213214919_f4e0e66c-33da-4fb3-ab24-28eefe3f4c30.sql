-- Recreate the api_keys_safe view with security_invoker enabled
-- This ensures the view inherits RLS policies from the underlying api_keys table

DROP VIEW IF EXISTS public.api_keys_safe;

CREATE VIEW public.api_keys_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  workspace_id,
  key_prefix,
  created_at,
  last_used_at,
  revoked_at
FROM public.api_keys
WHERE revoked_at IS NULL;