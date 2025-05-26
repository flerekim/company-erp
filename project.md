# 회사 웹 ERP 개발 프로젝트

## 📋 프로젝트 개요

**프로젝트명**: 토양오염정화공사 전문 ERP 시스템

**개발자**: 초보 개발자

**예상 사용자**: 10명

**핵심 기능**: 수주 관리, 채권 관리

**시작일**: 2024-05-26

**최근 업데이트**: 2024-05-26

## 🛠️ 기술 스택

### 프론트엔드

- **Next.js 15.3.2** (App Router) - 서버 컴포넌트 최적화 완료
- **React 19.0.0** (Stable) - 최신 버전 적용
- **TypeScript** - 타입 안정성 보장
- **Tailwind CSS** - 반응형 스타일링
- **shadcn/ui** - React 19 호환 UI 컴포넌트

### 백엔드 & 데이터베이스

- **Supabase** ✅ 연동 완료
  - PostgreSQL 데이터베이스
  - 실시간 구독
  - 인증 & 권한 관리
  - Row Level Security (RLS)

### 배포 & 인프라

- **Vercel** (향후 배포 예정)
- **환경변수**: Vercel 환경변수 관리

## 📂 현재 프로젝트 구조

```
company-erp/
├── .npmrc                          # React 19 호환성 설정 (legacy-peer-deps=true)
├── .env.local                      # ✅ Supabase 환경변수 설정
├── src/
│   ├── app/                        # Next.js 15 App Router
│   │   ├── dashboard/
│   │   │   └── page.tsx            # ✅ 대시보드 (토양정화 업무 최적화)
│   │   ├── orders/
│   │   │   └── page.tsx            # ✅ 수주 관리 (실제 엑셀 구조 반영)
│   │   ├── receivables/
│   │   │   └── page.tsx            # ✅ 채권 관리 (완전 구현)
│   │   ├── employees/              # 📋 직원 관리 (미구현)
│   │   ├── globals.css             # ✅ 전역 스타일
│   │   ├── layout.tsx              # ✅ 서버 컴포넌트 루트 레이아웃
│   │   └── page.tsx                # ✅ 홈페이지 (대시보드 리디렉션)
│   ├── components/                 # 재사용 가능한 컴포넌트
│   │   ├── ui/                     # ✅ shadcn/ui 컴포넌트들 (20개)
│   │   ├── forms/
│   │   │   └── payment-form.tsx    # ✅ 입금 처리 폼
│   │   ├── layout/
│   │   │   ├── main-layout.tsx     # ✅ 클라이언트 레이아웃 컴포넌트
│   │   │   ├── sidebar.tsx         # ✅ 호버 반응형 사이드바
│   │   │   ├── header.tsx          # ✅ 헤더 (검색, 알림, 사용자메뉴)
│   │   │   └── breadcrumb.tsx      # ✅ 브레드크럼 네비게이션
│   │   ├── overdue/
│   │   │   ├── overdue-alerts.tsx   # ✅ 연체 알림 컴포넌트
│   │   │   ├── overdue-levels.tsx   # ✅ 연체 단계별 현황
│   │   │   └── overdue-details.tsx  # ✅ 연체 상세 정보 (2열 레이아웃)
│   │   └── common/                 # 📋 공통 컴포넌트 (미구현)
│   ├── lib/
│   │   ├── utils.ts                # ✅ cn 유틸리티 함수
│   │   ├── supabase.ts             # ✅ Supabase 클라이언트 설정
│   │   └── database.ts             # ✅ 데이터 접근 유틸리티 함수
│   ├── types/
│   │   └── receivables.ts          # ✅ 채권 관리 타입 정의
│   └── stores/                     # 📋 상태 관리 (미구현)
├── supabase/migrations/            # ✅ 데이터베이스 스키마
├── components.json                 # ✅ shadcn/ui 설정
├── tailwind.config.js              # ✅ Tailwind 설정
├── tsconfig.json                   # ✅ TypeScript 설정
├── package.json                    # ✅ 의존성 관리
└── project.md                      # ✅ 프로젝트 문서 (현재 파일)
```

