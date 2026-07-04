
-- 1. Fix workspace_members INSERT/DELETE policies
DROP POLICY IF EXISTS "Owners/admins can delete members" ON public.workspace_members;
DROP POLICY IF EXISTS "Owners/admins can insert members" ON public.workspace_members;

CREATE POLICY "Owners/admins can delete members"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'::app_role
  )
);

CREATE POLICY "Owners/admins can insert members"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_members.workspace_id AND w.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'::app_role
  )
);

-- 2. Remove overly broad agency-logos storage policies (bucket_id-only checks)
DROP POLICY IF EXISTS "Authenticated users can update agency logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete agency logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload agency logos" ON storage.objects;

-- 3. Revoke EXECUTE on SECURITY DEFINER functions from anon; keep authenticated only where RLS needs it.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_api_key(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_api_keys_safe_security() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_workspace_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_workspace_id(uuid) TO authenticated, service_role;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname='public' AND p.proname='has_role') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role';
  END IF;
END $$;

-- 4. audit_leads: trigger-based per-day de-duplication (email + url) to reduce spam abuse of the public form.
CREATE OR REPLACE FUNCTION public.audit_leads_prevent_duplicates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.audit_leads
    WHERE lower(email) = lower(NEW.email)
      AND lower(url) = lower(NEW.url)
      AND created_at > now() - interval '1 day'
  ) THEN
    RAISE EXCEPTION 'duplicate_lead' USING ERRCODE = 'unique_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_leads_dedupe ON public.audit_leads;
CREATE TRIGGER audit_leads_dedupe
BEFORE INSERT ON public.audit_leads
FOR EACH ROW EXECUTE FUNCTION public.audit_leads_prevent_duplicates();
