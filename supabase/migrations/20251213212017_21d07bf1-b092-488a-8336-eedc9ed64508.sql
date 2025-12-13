-- Drop the existing view
DROP VIEW IF EXISTS public.api_keys_safe;

-- Recreate it as a security invoker view that inherits RLS from api_keys
CREATE VIEW public.api_keys_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  key_prefix,
  workspace_id,
  name,
  created_at,
  last_used_at,
  revoked_at
FROM public.api_keys;