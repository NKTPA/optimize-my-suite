-- api_keys_safe is a VIEW, not a table
-- Fix: Recreate with security_invoker = true to inherit RLS from base api_keys table

DROP VIEW IF EXISTS public.api_keys_safe;

CREATE VIEW public.api_keys_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  workspace_id,
  key_prefix,
  name,
  created_at,
  last_used_at,
  revoked_at
FROM public.api_keys;

-- Grant SELECT only to authenticated users (actual row access controlled by api_keys RLS)
GRANT SELECT ON public.api_keys_safe TO authenticated;

-- Revoke any access from anon
REVOKE ALL ON public.api_keys_safe FROM anon;