// src/types/database.ts
// 데이터베이스 스키마에 대응하는 TypeScript 타입 정의

// ================================
// 공통 타입
// ================================
export type BaseEntity = {
    id: string
    created_at: string
    updated_at: string
  }
  
  // ================================
  // 고객사 관리
  // ================================
  export type Company = BaseEntity & {
    company_name: string
    business_number?: string
    company_type: 'general' | 'corporation' | 'individual'
    industry?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    status: 'active' | 'inactive' | 'blacklist'
    credit_rating: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D'
    notes?: string
  }
  
  export type Contact = BaseEntity & {
    company_id: string
    name: string
    position?: string
    department?: string
    phone?: string
    mobile?: string
    email?: string
    is_primary: boolean
    is_decision_maker: boolean
    notes?: string
    // Relations
    company?: Company
  }
  
  // ================================
  // 직원 관리
  // ================================
  export type Employee = BaseEntity & {
    employee_number: string
    name: string
    email?: string
    phone?: string
    department?: string
    position?: string
    hire_date?: string
    status: 'active' | 'inactive' | 'resigned'
    role: 'admin' | 'manager' | 'employee' | 'sales'
  }
  
  // ================================
  // 수주 관리
  // ================================
  export type OrderStatus = 'estimate' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'hold'
  export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent'
  export type ContractType = 'fixed' | 'hourly' | 'milestone'
  
  export type Order = BaseEntity & {
    order_number: string
    company_id: string
    contact_id?: string
    sales_manager_id?: string
    project_manager_id?: string
    
    // 기본 정보
    project_name: string
    project_description?: string
    contract_number?: string
    
    // 금액 정보
    total_amount: number
    tax_amount: number
    net_amount: number
    
    // 상태 관리
    status: OrderStatus
    priority: OrderPriority
    
    // 일정 관리
    estimate_date?: string
    order_date?: string
    start_date?: string
    expected_end_date?: string
    actual_end_date?: string
    
    // 진행률
    progress_percentage: number
    
    // 추가 정보
    contract_type: ContractType
    payment_terms?: string
    warranty_period?: number
    notes?: string
    
    // Relations
    company?: Company
    contact?: Contact
    sales_manager?: Employee
    project_manager?: Employee
    order_items?: OrderItem[]
    invoices?: Invoice[]
    receivables?: Receivable[]
  }
  
  export type OrderItem = BaseEntity & {
    order_id: string
    item_name: string
    description?: string
    quantity: number
    unit_price: number
    total_price: number
    item_order: number
  }
  
  // ================================
  // 세금계산서/청구서
  // ================================
  export type InvoiceType = 'tax' | 'simple' | 'receipt'
  export type InvoiceStatus = 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  
  export type Invoice = BaseEntity & {
    invoice_number: string
    order_id: string
    company_id: string
    
    // 금액 정보
    amount: number
    tax_amount: number
    total_amount: number
    
    // 세금계산서 정보
    invoice_type: InvoiceType
    issue_date: string
    supply_date?: string
    
    // 상태
    status: InvoiceStatus
    notes?: string
    
    // Relations
    order?: Order
    company?: Company
    receivables?: Receivable[]
  }
  
  // ================================
  // 채권 관리
  // ================================
  export type ReceivableStatus = 'pending' | 'partial_paid' | 'paid' | 'overdue' | 'bad_debt' | 'cancelled'
  export type CollectionStatus = 'none' | 'contacted' | 'promised' | 'legal_action'
  
  export type Receivable = BaseEntity & {
    receivable_number: string
    invoice_id: string
    order_id: string
    company_id: string
    
    // 금액 정보
    original_amount: number
    paid_amount: number
    remaining_amount: number
    
    // 일정 관리
    due_date: string
    overdue_days: number
    
    // 상태 관리
    status: ReceivableStatus
    collection_status: CollectionStatus
    
    // 연체 관리
    first_overdue_date?: string
    last_contact_date?: string
    next_contact_date?: string
    collection_notes?: string
    notes?: string
    
    // Relations
    invoice?: Invoice
    order?: Order
    company?: Company
    payments?: Payment[]
  }
  
  // ================================
  // 입금/결제 관리
  // ================================
  export type PaymentMethod = 'bank_transfer' | 'cash' | 'check' | 'card' | 'other'
  export type PaymentStatus = 'pending' | 'confirmed' | 'cancelled'
  
  export type Payment = BaseEntity & {
    payment_number: string
    receivable_id: string
    invoice_id: string
    company_id: string
    
    // 금액
    amount: number
    
    // 결제 정보
    payment_method: PaymentMethod
    payment_date: string
    bank_name?: string
    account_number?: string
    depositor_name?: string
    
    // 상태
    status: PaymentStatus
    notes?: string
    
    // Relations
    receivable?: Receivable
    invoice?: Invoice
    company?: Company
  }
  
  // ================================
  // 첨부파일
  // ================================
  export type AttachmentTable = 'orders' | 'invoices' | 'receivables' | 'payments'
  
  export type Attachment = BaseEntity & {
    related_table: AttachmentTable
    related_id: string
    file_name: string
    file_path: string
    file_size?: number
    file_type?: string
    uploaded_by?: string
    uploaded_at: string
    // Relations
    uploader?: Employee
  }
  
  // ================================
  // API 응답 타입들
  // ================================
  export type PaginationMeta = {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  
  export type ApiResponse<T> = {
    data: T
    meta?: PaginationMeta
    message?: string
  }
  
  export type ApiError = {
    error: string
    message: string
    details?: any
  }
  
  // ================================
  // 필터링 및 정렬 타입들
  // ================================
  export type OrderFilters = {
    status?: OrderStatus[]
    company_id?: string
    sales_manager_id?: string
    start_date?: string
    end_date?: string
    search?: string
  }
  
  export type ReceivableFilters = {
    status?: ReceivableStatus[]
    company_id?: string
    overdue_only?: boolean
    due_date_from?: string
    due_date_to?: string
    search?: string
  }
  
  export type SortDirection = 'asc' | 'desc'
  
  export type OrderSort = {
    field: keyof Order
    direction: SortDirection
  }
  
  export type ReceivableSort = {
    field: keyof Receivable
    direction: SortDirection
  }
  
  // ================================
  // 대시보드 통계 타입들
  // ================================
  export type DashboardStats = {
    orders: {
      total: number
      by_status: Record<OrderStatus, number>
      total_amount: number
      this_month_amount: number
    }
    receivables: {
      total_outstanding: number
      overdue_amount: number
      overdue_count: number
      collection_rate: number
      aging: {
        current: number      // 0-30일
        days_30: number      // 31-60일
        days_60: number      // 61-90일
        days_90_plus: number // 90일 이상
      }
    }
    monthly_trends: {
      month: string
      orders_amount: number
      collected_amount: number
    }[]
  }
  
  // ================================
  // 폼 데이터 타입들
  // ================================
  export type CreateOrderRequest = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_number'> & {
    order_items?: Omit<OrderItem, 'id' | 'order_id' | 'created_at' | 'updated_at'>[]
  }
  
  export type UpdateOrderRequest = Partial<CreateOrderRequest>
  
  export type CreateReceivableRequest = Omit<Receivable, 'id' | 'created_at' | 'updated_at' | 'receivable_number' | 'paid_amount' | 'remaining_amount' | 'overdue_days'>
  
  export type CreatePaymentRequest = Omit<Payment, 'id' | 'created_at' | 'updated_at' | 'payment_number'>
  
  // ================================
  // 유틸리티 타입들
  // ================================
  export type WithRelations<T, R extends keyof T> = T & {
    [K in R]: NonNullable<T[K]>
  }
  
  // 예시: 고객사 정보가 포함된 수주
  export type OrderWithCompany = WithRelations<Order, 'company'>
  
  // 예시: 모든 관련 정보가 포함된 채권
  export type ReceivableWithDetails = WithRelations<Receivable, 'company' | 'order' | 'invoice' | 'payments'>