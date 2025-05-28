-- Supabase Storage 정책 설정 SQL
-- 이 파일을 Supabase SQL Editor에서 실행하세요

-- 1. order-attachments 버킷 생성 (이미 있으면 무시됨)
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-attachments', 'order-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Objects 정책들

-- 파일 업로드 허용 (INSERT)
CREATE POLICY "Allow authenticated uploads to order-attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-attachments');

-- 파일 조회 허용 (SELECT)
CREATE POLICY "Allow authenticated reads from order-attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'order-attachments');

-- 파일 수정 허용 (UPDATE)
CREATE POLICY "Allow authenticated updates to order-attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'order-attachments')
WITH CHECK (bucket_id = 'order-attachments');

-- 파일 삭제 허용 (DELETE)
CREATE POLICY "Allow authenticated deletes from order-attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'order-attachments');

-- 3. Storage Buckets 정책들

-- 버킷 조회 허용
CREATE POLICY "Allow authenticated bucket reads"
ON storage.buckets
FOR SELECT
TO authenticated
USING (id = 'order-attachments');

-- 버킷 수정 허용 (필요시)
CREATE POLICY "Allow authenticated bucket updates"
ON storage.buckets
FOR UPDATE
TO authenticated
USING (id = 'order-attachments')
WITH CHECK (id = 'order-attachments');

-- 4. 기존 정책이 있다면 삭제 후 재생성 (선택사항)
-- DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
-- DROP POLICY IF EXISTS "기존정책명" ON storage.objects;

-- 정책 확인 쿼리
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
ORDER BY tablename, policyname; 