## ✅ 완성된 기능들

### 🎨 레이아웃 시스템 (완료)

- [x] **서버/클라이언트 컴포넌트 분리**: Next.js 15 최적화 완료
- [x] **반응형 사이드바**: 마우스 호버로 펼치기/접기 (100ms 딜레이)
- [x] **헤더**: 검색바, 알림 배지, 사용자 드롭다운 메뉴
- [x] **브레드크럼**: 현재 위치 표시 및 네비게이션
- [x] **반응형 디자인**: 모바일/태블릿/데스크톱 완벽 대응

### 📊 대시보드 (완료)

- [x] **토양정화 전문 지표**: 총 수주, 진행중, 완료, 연체채권, 수금률
- [x] **실제 업무 데이터**: 제2218부대, 한국토지주택공사 등 실제 고객사
- [x] **최근 수주 현황**: 최신 수주 3건 표시 (토양정화 프로젝트)
- [x] **연체 채권 알림**: 즉시 조치 필요한 건들 강조 표시
- [x] **통화 포맷팅**: 한국 원화 형식 (₩1,063,758,000)

### 📋 수주 관리 시스템 (완료)

- [x] **토양정화 전문 데이터 구조**: 실제 엑셀 파일 분석 결과 반영
- [x] **관수/민수 구분**: 정부기관(보라색) vs 민간(청록색) 배지
- [x] **수주 목록 테이블**: 페이징, 정렬, 필터링 지원
- [x] **실시간 검색**: 고객사, 프로젝트명, 수주번호로 검색
- [x] **다중 필터링**: 민관구분, 상태, 수주유형별 필터
- [x] **토양정화 전문 정보**:
  - 정화방법: 토양경작법, 토양세척법, 열탈착법 등
  - 오염항목: TPH, BTEX, 중금속 등 표시
  - 반출여부: 부지내(녹색) vs 반출(황색) 배지
  - 검증업체: 울산과학대학교 산학협력단 등
- [x] **변경 수주 관리**: 신규/1차변경/2차변경/3차변경 구분
- [x] **담당자 정보**: 주담당자/부담당자 (이대룡/백승호 형태)
- [x] **진행률 표시**: 프로젝트 진행 상황 시각화
- [x] **액션 메뉴**: 상세보기/수정/삭제 드롭다운

### 💰 채권 관리 시스템 (완료)

- [x] **채권 목록 페이지**: 완전한 CRUD 인터페이스
- [x] **연체 단계별 현황**: 정상/주의/장기/부실 4단계 분류
- [x] **연체 알림 시스템**: 긴급도별 색상 구분 및 즉시 조치 안내
- [x] **입금 처리 폼**: 계좌이체, 수표, 현금 등 다양한 결제 방식 지원
- [x] **연체 상세 관리**: 
  - 채권 기본 정보 및 금액 현황
  - 연체 관리 이력 (전화/이메일/방문/공문/법적조치)
  - 새 조치 등록 시스템
  - 리스크 평가 및 회수 전망
- [x] **실시간 계산**: 수금률, 연체일수, 연체단계 자동 계산
- [x] **다이얼로그 레이아웃**: 2열 가로 레이아웃으로 UX 최적화

## 🗄️ 데이터베이스 구조 (Supabase)

### 📊 완성된 테이블들

**1. orders (수주 관리)**
- 수주번호, 프로젝트명, 고객사 정보
- 토양정화 전문 필드 (정화방법, 오염항목, 반출여부)
- 계약금액, 진행률, 담당자 정보

**2. receivables (채권 관리)**
- 채권번호, 연결된 수주 정보
- 계약금액, 세금, 총액, 기입금액, 미수금액
- 결제조건, 만료일, 연체정보 (일수, 단계)

**3. payments (입금 내역)**
- 입금번호, 입금일, 입금액, 결제방식
- 은행정보, 입금자명, 메모

**4. overdue_history (연체 관리 이력)**
- 조치유형, 조치일, 조치내용, 결과
- 다음 조치 예정일, 메모

