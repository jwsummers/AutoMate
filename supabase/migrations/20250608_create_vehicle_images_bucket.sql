
-- Create vehicle-images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true);

-- Create policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload vehicle images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vehicle-images' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow users to view all vehicle images (since bucket is public)
CREATE POLICY "Allow public access to vehicle images" ON storage.objects
FOR SELECT USING (bucket_id = 'vehicle-images');

-- Create policy to allow users to update their own vehicle images
CREATE POLICY "Allow users to update their own vehicle images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'vehicle-images' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow users to delete their own vehicle images
CREATE POLICY "Allow users to delete their own vehicle images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vehicle-images' AND
  auth.role() = 'authenticated'
);
