-- Create a secure view for api_keys that excludes sensitive columns
-- This view will be used by workspace members instead of the raw table

CREATE VIEW public.api_keys_safe AS
SELECT 
  id,
  workspace_id,
  name,
  key_prefix,
  created_at,
  last_used_at,
  revoked_at
FROM public.api_keys;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.api_keys_safe TO authenticated;

-- Add comment explaining the view's purpose
COMMENT ON VIEW public.api_keys_safe IS 'Secure view of api_keys that excludes key_hash to prevent exposure to workspace members';

-- Update the RLS policy on the base table to be more restrictive
-- Only service role should access the full table directly
DROP POLICY IF EXISTS "Members can view api keys" ON public.api_keys;

-- Create a new policy that only allows owners to view the full table (for key verification)
CREATE POLICY "Owners can view full api keys"
ON public.api_keys
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = api_keys.workspace_id AND w.owner_id = auth.uid()
  )
);