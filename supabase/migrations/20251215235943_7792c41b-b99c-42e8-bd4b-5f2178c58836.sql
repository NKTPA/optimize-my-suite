-- Fix api_keys_safe VIEW to inherit RLS from base api_keys table
-- This ensures only workspace owners can see their API keys through the view

-- 1) Drop and recreate the view with security_invoker = true
-- This makes the view respect RLS policies of the underlying api_keys table
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

-- 2) Revoke all access from anon (defense in depth)
REVOKE ALL ON public.api_keys_safe FROM anon;

-- 3) Grant SELECT only to authenticated users (RLS on base table will filter rows)
GRANT SELECT ON public.api_keys_safe TO authenticated;

-- Note: The base api_keys table already has RLS enabled with policies that 
-- restrict access to workspace owners only. With security_invoker = true,
-- this view inherits those restrictions automatically.