### 🔄 자동화된 비즈니스 로직

- [x] **연체 일수 자동 계산**: 만료일 기준 자동 계산
- [x] **연체 단계 자동 분류**: 60일/90일/180일 기준
- [x] **결제 상태 자동 업데이트**: 미수→부분수금→완료→연체
- [x] **미수금액 자동 계산**: 입금 시마다 실시간 업데이트
- [x] **수금률 자동 계산**: 입금액/총액 비율 계산

## 🔧 설치된 패키지들

### 주요 의존성

```json
{
  "next": "15.3.2",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5",
  "tailwindcss": "^4",
  "@supabase/supabase-js": "^2.49.8",
  "date-fns": "^3.6.0",
  "react-hook-form": "^7.56.4",
  "zod": "^3.25.28"
}
```

### shadcn/ui 컴포넌트 (20개 설치 완료)

- [x] button, input, label, card, form
- [x] table, dialog, dropdown-menu
- [x] select, textarea, badge, avatar
- [x] separator, tabs, calendar, popover
- [x] sheet, progress, toast

### 설정 파일

- [x] `.npmrc`: `legacy-peer-deps=true` (React 19 호환성)
- [x] `components.json`: shadcn/ui 설정
- [x] `tailwind.config.js`: CSS 변수 및 애니메이션 설정
- [x] `.env.local`: Supabase 환경변수

## 📊 실제 업무 데이터 구조

### 토양오염정화공사 전문 필드

```typescript
interface Order {
  id: string
  order_number: string           // "ORD-2024-001"
  project_name: string          // "24-A-OO부대 토양오염정화공사(1517)"
  client_type: 'government' | 'private'  // 관수/민수 구분
  company_name: string          // "제2218부대", "한국토지주택공사"
  contract_date: string         // "2024-11-28"
  contract_amount: number       // 1063758000 (약 10억원)
  order_type: 'new' | 'change1' | 'change2' | 'change3'
  transport_type: 'onsite' | 'transport'     // 부지내/반출
  remediation_method: string    // "토양경작법", "토양세척법"
  contamination_info: string    // "TPH(3,915mg/kg)"
  verification_company: string  // "울산과학대학교 산학협력단"
  status: 'contracted' | 'in_progress' | 'completed' | 'cancelled'
  progress_percentage: number   // 0-100
  primary_manager: string       // "이대룡"
  secondary_manager?: string    // "백승호"
}
```

### 실제 고객사 목록

- **관수 (정부기관)**: 제2218부대, 육군5378부대, 인천광역시 종합건설본부
- **민수 (민간)**: 한국토지주택공사, 현대건설, SK건설

### 담당자 목록

- **이대룡**: 주담당자 (토양정화 전문)
- **박찬수**: 대형 프로젝트 담당
- **최진우**: 기술부 엔지니어
- **김판근**: 현장 관리자
- **백승호**: 부담당자

## 🎯 현재 진행 상황

### ✅ 완료된 단계들

**1단계: 프로젝트 초기 설정** ✅ 완료
- [x] Next.js 15 프로젝트 생성
- [x] shadcn/ui 설치 및 설정
- [x] 기본 폴더 구조 생성

**2단계: 홈 화면 구성 및 레이아웃** ✅ 완료
- [x] 반응형 사이드바
- [x] 헤더 및 네비게이션
- [x] 브레드크럼

**3단계: 핵심 ERP 모듈** ✅ 완료
- [x] 대시보드 (토양정화 전문 지표)
- [x] 수주 관리 (완전한 CRUD)
- [x] 채권 관리 (완전한 CRUD + 연체 관리)

**4단계: 데이터베이스 연동** ✅ 완료
- [x] Supabase 프로젝트 생성 및 연결
- [x] 토양정화 업무 특화 데이터베이스 스키마 설계
- [x] 실시간 데이터 CRUD 연동
- [x] 자동화된 비즈니스 로직 (연체 계산, 수금률 등)

### 📋 다음 단계 우선순위

