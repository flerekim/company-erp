export type ClientType = 'government' | 'private'
export type OrderStatus = 'contracted' | 'in_progress' | 'completed' | 'cancelled'
export type OrderType = 'new' | 'change1' | 'change2' | 'change3'
export type TransportType = 'onsite' | 'transport'

export interface Order {
  id: string
  order_number: string
  project_name: string
  client_type: ClientType
  company_name: string
  contract_date?: string
  contract_amount: number
  order_type: OrderType
  transport_type?: TransportType
  remediation_method?: string
  contamination_info?: string
  verification_company?: string
  status: OrderStatus
  progress_percentage: number
  primary_manager?: string
  secondary_manager?: string
  created_at?: string
  updated_at?: string
}

export interface OrderFilters {
  searchTerm?: string
  status?: OrderStatus
  clientType?: ClientType
  orderType?: OrderType
} 