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

### 2025-06-01 (수주 관리 페이지 UI/UX 개선 및 인쇄 기능 최적화) ✨ NEW
1.  **"신규+변경" 다이얼로그 데이터 유지 문제 해결** (`src/app/orders/page.tsx`):
    *   "신규+변경" 클릭 시 나타나는 다이얼로그에서 파일 관리 또는 수정 기능 사용 후 내용이 사라지는 문제를 해결하기 위해, `orderGroupDetails` 상태를 추가하고 다이얼로그가 이 상태를 참조하도록 변경했습니다. 관련 다이얼로그 닫힘 로직도 수정했습니다.

2.  **수주관리 페이지 및 테이블 보기 방식 수정** (`src/app/orders/page.tsx`):
    *   "향후 대시보드 삽입" 영역을 제거했습니다.
    *   테이블 오른쪽 상단에 "요약 보기" / "전체 보기" 전환 버튼을 추가했습니다.
        *   `tableViewMode` 상태 (`summary` | `full`)를 추가했습니다.
        *   "요약"은 프로젝트별 합산, "전체"는 모든 계약 개별 표시입니다.
        *   `renderOrderTable` 함수에 `showManagementColumn` 옵션을 추가하여 "관리" 컬럼을 조건부 렌더링하고, `colSpan`을 동적으로 조절했습니다.
        *   `getSortedData` 함수를 만들어 `tableViewMode`에 따라 다른 데이터 소스(`summaryDisplayOrders` 또는 `filteredOrders`)를 정렬하도록 했습니다.
    *   **관리 기능 제한**:
        *   "요약 보기"의 "신규+변경" 다이얼로그 내 테이블에서는 "관리" 컬럼을 숨겼습니다.
        *   "요약 보기"의 메인 테이블에서는 수정 기능을 비활성화하고, 삭제는 "신규+변경" 행(프로젝트 전체 삭제)에 대해서만 가능하도록 버튼 `disabled` 로직 및 핸들러 함수(`handleEditOrder`, `handleDeleteConfirm`)를 수정했습니다.
        *   삭제 확인 다이얼로그 메시지를 `tableViewMode`에 따라 다르게 표시하도록 수정했습니다.
    *   **삭제 로직 변경**: `handleDeleteOrder` 함수를 수정하여, "전체 보기"에서는 ID 기준 단일 계약 삭제, "요약 보기"의 "신규+변경" 행에서는 `project_name` 기준 프로젝트 전체 계약을 삭제하도록 변경했습니다.

3.  **"전체 보기" 모드에서 수정 시 데이터 로드 문제 해결** (`src/components/forms/order-form.tsx`):
    *   수정 모드에서 `OrderForm`의 `initialData` prop이 변경될 때 `form.reset()`이 호출되지 않아 이전 데이터가 남는 문제를 해결하기 위해, `initialData`를 의존성으로 하는 `useEffect`를 추가하여 `form.reset()`을 호출하고 관련 상태(`contractAmountDisplay`, `contaminationList`, `formMode`)를 업데이트하도록 수정했습니다.

4.  **"변경" 계약 수정 시 "프로젝트명" 로드 문제 해결** (`src/components/forms/order-form/basic-info-tab.tsx`):
    *   "변경" 탭에서 "프로젝트명" 입력 필드가 `react-hook-form` 상태 대신 로컬 `projectSearch` 상태와 바인딩되어 `initialData`의 프로젝트명이 표시되지 않는 문제를 해결했습니다.
    *   `projectSearch` 상태의 초기값을 `form.getValues('project_name')`으로 설정하고, `formMode` 또는 `form.watch('project_name')` 변경 시 `projectSearch`를 동기화하는 `useEffect`를 추가했습니다.

5.  **인쇄 영역 지정 및 최적화** (`src/app/orders/page.tsx`, `src/app/globals.css`):
    *   수주관리 페이지의 메인 `Card`에 `id="printable-orders-area"`를 추가하고, 테이블 컨테이너 div에 `id="orders-table-container"`를 추가했습니다.
    *   인쇄 버튼, 새 수주 등록 버튼 및 기타 필터 UI 요소들에 `no-print` 클래스를 추가했습니다.
    *   `globals.css`에 `@media print` 규칙을 추가하여 특정 영역만 인쇄되고, 테이블 내용 전체가 잘리지 않고 보이도록 CSS 스타일을 적용했습니다.

### 2025-05-30 (수주 관리 페이지 개선 및 파일 업로드 기능 구현 중) ✨ NEW
1. **고객사 유형 변경**: "공공기관"과 "민간기업"을 "관수"와 "민수"로 변경하였습니다.
2. **테이블 정렬**: 모든 테이블 헤더와 내용을 가운데 정렬하였습니다.
3. **계약금액 입력 필드**: 천 단위 구분자가 실시간으로 표시되도록 수정하였습니다.
4. **수주유형 추가**: "4차 변경"과 "5차 변경" 옵션을 추가하였습니다.
5. **라벨 변경**: "처리 방식"을 "정화 장소"로 변경하고, 선택 옵션을 "부지내"와 "반출"로 단순화하였습니다.
6. **진행률 및 오염정보 열 추가**: 계약일 옆에 진행률 열을 추가하고, 오염정보 열을 추가하여 클릭 시 상세 정보를 표시하도록 하였습니다.
7. **오염물질 그룹화**: TPH, 벤젠, 톨루엔, 에틸벤젠, 크실렌을 "유류"로 그룹화하고, 벤조(a)피렌은 별도로 표시하도록 하였습니다.

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

