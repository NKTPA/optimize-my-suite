-- Create storage bucket for agency logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency-logos', 'agency-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own agency logo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agency-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own logo
CREATE POLICY "Users can update their own agency logo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'agency-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own logo
CREATE POLICY "Users can delete their own agency logo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agency-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to logos (for PDF generation)
CREATE POLICY "Agency logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-logos');