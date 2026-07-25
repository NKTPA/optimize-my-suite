CREATE OR REPLACE FUNCTION public.increment_workspace_analyses(_workspace_id uuid, _limit int)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.workspace_usage
  SET analyses_used = analyses_used + 1,
      updated_at = now()
  WHERE workspace_id = _workspace_id
    AND analyses_used < _limit
  RETURNING analyses_used;
$$;

REVOKE ALL ON FUNCTION public.increment_workspace_analyses(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_workspace_analyses(uuid, int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_workspace_analyses(uuid, int) TO service_role;