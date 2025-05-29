// src/types/orders.ts
// 수주 관리 시스템 전용 타입 정의

export type ClientType = 'government' | 'private'
export type OrderType = 'new' | 'change1' | 'change2' | 'change3' | 'change4' | 'change5'
export type TransportType = 'onsite' | 'transport'
export type OrderStatus = 'contracted' | 'in_progress' | 'completed' | 'bidding'

// 수주 메인 인터페이스
export interface Order {
  id: string
  order_number: string           // 수주번호: "ORD-2024-001"
  project_name: string           // 프로젝트명
  company_name: string           // 고객사명
  client_type: ClientType        // 관수/민수 구분
  
  // 계약 정보
  contract_date: string          // 계약일
  contract_amount: number        // 계약금액
  order_type: OrderType          // 수주유형 (신규/변경)
  due_date: string               // 마감일 (추가)
  
  // 토양정화 전문 정보
  transport_type: TransportType  // 부지내/반출 구분
  remediation_method: string     // 정화방법
  contamination_info: string     // 오염정보
  verification_company: string   // 검증업체
  
  // 프로젝트 상태
  status: OrderStatus            // 프로젝트 상태
  progress_percentage: number    // 진행률 (0-100)
  
  // 담당자 정보
  primary_manager: string        // 주담당자
  secondary_manager?: string     // 부담당자
  
  // 메타데이터
  created_at: string            // 생성일
  updated_at: string            // 수정일
  attachments?: OrderFile[]      // 첨부 파일 목록 (추가, 선택 사항)
}

// 수주 폼 데이터 인터페이스
export interface OrderFormData {
  project_name: string
  company_name: string
  client_type: ClientType
  contract_date: string
  contract_amount: number
  order_type: OrderType
  transport_type: TransportType
  remediation_method: string
  contamination_info: ContaminationItem[]
  verification_company: string
  status: OrderStatus
  progress_percentage: number
  primary_manager: string
  secondary_manager?: string
}

// 파일 업로드 인터페이스
export interface OrderFile {
  id: string
  order_id: string
  file_name: string
  file_type: 'contract' | 'drawing' | 'report' | 'certificate' | 'other'
  file_size: number
  file_url: string
  uploaded_at: string
  uploaded_by: string
}

// 토양정화 전문 옵션들
export const REMEDIATION_METHODS = [
  '토양경작법',
  '토양세척법', 
  '열탈착법',
  '고형화/안정화',
  '생물학적 정화법',
  '화학적 산화법',
  '전기동역학적 정화법',
  '복합정화법'
] as const

export const CONTAMINATION_TYPES = [
  '카드뮴',
  '구리',
  '비소',
  '수은',
  '납',
  '6가크롬',
  '아연',
  '니켈',
  '불소',
  '유기인화합물',
  '폴리클로리네이티드비페닐',
  '시안',
  '페놀',
  '벤젠',
  '톨루엔',
  '에틸벤젠',
  '크실렌',
  'TPH',
  'TCE',
  'PCE',
  '벤조(a)피렌',
  '1,2-디클로로에탄',
  '다이옥신'
] as const

export const VERIFICATION_COMPANIES = [
  '울산과학대학교 산학협력단',
  '한국환경공단',
  '환경관리공단',
  '한국토양환경학회',
  '국립환경과학원',
  '한국환경정책평가연구원',
  '서울대학교 환경대학원',
  '기타'
] as const

export const MANAGERS = [
  '이대룡',
  '박찬수',
  '최진우',
  '김판근',
  '백승호',
  '김철수',
  '이영희',
  '박지성'
] as const

// 수주번호 자동 생성 함수용 인터페이스
export interface OrderNumberGeneration {
  year: number
  sequence: number
  prefix: string
}

// 폼 유효성 검사 에러 타입
export interface OrderFormErrors {
  project_name?: string
  company_name?: string
  client_type?: string
  contract_date?: string
  contract_amount?: string
  remediation_method?: string
  contamination_info?: string
  verification_company?: string
  primary_manager?: string
}

// 오염 항목 타입
export interface ContaminationItem {
  type: string; // 오염물질명
  value: number; // 농도 (mg/kg)
}

// 파일 개수 및 요약 보기용 추가 필드를 포함하는 Order 확장 인터페이스
export interface OrderWithFileCount extends Omit<Order, 'order_type'> {
  fileCount: number;
  change_orders?: OrderWithFileCount[]; 
  all_orders?: OrderWithFileCount[];
  order_type: OrderType | 'new+change'; 
}