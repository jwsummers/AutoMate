
-- SQL will be executed through <lov-sql> block in a separate message 
-- This file is just for reference as we need to create the bucket via SQL in a separate message

-- Create a storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'Vehicle Images', true);

-- Create a policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload vehicle images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

-- Create a policy to allow anyone to view vehicle images
CREATE POLICY "Anyone can view vehicle images"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'vehicle-images');

-- Create a policy to allow users to update their own images
CREATE POLICY "Users can update their own vehicle images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create a policy to allow users to delete their own images
CREATE POLICY "Users can delete their own vehicle images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = auth.uid()::text);
