# 토양오염정화공사 ERP 시스템

## 프로젝트 개요
토양오염정화공사 전문 기업을 위한 ERP 시스템입니다. 수주 관리, 채권 관리, 프로젝트 관리 등의 기능을 제공합니다.

## 주요 기능
1. 수주 관리
   - 수주 등록/수정/삭제
   - 수주 현황 조회
   - 수주 상세 정보 관리
   - 첨부 파일 관리

2. 채권 관리
   - 채권 현황 조회
   - 연체 채권 관리
   - 수금 현황 관리

3. 대시보드
   - 주요 지표 현황
   - 최근 수주 현황
   - 연체 채권 알림

4. 인증 시스템 (NEW)
   - 관리자 계정 관리 방식
   - 사용자 권한별 메뉴 접근
   - 프로필 관리

5. 직원 관리 (관리자 전용) (NEW)
   - 직원 계정 생성/관리
   - 권한 설정
   - 계정 활성화/비활성화

## 기술 스택
- Frontend: Next.js 15 (기존 14에서 업그레이드), React, TypeScript
- UI: Tailwind CSS, shadcn/ui
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth (NEW)
- Deployment: Vercel

## 작업 현황

### 2025-05-29 (수주 관리 페이지 개선 및 파일 업로드 기능 구현 중) ✨ NEW
1.  **수주 관리 테이블 레이아웃 수정:**
    *   수주번호 컬럼 제거
    *   상태 컬럼을 맨 앞으로 이동
    *   고객사 유형 컬럼 추가
    *   계약금액 컬럼 명칭을 '계약금액(V.A.T 포함)'으로 변경
    *   프로젝트명 컬럼 너비 조정 및 truncate 적용
    *   계약금액과 수주유형 컬럼 사이 간격 조정
    *   테이블 내용 및 헤더 글씨 크기 조정
    *   마감일 컬럼 제거
2.  **수주 관리 필터 개선:**
    *   계약일 기준 기간 필터 추가
    *   검색 필드, 기간 필터, 드롭다운 필터를 한 행에 배치하도록 레이아웃 조정
3.  **파일 업로드 기능 구현:**
    *   `OrderForm`에서 파일 목록을 `onSubmit` 콜백으로 전달하도록 수정 (`src/components/forms/order-form.tsx`)
    *   `orderService`에 Supabase Storage 파일 업로드 (`uploadFile`) 메서드 추가 (`src/lib/supabase/database.ts`)
    *   `handleFormSubmit`에서 파일 업로드 및 파일 정보 저장 로직 구현 (`src/app/orders/page.tsx`)
    *   새 수주 생성 시 수주 저장 후 반환된 ID를 사용하여 파일 업로드 및 정보 업데이트하도록 로직 개선
    *   기존 수주 수정 시 파일 업로드 및 정보 업데이트 로직 구현
4.  **발생한 문제 및 해결 시도:**
    *   **문제:** Supabase Storage 버킷 이름 규칙 문제 발생 (밑줄 포함)
    *   **해결:** 버킷 이름을 `order-attachments` (하이픈 사용)로 수정하고 코드에 반영
    *   **문제:** 파일 업로드 시 `InvalidKey` 오류 발생 (파일 이름에 한글 포함)
    *   **해결:** 파일 경로 생성 시 `encodeURIComponent`로 파일 이름 인코딩하여 사용
    *   **문제:** 파일 업로드 시 `504 Gateway Timeout` 오류 발생 및 '저장중' 상태 멈춤 지속
    *   **해결 시도:** Supabase Storage RLS 정책 (`INSERT` for `authenticated` on `order-attachments` with `check (bucket_id = 'order-attachments')`) 확인 (정책 자체는 올바르게 설정됨). 파일 크기, 네트워크 문제, Supabase 서비스 상태 등을 추가 확인 필요.

### 2025-05-27 (인증 시스템 구축 완료) ✨ NEW
1. **인증 시스템 구축**
   - Supabase Auth 설정 완료
   - 사용자 프로필 테이블 생성 (`user_profiles`)
   - 관리자 계정 관리 방식 구현 (회원가입 없음)
   - 로그인/로그아웃 기능
   - Next.js 미들웨어를 통한 라우트 보호 (`/middleware.ts`)

2. **사용자 인터페이스 개선**
   - AuthProvider를 통한 전역 인증 상태 관리 (`/src/lib/auth/auth-context.tsx`)
   - Header 컴포넌트에 사용자 정보 및 드롭다운 메뉴 추가
   - Sidebar 컴포넌트에 사용자 권한별 메뉴 표시
   - 호버 애니메이션이 있는 반응형 사이드바
   - 로그인/에러 페이지 구현 (`/src/app/auth/`)

3. **관리자 기능**
   - 직원 계정 생성/관리 페이지 (`/admin/employees`)
   - 임시 비밀번호 자동 생성 기능
   - 계정 활성화/비활성화 기능
   - 권한별 접근 제어 (admin, manager, user)
   - 관리자 유틸리티 함수 (`/src/lib/auth/admin-utils.ts`)

4. **데이터베이스 스키마**
   - `user_profiles` 테이블 설계 및 생성
   - Row Level Security (RLS) 정책 적용
   - 인덱스 최적화 (employee_id, email, auth_user_id 등)
   - 자동 업데이트 시간 트리거

