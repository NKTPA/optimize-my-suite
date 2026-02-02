-- Enable RLS on api_key_hashes table for defense-in-depth
-- The "No client access to hashes" policy already blocks all access,
-- but RLS must be enabled at the table level for the policy to take effect
ALTER TABLE public.api_key_hashes ENABLE ROW LEVEL SECURITY;