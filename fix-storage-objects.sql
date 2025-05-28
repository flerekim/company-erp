-- Fix Storage Objects Policies - 즉시 해결
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책 완전 삭제 (혹시 있다면)
DROP POLICY IF EXISTS "Allow authenticated uploads to order-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from order-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to order-attachments" ON storage.objects;  
DROP POLICY IF EXISTS "Allow authenticated deletes from order-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;

-- 2. Storage Objects 테이블에 정책 생성 (핵심!)
CREATE POLICY "Enable upload for authenticated users on order-attachments"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'order-attachments');

CREATE POLICY "Enable read for authenticated users on order-attachments"  
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'order-attachments');

CREATE POLICY "Enable update for authenticated users on order-attachments"
ON storage.objects  
FOR UPDATE
TO authenticated
USING (bucket_id = 'order-attachments')
WITH CHECK (bucket_id = 'order-attachments');

CREATE POLICY "Enable delete for authenticated users on order-attachments"
ON storage.objects
FOR DELETE  
TO authenticated
USING (bucket_id = 'order-attachments');

-- 3. 정책 확인
SELECT 
  schemaname,
  tablename, 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- 4. 모든 Storage 정책 확인  
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY tablename, policyname; 