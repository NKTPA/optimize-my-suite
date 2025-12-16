
-- Harden api_keys_safe VIEW security (defense in depth)
-- This view already has security_invoker=true, but we ensure NO broad access exists

-- 1) Revoke ALL access from all roles (anon, authenticated, public)
REVOKE ALL ON public.api_keys_safe FROM anon;
REVOKE ALL ON public.api_keys_safe FROM authenticated;
REVOKE ALL ON public.api_keys_safe FROM public;

-- 2) Grant SELECT ONLY to authenticated users
-- RLS on base api_keys table will filter to workspace owners only
GRANT SELECT ON public.api_keys_safe TO authenticated;

-- 3) Verify base table api_keys has RLS enabled and is owner-only
-- (This is a no-op if already enabled, but ensures it stays enabled)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys FORCE ROW LEVEL SECURITY;

-- Note: With security_invoker=true on the view, queries through api_keys_safe
-- execute with the caller's permissions and respect the base table's RLS policies.
-- The base api_keys table only allows workspace owners to SELECT their own keys.
-- This means: authenticated users can only see rows they're authorized to see via RLS.
