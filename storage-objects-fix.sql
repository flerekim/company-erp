-- Missing Storage Objects Policies Fix
-- Execute this in Supabase SQL Editor

-- 1. Check if policies exist and drop if needed
DROP POLICY IF EXISTS "Allow authenticated uploads to order-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from order-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to order-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from order-attachments" ON storage.objects;

-- 2. Create Storage Objects policies (these are missing!)
CREATE POLICY "Allow authenticated uploads to order-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-attachments');

CREATE POLICY "Allow authenticated reads from order-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'order-attachments');

CREATE POLICY "Allow authenticated updates to order-attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'order-attachments')
WITH CHECK (bucket_id = 'order-attachments');

CREATE POLICY "Allow authenticated deletes from order-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'order-attachments');

-- 3. Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname; 