5. **타입 시스템**
   - TypeScript 타입 정의 (`/src/types/auth.ts`)
   - UserProfile, CreateUserProfile, AuthUser 등

### 2024-03-19 (수주 관리 및 대시보드 구현)
1. **수주 관리 기능 구현**
   - 수주 등록/수정 폼 구현
   - 필수 입력 필드 검증
   - 실시간 폼 유효성 검사
   - 파일 업로드 기능
   - 저장 완료 알림 기능

2. **대시보드 개선**
   - 새 수주등록 버튼 제거
   - 주요 지표 카드 레이아웃 개선
   - 최근 수주 현황 및 연체 채권 알림 섹션 구현

### 2024-03-18 (프로젝트 초기 설정)
1. **프로젝트 초기 설정**
   - Next.js 14 프로젝트 생성
   - Tailwind CSS 설정
   - shadcn/ui 컴포넌트 설치
   - 기본 레이아웃 구성

2. **데이터베이스 설정**
   - Supabase 프로젝트 생성
   - 테이블 스키마 설계
   - 기본 데이터 마이그레이션

## 🚨 현재 이슈 및 우선 해결 사항

### **긴급 수정 필요**
1. **로그인 리다이렉트 문제**
   - `localhost:3000` 접속 시 로그인 페이지가 표시되지 않고 바로 `/dashboard`로 이동
   - 미들웨어 설정 또는 AuthProvider 로직 점검 필요

2. **대시보드 레이아웃 문제**
   - `/dashboard` 페이지에서 Header와 Sidebar가 표시되지 않음
   - MainLayout 컴포넌트 또는 인증 상태 확인 로직 점검 필요

### **해결 방법 계획**
- 미들웨어의 인증 확인 로직 디버깅
- AuthProvider의 로딩 상태 처리 확인
- MainLayout의 조건부 렌더링 로직 검토
- 환경변수 설정 재확인

## 다음 작업 계획

### **우선순위 1: 현재 이슈 해결**
1. 로그인 리다이렉트 문제 해결
2. 대시보드 레이아웃 문제 해결
3. 관리자 계정 로그인 테스트 완료

### **우선순위 2: 기능 확장**
1. 채권 관리 기능 구현
2. 실적 관리 시스템 구현
3. 문서 관리 기능 추가

### **우선순위 3: 고급 기능**
1. 보고서 생성 기능
2. 실시간 알림 시스템 구현
3. 파일 업로드 최적화
4. 데이터 내보내기 (Excel, PDF)

## 기술 문서

### **폴더 구조**
src/
├── app/                    # Next.js 15 App Router
│   ├── auth/              # 인증 관련 페이지 (로그인, 에러)
│   ├── dashboard/         # 대시보드 페이지
│   ├── orders/            # 수주 관리 페이지
│   ├── receivables/       # 채권 관리 페이지
│   ├── admin/             # 관리자 전용 페이지
│   │   └── employees/     # 직원 관리
│   └── layout.tsx         # 루트 레이아웃 (AuthProvider 포함)
├── components/
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── forms/             # 폼 컴포넌트
│   ├── layout/            # 레이아웃 컴포넌트 (Header, Sidebar 등)
│   └── overdue/           # 연체 관련 컴포넌트
├── lib/
│   ├── auth/              # 인증 관련 유틸리티
│   │   ├── auth-context.tsx
│   │   └── admin-utils.ts
│   ├── supabase/          # Supabase 클라이언트 설정
│   └── utils/             # 기타 유틸리티
├── types/
│   └── auth.ts            # 인증 관련 타입 정의
└── stores/                # 상태 관리 스토어

### **인증 시스템 구조**
미들웨어 (/middleware.ts)
↓ 라우트 보호
AuthProvider (/src/lib/auth/auth-context.tsx)
↓ 전역 상태 관리
MainLayout (/src/components/layout/main-layout.tsx)
↓ 조건부 렌더링
Header + Sidebar (사용자 정보 표시)

### **데이터베이스 테이블**
- `user_profiles`: 사용자 프로필 정보 (NEW)
  - id, auth_user_id, employee_id, name, email, phone, department, position, role, is_active
- `orders`: 수주 정보 (기존)

### **관리자 계정 정보**
- **Email**: `admin@company.com`
- **사번**: `ADMIN001`
- **역할**: `admin`
- **임시 비밀번호**: `admin123!`
- **부서**: `IT팀`
- **직책**: `시스템관리자`

### **환경변수 설정**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

참고사항

모든 금액은 원화(KRW) 기준
날짜는 한국 시간대(KST) 기준
파일 업로드 제한: PDF, DOC, DOCX, XLSX, JPG, PNG
사용자 계정은 관리자가 생성하는 방식 (회원가입 없음)
Next.js 15 App Router 사용
shadcn/ui 컴포넌트 라이브러리 활용
TypeScript 엄격 모드 적용

개발 히스토리 요약

2025-05-25: 프로젝트 초기 설정 및 기본 구조
2025-05-26: 수주 관리 및 대시보드 기능 구현
2025-05-27: 완전한 인증 시스템 구축 (로그인, 권한 관리, 직원 관리)
현재: 인증 시스템 디버깅 및 레이아웃 문제 해결 진행 중