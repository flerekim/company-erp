import { supabase } from '../supabase/supabase'
import { Order, OrderFilters } from '@/types/order'

export async function getOrders(filters?: OrderFilters) {
  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.searchTerm) {
    query = query.or(
      `project_name.ilike.%${filters.searchTerm}%,company_name.ilike.%${filters.searchTerm}%,order_number.ilike.%${filters.searchTerm}%`
    )
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.clientType) {
    query = query.eq('client_type', filters.clientType)
  }

  if (filters?.orderType) {
    query = query.eq('order_type', filters.orderType)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`수주 목록 조회 실패: ${error.message}`)
  }

  return data as Order[]
}

export async function getOrderById(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`수주 상세 조회 실패: ${error.message}`)
  }

  return data as Order
}

export async function createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('orders')
    .insert([order])
    .select()
    .single()

  if (error) {
    throw new Error(`수주 등록 실패: ${error.message}`)
  }

  return data as Order
}

export async function updateOrder(id: string, order: Partial<Order>) {
  const { data, error } = await supabase
    .from('orders')
    .update(order)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`수주 수정 실패: ${error.message}`)
  }

  return data as Order
}

export async function deleteOrder(id: string) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`수주 삭제 실패: ${error.message}`)
  }
}

type OrderStats = {
  status: Order['status']
  client_type: Order['client_type']
  contract_amount: Order['contract_amount']
}

export async function getOrderStats() {
  const { data, error } = await supabase
    .from('orders')
    .select('status, client_type, contract_amount')

  if (error) {
    throw new Error(`수주 통계 조회 실패: ${error.message}`)
  }

  const orders = data as OrderStats[]

  const stats = {
    total: orders.length,
    by_status: {
      contracted: orders.filter(o => o.status === 'contracted').length,
      in_progress: orders.filter(o => o.status === 'in_progress').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    },
    by_client_type: {
      government: orders.filter(o => o.client_type === 'government').length,
      private: orders.filter(o => o.client_type === 'private').length,
    },
    total_amount: orders.reduce((sum, order) => sum + order.contract_amount, 0)
  }

  return stats
} 