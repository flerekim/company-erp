# 📁 Supabase Storage 설정 가이드

파일 업로드 기능을 사용하기 위해서는 Supabase Storage 설정이 필요합니다.

## 🚨 현재 오류 상황

다음과 같은 오류가 발생하고 있습니다:
- `new row violates row-level security policy`
- `Bucket not found`
- `Invalid key`
- `Storage bucket creation requires admin privileges`

## 🔧 해결 방법

### 방법 1: SQL 파일 실행 (권장)

1. **Supabase 대시보드** 접속
2. **SQL Editor** 메뉴 클릭
3. `supabase-storage-policies.sql` 파일 내용을 복사하여 실행
4. 애플리케이션 새로고침

### 방법 2: 수동 설정

#### 1단계: Storage 버킷 생성
```sql
-- Supabase SQL Editor에서 실행
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-attachments', 'order-attachments', true)
ON CONFLICT (id) DO NOTHING;
```

#### 2단계: Storage Objects 정책 생성

**Supabase 대시보드 > Storage > Policies > Other policies under storage.objects**

1. **파일 업로드 정책**
   - Policy name: `Allow authenticated uploads to order-attachments`
   - Target roles: `authenticated`
   - Operation: `INSERT`
   - WITH CHECK: `bucket_id = 'order-attachments'`

2. **파일 조회 정책**
   - Policy name: `Allow authenticated reads from order-attachments`
   - Target roles: `authenticated`
   - Operation: `SELECT`
   - USING: `bucket_id = 'order-attachments'`

3. **파일 삭제 정책**
   - Policy name: `Allow authenticated deletes from order-attachments`
   - Target roles: `authenticated`
   - Operation: `DELETE`
   - USING: `bucket_id = 'order-attachments'`

#### 3단계: Storage Buckets 정책 생성

**Supabase 대시보드 > Storage > Policies > Policies under storage.buckets**

1. **버킷 접근 정책**
   - Policy name: `Allow authenticated bucket reads`
   - Target roles: `authenticated`
   - Operation: `SELECT`
   - USING: `id = 'order-attachments'`

## ✅ 설정 확인

설정이 완료되면:
1. 애플리케이션을 새로고침
2. 콘솔에서 `✅ Storage policies are properly configured` 메시지 확인
3. 수주 등록 시 파일 업로드 테스트

## 🔍 문제 해결

### 여전히 오류가 발생하는 경우

1. **브라우저 콘솔 확인**
   - F12 > Console 탭에서 오류 메시지 확인

2. **Supabase 대시보드에서 정책 확인**
   - Storage > Policies에서 모든 정책이 생성되었는지 확인

3. **사용자 인증 상태 확인**
   - 로그인된 사용자만 파일 업로드 가능

4. **버킷 Public 설정 확인**
   - Storage > order-attachments > Settings > Public 체크

## 📞 지원

문제가 지속되면 다음 정보와 함께 문의:
- 브라우저 콘솔 오류 메시지
- Supabase 프로젝트 설정 스크린샷
- 현재 Storage 정책 목록 