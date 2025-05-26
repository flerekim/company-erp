// src/types/receivables.ts
// 채권 관리 시스템 타입 정의

// 기본 타입들 (수주 관리에서 가져온 타입)
export type ClientType = 'government' | 'private'
export type OrderStatus = 'contracted' | 'in_progress' | 'completed' | 'cancelled'

// 채권 관련 새로운 타입들
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'
export type PaymentMethod = 'bank_transfer' | 'check' | 'cash' | 'card'
export type OverdueLevel = 'normal' | 'warning' | 'longterm' | 'bad'

// 결제 조건 타입 (토양정화 업계 특성)
export type PaymentTerms = 'immediate' | 'net_30' | 'net_60' | 'milestone' | 'completion'

// 채권 인터페이스
export interface Receivable {
  id: string
  receivable_number: string         // "REC-2024-001"
  order_id: string                  // 연결된 수주 ID
  
  // 기본 정보 (수주에서 상속)
  order_number: string              // "ORD-2024-001"
  project_name: string              // "24-A-OO부대 토양오염정화공사"
  company_name: string              // "제2218부대"
  client_type: ClientType           // 관수/민수 구분
  
  // 금액 정보
  contract_amount: number           // 계약 금액
  tax_amount: number               // 부가세
  total_amount: number             // 총 금액
  paid_amount: number              // 입금된 금액
  remaining_amount: number         // 미수금액
  
  // 결제 조건
  payment_terms: PaymentTerms      // 결제 조건
  due_date: string                 // 만료일
  payment_due_days: number         // 결제 예정일 (계약일로부터)
  
  // 상태 정보
  payment_status: PaymentStatus    // 결제 상태
  overdue_days: number            // 연체일수 (0이면 정상)
  overdue_level: OverdueLevel     // 연체 수준
  
  // 관리 정보
  primary_manager: string          // 담당자
  last_contact_date?: string       // 마지막 연락일
  next_contact_date?: string       // 다음 연락 예정일
  
  // 메타 정보
  created_at: string
  updated_at: string
  notes?: string                   // 특이사항
}

// 입금 기록 인터페이스
export interface Payment {
  id: string
  receivable_id: string           // 채권 ID
  payment_number: string          // "PAY-2024-001"
  
  // 입금 정보
  payment_amount: number          // 입금 금액
  payment_date: string           // 입금일
  payment_method: PaymentMethod  // 입금 방법
  
  // 계좌 정보
  bank_name?: string             // 은행명
  account_number?: string        // 계좌번호
  
  // 관리 정보
  confirmed_by: string           // 확인자
  confirmed_at: string          // 확인일시
  
  created_at: string
  updated_at: string
  notes?: string                // 입금 관련 메모
}

// 연체 알림 인터페이스
export interface OverdueAlert {
  id: string
  receivable_id: string
  alert_type: 'email' | 'sms' | 'call' | 'visit'
  alert_date: string
  due_amount: number
  overdue_days: number
  contact_person: string
  result?: string               // 연락 결과
  next_action?: string         // 다음 조치 계획
  created_at: string
}

// 채권 통계 인터페이스
export interface ReceivableStats {
  total_receivables: number      // 총 채권 건수
  total_amount: number          // 총 채권 금액
  paid_amount: number           // 수금 완료 금액
  unpaid_amount: number         // 미수금액
  overdue_amount: number        // 연체금액
  collection_rate: number       // 수금률 (%)
  
  // 민관별 통계
  by_client_type: {
    government: {
      count: number
      amount: number
      overdue_amount: number
    }
    private: {
      count: number  
      amount: number
      overdue_amount: number
    }
  }
  
  // 연체 수준별 통계 (실무 기준)
  by_overdue_level: {
    normal: number      // 정상 (0-60일)
    warning: number     // 주의 (61-90일)
    longterm: number    // 장기 (91-180일)
    bad: number         // 부실 (181일 이상)
  }
  
  // 월별 수금 현황
  monthly_collection: {
    month: string
    target: number      // 목표 수금액
    actual: number      // 실제 수금액
    rate: number        // 달성률
  }[]
}

// 라벨 및 색상 상수
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: '미수',
  partial: '부분수금',
  paid: '완료',
  overdue: '연체'
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'bg-gray-100 text-gray-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
}

export const OVERDUE_LEVEL_LABELS: Record<OverdueLevel, string> = {
  normal: '정상',
  warning: '주의',
  longterm: '장기',
  bad: '부실'
}

export const OVERDUE_LEVEL_COLORS: Record<OverdueLevel, string> = {
  normal: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  longterm: 'bg-orange-100 text-orange-800',
  bad: 'bg-red-100 text-red-800'
}

export const PAYMENT_TERMS_LABELS: Record<PaymentTerms, string> = {
  immediate: '즉시',
  net_30: '30일 내',
  net_60: '60일 내', 
  milestone: '단계별',
  completion: '완료 후'
}

// 유틸리티 함수들 (실무 기준 연체 수준)
export const calculateOverdueLevel = (overdueDays: number): OverdueLevel => {
  if (overdueDays <= 60) return 'normal'    // 정상 (0-60일)
  if (overdueDays <= 90) return 'warning'   // 주의 (61-90일)
  if (overdueDays <= 180) return 'longterm' // 장기 (91-180일)
  return 'bad'                              // 부실 (181일 이상)
}

export const calculateOverdueDays = (dueDate: string): number => {
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = today.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

export const calculatePaymentStatus = (
  totalAmount: number,
  paidAmount: number,
  overdueDays: number
): PaymentStatus => {
  if (paidAmount >= totalAmount) return 'paid'
  if (overdueDays > 0) return 'overdue'
  if (paidAmount > 0) return 'partial'
  return 'unpaid'
}