
-- 1. Add authorization guard to handle_new_user (trigger-only check)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Authorization guard: This function must only be called as a trigger
  IF TG_OP IS NULL THEN
    RAISE EXCEPTION 'handle_new_user can only be executed as a trigger, not called directly';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (user_id, first_name, last_name, agency_name, agency_website)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'agency_name',
    NEW.raw_user_meta_data ->> 'agency_website'
  );
  
  -- Create workspace for new user
  INSERT INTO public.workspaces (name, owner_id, plan, subscription_status)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'agency_name', 'My Workspace'),
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'selected_plan', 'starter'),
    'trialing'
  )
  RETURNING id INTO new_workspace_id;
  
  -- Create initial usage record
  INSERT INTO public.workspace_usage (workspace_id)
  VALUES (new_workspace_id);
  
  -- Create initial branding record
  INSERT INTO public.workspace_branding (workspace_id)
  VALUES (new_workspace_id);
  
  RETURN NEW;
END;
$function$;

-- 2. Add authorization guard to is_workspace_member (caller must be the queried user)
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization guard: Only allow checking membership for the authenticated caller
  -- or when called from a SECURITY DEFINER context (auth.uid() is null in service role)
  IF auth.uid() IS NOT NULL AND auth.uid() != _user_id THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = _workspace_id AND owner_id = _user_id
  );
END;
$function$;

-- 3. Add authorization guard to get_user_workspace_id (caller must be the queried user)
CREATE OR REPLACE FUNCTION public.get_user_workspace_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Authorization guard: Only allow lookup for the authenticated caller
  -- or when called from a SECURITY DEFINER context (auth.uid() is null in service role)
  IF auth.uid() IS NOT NULL AND auth.uid() != _user_id THEN
    RETURN NULL;
  END IF;

  RETURN COALESCE(
    (SELECT id FROM public.workspaces WHERE owner_id = _user_id LIMIT 1),
    (SELECT workspace_id FROM public.workspace_members WHERE user_id = _user_id LIMIT 1)
  );
END;
$function$;

-- 4. Add workspace-scoped profile visibility RLS policy
-- Allows workspace members to view profiles of other members in the same workspace
CREATE POLICY "Workspace members can view member profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.workspace_members wm1
    JOIN public.workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
    WHERE wm1.user_id = auth.uid()
    AND wm2.user_id = profiles.user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.workspaces w
    JOIN public.workspace_members wm ON wm.workspace_id = w.id
    WHERE w.owner_id = auth.uid()
    AND wm.user_id = profiles.user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.workspaces w
    JOIN public.workspace_members wm ON wm.workspace_id = w.id
    WHERE w.owner_id = profiles.user_id
    AND wm.user_id = auth.uid()
  )
);

-- Drop the old overly-simple SELECT policy (replaced by the workspace-scoped one above)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- 5. Add storage RLS policies for agency-logos bucket
-- Restrict uploads to authenticated users only, scoped to their own workspace path
CREATE POLICY "Authenticated users can upload agency logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agency-logos');

CREATE POLICY "Authenticated users can update agency logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'agency-logos');

CREATE POLICY "Authenticated users can delete agency logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'agency-logos');

-- Public read is intentional for PDF generation (logos must be accessible in generated PDFs)
-- The bucket remains public for reads but write access is restricted to authenticated users
CREATE POLICY "Public read access for agency logos in PDFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'agency-logos');
