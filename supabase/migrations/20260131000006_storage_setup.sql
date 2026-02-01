-- Create the storage bucket for characters
INSERT INTO storage.buckets (id, name, public)
VALUES ('characters', 'characters', true);

-- Enable RLS on objects
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Public access for viewing images
CREATE POLICY "Public characters access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'characters' );

-- Policy: Authenticated users can upload their own character images
-- We enforce that the file path starts with the user_id
CREATE POLICY "Users can upload own character images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'characters' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own character images
CREATE POLICY "Users can update own character images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'characters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own character images
CREATE POLICY "Users can delete own character images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'characters' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
