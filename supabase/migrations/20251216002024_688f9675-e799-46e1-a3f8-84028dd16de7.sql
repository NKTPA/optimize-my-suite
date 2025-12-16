
-- STRUCTURAL FIX: Ensure api_keys_safe is a secure VIEW (not table)
-- Drop and recreate to guarantee correct structure

-- 1) Drop existing view
DROP VIEW IF EXISTS public.api_keys_safe;

-- 2) Recreate as SECURITY INVOKER VIEW with NO secrets exposed
CREATE VIEW public.api_keys_safe
WITH (security_invoker = true, security_barrier = true)
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

-- 3) Add comment documenting security
COMMENT ON VIEW public.api_keys_safe IS 'Secure view over api_keys. Uses security_invoker=true to inherit RLS from base table. NO raw keys or hashes exposed.';

-- 4) Revoke ALL privileges from dangerous roles
REVOKE ALL ON public.api_keys_safe FROM anon;
REVOKE ALL ON public.api_keys_safe FROM public;

-- 5) Grant SELECT only to authenticated (RLS on api_keys filters to owners)
GRANT SELECT ON public.api_keys_safe TO authenticated;

-- 6) Verify base table security (idempotent)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys FORCE ROW LEVEL SECURITY;

-- 7) REGRESSION GUARD: Function that validates api_keys_safe security
-- Returns true if secure, raises exception if not
CREATE OR REPLACE FUNCTION public.check_api_keys_safe_security()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_relkind char;
  v_has_security_invoker boolean;
  v_base_rls_enabled boolean;
BEGIN
  -- Check api_keys_safe is a VIEW (not table)
  SELECT c.relkind INTO v_relkind
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'api_keys_safe';
  
  IF v_relkind IS NULL THEN
    RAISE EXCEPTION 'api_keys_safe does not exist';
  END IF;
  
  IF v_relkind != 'v' THEN
    RAISE EXCEPTION 'api_keys_safe must be a VIEW, not a table (found: %)', v_relkind;
  END IF;
  
  -- Check security_invoker is set
  SELECT 'security_invoker=true' = ANY(c.reloptions) INTO v_has_security_invoker
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'api_keys_safe';
  
  IF NOT v_has_security_invoker THEN
    RAISE EXCEPTION 'api_keys_safe must have security_invoker=true';
  END IF;
  
  -- Check base api_keys table has RLS enabled
  SELECT relrowsecurity INTO v_base_rls_enabled
  FROM pg_class WHERE oid = 'public.api_keys'::regclass;
  
  IF NOT v_base_rls_enabled THEN
    RAISE EXCEPTION 'api_keys table must have RLS enabled';
  END IF;
  
  RETURN true;
END;
$$;

-- Run the guard immediately to validate
SELECT public.check_api_keys_safe_security();
