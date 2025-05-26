// src/types/receivables.ts
// 채권 관리 시스템 전용 타입 정의

export type ClientType = 'government' | 'private'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'
export type PaymentTerms = 'net_30' | 'net_60' | 'net_90' | 'immediate'
export type OverdueLevel = 'normal' | 'warning' | 'longterm' | 'bad'

// 채권 메인 인터페이스
export interface Receivable {
  id: string
  receivable_number: string           // 채권번호: "REC-2024-001"
  order_id: string                   // 연결된 수주 ID
  order_number: string               // 수주번호: "ORD-2024-001"
  project_name: string               // 프로젝트명
  company_name: string               // 고객사명
  client_type: ClientType            // 관수/민수 구분
  
  // 금액 정보
  contract_amount: number            // 계약금액 (부가세 제외)
  tax_amount: number                 // 부가세
  total_amount: number               // 총 금액 (부가세 포함)
  paid_amount: number                // 입금된 금액
  remaining_amount: number           // 미수금액
  
  // 결제 조건
  payment_terms: PaymentTerms        // 결제 조건
  due_date: string                   // 만료일
  payment_due_days: number           // 결제 기한 (일수)
  
  // 연체 정보
  payment_status: PaymentStatus      // 결제 상태
  overdue_days: number               // 연체 일수
  overdue_level: OverdueLevel        // 연체 단계
  
  // 담당자 및 메타
  primary_manager: string            // 주담당자
  secondary_manager?: string         // 부담당자
  created_at: string                 // 생성일
  updated_at: string                 // 수정일
}

// 입금 내역 인터페이스
export interface Payment {
  id: string
  receivable_id: string              // 연결된 채권 ID
  payment_number: string             // 입금번호: "PAY-2024-001"
  payment_date: string               // 입금일
  payment_amount: number             // 입금액
  payment_method: 'bank_transfer' | 'check' | 'cash' | 'other'
  bank_name?: string                 // 입금 은행
  account_number?: string            // 계좌번호
  depositor_name?: string            // 입금자명
  memo?: string                      // 메모
  created_by: string                 // 등록자
  created_at: string                 // 등록일
}

// 연체 이력 인터페이스
export interface OverdueHistory {
  id: string
  receivable_id: string              // 연결된 채권 ID
  action_type: 'call' | 'email' | 'visit' | 'letter' | 'legal'
  action_date: string                // 조치일
  action_description: string         // 조치 내용
  result: 'no_response' | 'promised' | 'partial_payment' | 'full_payment' | 'dispute'
  next_action_date?: string          // 다음 조치 예정일
  memo?: string                      // 메모
  created_by: string                 // 등록자
  created_at: string                 // 등록일
}

// 채권 통계 인터페이스
export interface ReceivableStats {
  total_amount: number               // 총 채권액
  paid_amount: number                // 수금액
  remaining_amount: number           // 미수금액
  overdue_amount: number             // 연체금액
  collection_rate: number            // 수금률 (%)
  
  by_client_type: {
    government: {
      count: number
      amount: number
    }
    private: {
      count: number
      amount: number
    }
  }
  
  by_overdue_level: {
    normal: number
    warning: number
    longterm: number
    bad: number
  }
}

// 입금 폼 데이터 인터페이스
export interface PaymentFormData {
  payment_date: string
  payment_amount: number
  payment_method: 'bank_transfer' | 'check' | 'cash' | 'other'
  bank_name?: string
  account_number?: string
  depositor_name?: string
  memo?: string
}

// 연체 관리 액션 인터페이스
export interface OverdueAction {
  receivable_id: string
  action_type: 'call' | 'email' | 'visit' | 'letter' | 'legal'
  action_description: string
  next_action_date?: string
  memo?: string
}