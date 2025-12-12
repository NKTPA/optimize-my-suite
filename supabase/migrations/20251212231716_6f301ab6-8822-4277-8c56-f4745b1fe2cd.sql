-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'analyst', 'viewer');

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'scale', 'free')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'free')),
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '3 days'),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ DEFAULT (now() + interval '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workspace members table (for roles)
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'analyst',
  invited_email TEXT,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Create usage tracking table
CREATE TABLE public.workspace_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  analyses_used INTEGER NOT NULL DEFAULT 0,
  packs_used INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create client tags table
CREATE TABLE public.client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, name)
);

-- Create history tags junction table
CREATE TABLE public.history_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  history_id UUID NOT NULL REFERENCES public.analysis_history(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.client_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(history_id, tag_id)
);

-- Create workspace branding table
CREATE TABLE public.workspace_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  footer_text TEXT,
  primary_color TEXT DEFAULT '#1e3a5f',
  accent_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create API keys table
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default API Key',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

-- Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = _workspace_id AND owner_id = _user_id
  )
$$;

-- Security definer function to get user's workspace
CREATE OR REPLACE FUNCTION public.get_user_workspace_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT id FROM public.workspaces WHERE owner_id = _user_id LIMIT 1),
    (SELECT workspace_id FROM public.workspace_members WHERE user_id = _user_id LIMIT 1)
  )
$$;

-- RLS Policies for workspaces
CREATE POLICY "Users can view their workspaces"
ON public.workspaces FOR SELECT
USING (owner_id = auth.uid() OR public.is_workspace_member(id, auth.uid()));

CREATE POLICY "Users can create workspaces"
ON public.workspaces FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their workspaces"
ON public.workspaces FOR UPDATE
USING (owner_id = auth.uid());

-- RLS Policies for workspace_members
CREATE POLICY "Members can view workspace members"
ON public.workspace_members FOR SELECT
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Owners/admins can insert members"
ON public.workspace_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_id AND w.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
  )
);

CREATE POLICY "Owners/admins can delete members"
ON public.workspace_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_id AND w.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid() AND wm.role = 'admin'
  )
);

-- RLS Policies for workspace_usage
CREATE POLICY "Members can view usage"
ON public.workspace_usage FOR SELECT
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "System can update usage"
ON public.workspace_usage FOR UPDATE
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "System can insert usage"
ON public.workspace_usage FOR INSERT
WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for client_tags
CREATE POLICY "Members can view tags"
ON public.client_tags FOR SELECT
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Members can create tags"
ON public.client_tags FOR INSERT
WITH CHECK (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Members can delete tags"
ON public.client_tags FOR DELETE
USING (public.is_workspace_member(workspace_id, auth.uid()));

-- RLS Policies for history_tags
CREATE POLICY "Members can view history tags"
ON public.history_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_tags ct
    WHERE ct.id = tag_id AND public.is_workspace_member(ct.workspace_id, auth.uid())
  )
);

CREATE POLICY "Members can add history tags"
ON public.history_tags FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_tags ct
    WHERE ct.id = tag_id AND public.is_workspace_member(ct.workspace_id, auth.uid())
  )
);

CREATE POLICY "Members can remove history tags"
ON public.history_tags FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.client_tags ct
    WHERE ct.id = tag_id AND public.is_workspace_member(ct.workspace_id, auth.uid())
  )
);

-- RLS Policies for workspace_branding
CREATE POLICY "Members can view branding"
ON public.workspace_branding FOR SELECT
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Owners can update branding"
ON public.workspace_branding FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
);

CREATE POLICY "Owners can insert branding"
ON public.workspace_branding FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
);

-- RLS Policies for api_keys
CREATE POLICY "Members can view api keys"
ON public.api_keys FOR SELECT
USING (public.is_workspace_member(workspace_id, auth.uid()));

CREATE POLICY "Owners can manage api keys"
ON public.api_keys FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
);

CREATE POLICY "Owners can revoke api keys"
ON public.api_keys FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.workspaces w WHERE w.id = workspace_id AND w.owner_id = auth.uid())
);

-- Function to create workspace on user signup (update existing handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
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
$$;

-- Trigger for updated_at columns
CREATE TRIGGER update_workspaces_updated_at
BEFORE UPDATE ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_usage_updated_at
BEFORE UPDATE ON public.workspace_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_branding_updated_at
BEFORE UPDATE ON public.workspace_branding
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add workspace_id to analysis_history for multi-workspace support
ALTER TABLE public.analysis_history ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;