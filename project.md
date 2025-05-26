# 회사 웹 ERP 개발 프로젝트

## 📋 프로젝트 개요

**프로젝트명**: 토양오염정화공사 전문 ERP 시스템  
**개발자**: 초보 개발자  
**예상 사용자**: 10명  
**핵심 기능**: 수주 관리, 채권 관리  
**시작일**: 2024-05-26  
**최근 업데이트**: 2024-05-28

## 🛠️ 기술 스택

### 프론트엔드
- **Next.js 15.3.2** (App Router) - 서버 컴포넌트 최적화 완료
- **React 19.0.0** (Stable) - 최신 버전 적용
- **TypeScript** - 타입 안정성 보장
- **Tailwind CSS** - 반응형 스타일링
- **shadcn/ui** - React 19 호환 UI 컴포넌트

### 백엔드 & 데이터베이스
- **Supabase** (향후 연동 예정)
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
├── src/
│   ├── app/                        # Next.js 15 App Router
│   │   ├── dashboard/
│   │   │   └── page.tsx            # ✅ 대시보드 (토양정화 업무 최적화)
│   │   ├── orders/
│   │   │   └── page.tsx            # ✅ 수주 관리 (실제 엑셀 구조 반영)
│   │   ├── receivables/            # 📋 채권 관리 (다음 단계)
│   │   ├── employees/              # 📋 직원 관리 (미구현)
│   │   ├── globals.css             # ✅ 전역 스타일
│   │   ├── layout.tsx              # ✅ 서버 컴포넌트 루트 레이아웃
│   │   └── page.tsx                # ✅ 홈페이지 (대시보드 리디렉션)
│   ├── components/                 # 재사용 가능한 컴포넌트
│   │   ├── ui/                     # ✅ shadcn/ui 컴포넌트들 (17개)
│   │   ├── forms/                  # 📋 폼 컴포넌트 (미구현)
│   │   ├── layout/
│   │   │   ├── main-layout.tsx     # ✅ 클라이언트 레이아웃 컴포넌트
│   │   │   ├── sidebar.tsx         # ✅ 호버 반응형 사이드바
│   │   │   ├── header.tsx          # ✅ 헤더 (검색, 알림, 사용자메뉴)
│   │   │   └── breadcrumb.tsx      # ✅ 브레드크럼 네비게이션
│   │   └── common/                 # 📋 공통 컴포넌트 (미구현)
│   ├── lib/
│   │   ├── utils.ts                # ✅ cn 유틸리티 함수
│   │   ├── supabase/               # 📋 Supabase 클라이언트 (미구현)
│   │   └── utils/                  # 📋 추가 유틸리티 (미구현)
│   ├── types/                      # 📋 TypeScript 타입 정의 (미구현)
│   └── stores/                     # 📋 상태 관리 (미구현)
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

## 🔧 설치된 패키지들

### 주요 의존성
```json
{
  "next": "15.3.2",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5",
  "tailwindcss": "^4",
  "date-fns": "^3.6.0",
  "react-hook-form": "^7.56.4",
  "zod": "^3.25.28"
}
```

### shadcn/ui 컴포넌트 (17개 설치 완료)
- [x] button, input, label, card, form
- [x] table, dialog, dropdown-menu
- [x] select, textarea, badge, avatar
- [x] separator, tabs, calendar, popover
- [x] sheet

### 설정 파일
- [x] `.npmrc`: `legacy-peer-deps=true` (React 19 호환성)
- [x] `components.json`: shadcn/ui 설정
- [x] `tailwind.config.js`: CSS 변수 및 애니메이션 설정

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

## 🎯 다음 단계 우선순위

### 1단계: 채권 관리 시스템 구현 (진행중)
- [x] 채권 목록 페이지 (`/receivables`)
- [ ] 관수/민수별 미수금 현황 테이블 (통계 대시보드 일부 포함)
- [x] 연체 관리 및 알림 시스템 (연체 단계별 알림/관리 UI 구현)
- [ ] 수금 처리 및 입금 확인 기능 (입금 처리 UI 구현 완료, 백엔드 연동 필요)
- [ ] 채권 회수율 통계 대시보드 (기본 통계 UI 구현 완료)
- [ ] 수주 데이터와 연계 (계약금액 vs 입금액)
- [x] 연체 채권 상세 관리 (상세 정보, 리스크 평가, 회수 계획 UI 구현)

### 2단계: 폼 시스템 구현
- [ ] 수주 등록/수정 폼 (`OrderForm.tsx`)
- [ ] 토양정화 전문 필드 입력 UI
- [ ] 파일 업로드 기능 (계약서, 도면 등)
- [ ] 유효성 검사 (react-hook-form + zod)

### 3단계: Supabase 연동
- [ ] Supabase 프로젝트 생성
- [ ] 토양정화 업무 특화 데이터베이스 스키마 설계
- [ ] 수주/채권 테이블 생성
- [ ] 실시간 데이터 CRUD 연동
- [ ] 사용자 인증 시스템

### 4단계: 고급 기능
- [ ] 수주 상세 페이지
- [ ] 직원 관리 시스템 (담당자 배정)
- [ ] 프로젝트 일정 관리
- [ ] 리포트 생성 (월별 실적, 담당자별 성과)
- [ ] 권한 관리 시스템

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
- **현재**: React useState로 임시 데이터 관리
- **향후**: Supabase + React Query 또는 Zustand

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
```

## 🔄 개발자를 위한 시작 가이드

### 1. 프로젝트 설정
```bash
# 프로젝트 폴더로 이동
cd company-erp

# 의존성 설치 (.npmrc 파일로 자동 호환성 처리)
npm install

# 개발 서버 실행
npm run dev
```

### 2. 현재 기능 테스트
- 브라우저에서 `http://localhost:3000` 접속
- 사이드바 호버 기능 확인 (100ms 딜레이)
- 대시보드 → 수주 관리 네비게이션 테스트
- 검색 및 필터링 기능 테스트 (관수/민수, 상태별)

### 3. 다음 작업 시작점
**채권 관리 시스템 구현**을 위해서:
1. `src/app/receivables/page.tsx` 생성
2. `src/components/forms/receivable-form.tsx` 생성
3. 수주 데이터와 연계된 채권 데이터 구조 설계

## 📞 개발 진행 상황

### 🎉 성공적으로 완료된 작업들
1. **✅ 1단계: 긴급 수정** - Layout.tsx 서버 컴포넌트 최적화
2. **✅ C단계: 페이지 오류 수정** - Dashboard/Orders 안정화
3. **✅ C-2단계: MainLayout 통합** - 클라이언트/서버 컴포넌트 분리

### 🚀 현재 상태
- **서버 실행**: ✅ 정상 동작
- **레이아웃**: ✅ 호버 사이드바, 헤더, 브레드크럼 완벽 작동
- **페이지**: ✅ 대시보드, 수주관리 완전 구현
- **데이터**: ✅ 토양정화 업무 실제 데이터 반영
- **반응형**: ✅ 모바일/데스크톱 완벽 대응

### 🎯 다음 목표
**채권 관리 시스템 구현** - 토양정화 업무 특성을 반영한 미수금 관리

---

**최근 업데이트**: 2024-05-28  
**다음 마일스톤**: 채권 관리 시스템 구현  
**프로젝트 진행률**: 40% (레이아웃 + 수주관리 완료)