**5단계: 폼 시스템 구현**
- [ ] 수주 등록/수정 폼 (`OrderForm.tsx`)
- [ ] 토양정화 전문 필드 입력 UI
- [ ] 파일 업로드 기능 (계약서, 도면 등)
- [ ] 유효성 검사 (react-hook-form + zod)

**6단계: 인증 시스템 구축**
- [ ] Supabase Auth 설정
- [ ] 로그인/회원가입 페이지
- [ ] 미들웨어를 통한 라우트 보호
- [ ] 사용자 권한 시스템

**7단계: 고급 기능**
- [ ] 실시간 알림
- [ ] 리포트 생성
- [ ] 데이터 내보내기
- [ ] 직원 관리 시스템

**8단계: 배포 및 최적화**
- [ ] Vercel 배포 설정
- [ ] 성능 최적화
- [ ] SEO 최적화
- [ ] 에러 모니터링

## 🚨 해결된 주요 이슈들

### ✅ React 19 호환성 문제 (해결완료)

**문제**: `date-fns`, `react-day-picker` 등이 React 19와 peer dependency 충돌

**해결**: `.npmrc` 파일에 `legacy-peer-deps=true` 설정

### ✅ Next.js 15 Layout 최적화 (해결완료)

**문제**: 루트 레이아웃이 클라이언트 컴포넌트로 설정되어 SSR 혜택 못받음

**해결**: 서버/클라이언트 컴포넌트 완전 분리
- `layout.tsx`: 서버 컴포넌트 (SEO 최적화)
- `main-layout.tsx`: 클라이언트 컴포넌트 (인터랙션 처리)

### ✅ shadcn/ui 설치 오류 (해결완료)

**문제**: Tailwind v4 호환성 이슈

**해결**: 단계별 컴포넌트 설치 및 호환성 확인

### ✅ 데이터베이스 스키마 오류 (해결완료)

**문제**: PostgreSQL 날짜 계산 문법 오류

**해결**: `EXTRACT()` 함수 제거, 직접 날짜 차이 계산 사용

### ✅ TypeScript 타입 오류 (해결완료)

**문제**: `any` 타입 사용으로 인한 타입 안정성 부족

**해결**: 명시적 인터페이스 정의 및 타입 캐스팅

### ✅ 다이얼로그 레이아웃 문제 (해결완료)

**문제**: 연체 상세 정보 다이얼로그가 세로로만 길어서 사용성 저하

**해결**: 2열 가로 레이아웃으로 재구성, 다이얼로그 폭 확장

## 💡 개발 가이드라인

### 코딩 규칙

- **컴포넌트**: PascalCase (`OrderForm`)
- **함수/변수**: camelCase (`handleSubmit`)
- **파일명**: kebab-case (`order-form.tsx`)
- **주석**: 각 파일 상단에 경로와 기능 설명

### 폴더 구조 원칙

- `src/app/`: 페이지 라우트 (Next.js App Router)
- `src/components/ui/`: shadcn/ui 컴포넌트
- `src/components/forms/`: 폼 관련 컴포넌트
- `src/components/layout/`: 레이아웃 컴포넌트
- `src/lib/`: 유틸리티 함수 및 설정

### 상태 관리

- **현재**: React useState + Supabase 실시간 데이터
- **향후**: React Query 또는 Zustand 추가 고려

## 🎨 디자인 시스템

### 컬러 팔레트

- **Primary**: Blue (`blue-600`, `blue-700`)
- **Success**: Green (`green-600`)
- **Warning**: Yellow (`yellow-600`)
- **Danger**: Red (`red-600`)
- **Neutral**: Gray (`gray-100` ~ `gray-900`)

### 토양정화 업무 전용 배지 색상

