CREATE TABLE public.audit_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  url text NOT NULL,
  overall_score integer NULL
);

CREATE INDEX audit_leads_created_at_idx ON public.audit_leads (created_at DESC);
CREATE INDEX audit_leads_email_idx ON public.audit_leads (lower(email));

GRANT INSERT ON public.audit_leads TO anon;
GRANT INSERT ON public.audit_leads TO authenticated;
GRANT ALL ON public.audit_leads TO service_role;

ALTER TABLE public.audit_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can INSERT a lead from the marketing form.
-- Nobody can SELECT/UPDATE/DELETE from the client — only service_role (admin/edge functions).
CREATE POLICY "Anyone can submit a lead"
  ON public.audit_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(url) BETWEEN 4 AND 2048
  );