### **해결 완료** ✅
1. **로그인 리다이렉트 문제**
   - ~~`localhost:3000` 접속 시 로그인 페이지가 표시되지 않고 바로 `/dashboard`로 이동~~
   - **해결됨**: 미들웨어와 AuthProvider 타임아웃 로직 개선으로 정상 작동

2. **대시보드 레이아웃 문제**
   - ~~`/dashboard` 페이지에서 Header와 Sidebar가 표시되지 않음~~
   - **해결됨**: 대시보드를 홈페이지로 대체하고 MainLayout 정상 작동 확인

3. **세션 관리 문제**
   - **해결됨**: sessionStorage를 활용한 브라우저 세션 관리 구현

### **현재 진행중인 개선사항**
1. **날씨 API 최적화**
   - OpenWeatherMap API 호출 최적화 및 캐싱 시스템 검토
   - 위치 정보 정확도 향상

2. **사용자 경험 개선**
   - 날씨 데이터 로딩 상태 표시 개선
   - 오프라인 상태 처리 및 에러 메시지 개선

## 다음 작업 계획

### **우선순위 1: 사용자 경험 향상**
1. 날씨 API 성능 최적화 및 캐싱 시스템 구현
2. 오프라인 상태 처리 및 에러 복구 메커니즘
3. 접근성 개선 (키보드 네비게이션, 스크린 리더 지원)

### **우선순위 2: 기능 확장**
1. 채권 관리 기능 구현
2. 실적 관리 시스템 구현
3. 문서 관리 기능 추가
4. 대시보드 개인화 기능 (날씨 지역 설정, 위젯 선택 등)

### **우선순위 3: 고급 기능**
1. 보고서 생성 기능
2. 실시간 알림 시스템 구현
3. 파일 업로드 최적화
4. 데이터 내보내기 (Excel, PDF)
5. 다국어 지원 (i18n)

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
OPENWEATHERMAP_API_KEY=your_openweathermap_api_key

참고사항

모든 금액은 원화(KRW) 기준
날짜는 한국 시간대(KST) 기준
파일 업로드 제한: PDF, DOC, DOCX, XLSX, JPG, PNG
사용자 계정은 관리자가 생성하는 방식 (회원가입 없음)
Next.js 15 App Router 사용
shadcn/ui 컴포넌트 라이브러리 활용
TypeScript 엄격 모드 적용

개발 히스토리 요약

- 2025-05-25: 프로젝트 초기 설정 및 기본 구조
- 2025-05-26: 수주 관리 및 대시보드 기능 구현  
- 2025-05-27: 완전한 인증 시스템 구축 (로그인, 권한 관리, 직원 관리)
- 2025-05-29: 수주 관리 페이지 개선 및 파일 업로드 기능 구현
- **2025-01-30: 날씨 기능이 포함된 홈페이지 구현 및 인증 시스템 최적화 완료** ✨
- **현재**: 안정적인 ERP 시스템 운영 중, 사용자 경험 개선 및 기능 확장 계획

## [2024-06-XX] 수주관리(Orders) 페이지/폼 고도화 작업 내역

### 1. 신규/변경 등록 다이얼로그 UX/데이터 개선
- 신규/변경 토글 시 폼 전체 초기화(모든 입력값 리셋)
- 변경계약에서 프로젝트명 자동완성 클릭 시 contract_amount(계약금액)는 불러오지 않음
- 자동완성 드롭다운 클릭 시 즉시 닫히도록 showDropdown state 추가
- 자동완성 클릭 시 고객사명/유형, 기술/관리정보 등은 자동입력, 계약금액은 미입력
- 코드 내 prop(mode)와 내부 토글 state(formMode) 분리, 타입 혼동 방지
- UX 및 데이터 정합성 강화

### 2. 테이블/집계/삭제/수정/팝오버/엑셀 내보내기 등 실무 기능 개선
- 같은 프로젝트의 신규+변경 계약을 한 줄로 집계, 계약금액 합산, 수주유형은 '신규+변경'로 표시
- 변경계약이 있으면 클릭 시 전체 계약 내역을 다이얼로그(테이블)로 보여주는 UX 적용
- 오염정보는 그룹화 및 팝오버로 상세 표시, 입력방식도 동적 배열로 변경, 타입 동기화 및 JSON 파싱 처리 등 데이터 일관성 확보
- 삭제 시 해당 프로젝트의 모든 계약(신규+변경)을 한 번에 삭제하도록 supabase delete 쿼리로 개선
- 변경계약 수정은 전체 계약 내역 다이얼로그에서 각 행에 '수정' 버튼 추가로 가능(구현 예정)
- 테이블/엑셀 내보내기 등에서 타입 오류(null, 확장 필드 등) 안전하게 처리

### 3. 기타
- 사이드바/필터/버튼 UI 반응형 문제 해결(min-w-0, w-full, overflow-x-hidden 등)
- 프로젝트명 자동완성, 대용량 데이터 대응, 삭제/수정/집계 등 실무적 데이터 정합성 및 UX 고민이 반영됨
- 각 단계별로 코드 예시, UX 흐름, 성능/확장성까지 상세하게 논의 및 적용

---

(최신 작업 내역은 git commit description도 참고)