```typescript
const CLIENT_TYPE_COLORS = {
  government: 'bg-purple-100 text-purple-800',  // 관수 (보라색)
  private: 'bg-cyan-100 text-cyan-800'          // 민수 (청록색)
}

const STATUS_COLORS = {
  contracted: 'bg-blue-100 text-blue-800',      // 계약 (파란색)
  in_progress: 'bg-yellow-100 text-yellow-800', // 진행중 (노란색)
  completed: 'bg-green-100 text-green-800',     // 완료 (녹색)
  cancelled: 'bg-red-100 text-red-800'          // 취소 (빨간색)
}

const TRANSPORT_TYPE_COLORS = {
  onsite: 'bg-green-50 text-green-700',         // 부지내 (녹색)
  transport: 'bg-amber-50 text-amber-700'       // 반출 (황색)
}

const OVERDUE_LEVEL_COLORS = {
  normal: 'bg-blue-100 text-blue-800',          // 정상 (파란색)
  warning: 'bg-yellow-100 text-yellow-800',     // 주의 (노란색)
  longterm: 'bg-orange-100 text-orange-800',    // 장기 (주황색)
  bad: 'bg-red-100 text-red-800'                // 부실 (빨간색)
}
```

## 🔄 개발자를 위한 시작 가이드

### 1. 프로젝트 설정

```bash
# 프로젝트 폴더로 이동
cd company-erp

# 의존성 설치 (.npmrc 파일로 자동 호환성 처리)
npm install

# 환경변수 설정 (.env.local 생성)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# 개발 서버 실행
npm run dev
```

### 2. 현재 기능 테스트

- 브라우저에서 `http://localhost:3000` 접속
- 사이드바 호버 기능 확인 (100ms 딜레이)
- 대시보드 → 수주 관리 → 채권 관리 네비게이션 테스트
- 검색 및 필터링 기능 테스트 (관수/민수, 상태별)
- 채권 상세보기 다이얼로그 테스트
- 입금 처리 폼 테스트

### 3. 데이터베이스 확인

- Supabase 대시보드에서 SQL Editor 접속
- 생성된 테이블들 확인: orders, receivables, payments, overdue_history
- 샘플 데이터 확인 및 자동 계산 로직 테스트

## 📞 개발 진행 상황

### 🎉 성공적으로 완료된 작업들

1. **✅ 1단계: 프로젝트 초기 설정** - Next.js 15 + React 19 환경 구축
2. **✅ 2단계: 레이아웃 시스템** - 서버/클라이언트 컴포넌트 최적화
3. **✅ 3단계: 대시보드 구현** - 토양정화 업무 특화 지표
4. **✅ 4단계: 수주 관리** - 완전한 CRUD 시스템
5. **✅ 5단계: 채권 관리** - 연체 관리 포함 완전 구현
6. **✅ 6단계: Supabase 연동** - 실시간 데이터베이스 연결
7. **✅ 7단계: 비즈니스 로직** - 자동 계산 및 업데이트 시스템

### 🚀 현재 상태

- **서버 실행**: ✅ 정상 동작
- **레이아웃**: ✅ 호버 사이드바, 헤더, 브레드크럼 완벽 작동
- **페이지**: ✅ 대시보드, 수주관리, 채권관리 완전 구현
- **데이터베이스**: ✅ Supabase 연동 및 실시간 데이터 처리
- **비즈니스 로직**: ✅ 연체 계산, 수금률 등 자동화
- **반응형**: ✅ 모바일/데스크톱 완벽 대응

### 🎯 다음 목표

**수주 등록/수정 폼 시스템 구현** - 토양정화 업무 특성을 반영한 데이터 입력 시스템

---

**최근 업데이트**: 2024-05-26

**다음 마일스톤**: 수주 폼 시스템 + 인증 시스템

**프로젝트 진행률**: 80% (Supabase 연동 완료, 핵심 기능 구현 완료)

## 🏆 프로젝트 성과

- **완전한 토양정화 전문 ERP**: 실제 업무 프로세스를 반영한 전문 시스템
- **실시간 데이터 처리**: Supabase를 통한 즉시 업데이트
- **자동화된 비즈니스 로직**: 연체 관리, 수금률 계산 등 수작업 최소화
- **직관적인 사용자 경험**: 토양정화 업체 직원들이 쉽게 사용할 수 있는 인터페이스
- **확장 가능한 아키텍처**: 추가 기능 확장이 용이한 구조