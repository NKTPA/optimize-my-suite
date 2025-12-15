-- Step 1: Create secure table for key hashes (client cannot access)
CREATE TABLE public.api_key_hashes (
  api_key_id uuid PRIMARY KEY REFERENCES public.api_keys(id) ON DELETE CASCADE,
  key_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Backfill existing hashes
INSERT INTO public.api_key_hashes (api_key_id, key_hash, created_at)
SELECT id, key_hash, created_at FROM public.api_keys WHERE key_hash IS NOT NULL;

-- Step 3: Drop key_hash column from api_keys (no longer needed there)
ALTER TABLE public.api_keys DROP COLUMN key_hash;

-- Step 4: Enable RLS on api_key_hashes
ALTER TABLE public.api_key_hashes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create DENY-ALL policies for client roles
-- No SELECT policy means no rows are visible
CREATE POLICY "No client access to hashes"
ON public.api_key_hashes
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Step 6: Explicitly revoke all privileges from client roles
REVOKE ALL ON public.api_key_hashes FROM anon, authenticated;

-- Step 7: Create SECURITY DEFINER function for server-side validation
-- This function can only be called, but cannot expose the hash
CREATE OR REPLACE FUNCTION public.validate_api_key(p_plaintext_key text)
RETURNS TABLE(valid boolean, workspace_id uuid, api_key_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_key_record RECORD;
BEGIN
  -- Compute SHA-256 hash of the plaintext key
  v_hash := encode(sha256(p_plaintext_key::bytea), 'hex');
  
  -- Look up the key by hash
  SELECT ak.id, ak.workspace_id, ak.revoked_at
  INTO v_key_record
  FROM public.api_keys ak
  JOIN public.api_key_hashes akh ON akh.api_key_id = ak.id
  WHERE akh.key_hash = v_hash;
  
  -- Check if found and not revoked
  IF v_key_record.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid;
  ELSIF v_key_record.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid;
  ELSE
    -- Update last_used_at
    UPDATE public.api_keys SET last_used_at = now() WHERE id = v_key_record.id;
    RETURN QUERY SELECT true, v_key_record.workspace_id, v_key_record.id;
  END IF;
END;
$$;

-- Step 8: Grant execute on validation function to authenticated users
-- (they can validate, but cannot see the hash)
GRANT EXECUTE ON FUNCTION public.validate_api_key(text) TO authenticated;

-- Step 9: Recreate api_keys_safe view without key_hash reference
DROP VIEW IF EXISTS public.api_keys_safe;
CREATE VIEW public.api_keys_safe WITH (security_invoker = true) AS
SELECT 
  id,
  workspace_id,
  key_prefix,
  name,
  created_at,
  last_used_at,
  revoked_at
FROM public.api_keys;