// src/lib/database.ts
// 데이터베이스 접근을 위한 유틸리티 함수들

import { supabase } from './client'
import { Receivable, PaymentFormData } from '@/types/receivables'

// 수주 관리 관련 함수들
export const orderService = {
  // 모든 수주 조회
  async getAll() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 수주 ID로 조회
  async getById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 수주 생성
  async create(orderData: any) {
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 수주 수정
  async update(id: string, orderData: any) {
    const { data, error } = await supabase
      .from('orders')
      .update(orderData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 수주 삭제
  async delete(id: string) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async getLastOrder() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('order_number', { ascending: false })
      .limit(1)
      .single()
    if (error && error.code !== 'PGRST116') throw error // PGRST116는 결과가 없을 때 발생
    return { data }
  },

  // 파일 업로드
  async uploadFile(filePath: string, file: File) {
    const { data, error } = await supabase.storage
      .from('order-attachments') // Supabase Storage 버킷 이름 (규칙에 맞게 수정)
      .upload(filePath, file)

    if (error) {
      throw error;
    }

    // 업로드된 파일의 공개 URL 가져오기 (필요하다면)
    const { data: publicUrlData } = supabase.storage
      .from('order-attachments')
      .getPublicUrl(data.path)
      
    return { data: { ...data, url: publicUrlData.publicUrl } }; // path와 publicUrl 포함하여 반환
  }
}

// 채권 관리 관련 함수들
export const receivableService = {
  // 모든 채권 조회
  async getAll() {
    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Receivable[]
  },

  // 채권 ID로 조회
  async getById(id: string) {
    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Receivable
  },

  // 연체 채권만 조회
  async getOverdue() {
    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .eq('payment_status', 'overdue')
      .order('overdue_days', { ascending: false })
    
    if (error) throw error
    return data as Receivable[]
  },

  // 채권 통계 조회
  async getStats() {
    const { data, error } = await supabase
      .from('receivables')
      .select('*')
    
    if (error) throw error
    
    const receivables = data as Receivable[]
    
    return {
      total_amount: receivables.reduce((sum, r) => sum + r.total_amount, 0),
      paid_amount: receivables.reduce((sum, r) => sum + r.paid_amount, 0),
      remaining_amount: receivables.reduce((sum, r) => sum + r.remaining_amount, 0),
      overdue_amount: receivables
        .filter(r => r.payment_status === 'overdue')
        .reduce((sum, r) => sum + r.remaining_amount, 0),
      collection_rate: 0,
      by_client_type: {
        government: {
          count: receivables.filter(r => r.client_type === 'government').length,
          amount: receivables
            .filter(r => r.client_type === 'government')
            .reduce((sum, r) => sum + r.remaining_amount, 0)
        },
        private: {
          count: receivables.filter(r => r.client_type === 'private').length,
          amount: receivables
            .filter(r => r.client_type === 'private')
            .reduce((sum, r) => sum + r.remaining_amount, 0)
        }
      },
      by_overdue_level: {
        normal: receivables.filter(r => r.overdue_level === 'normal').length,
        warning: receivables.filter(r => r.overdue_level === 'warning').length,
        longterm: receivables.filter(r => r.overdue_level === 'longterm').length,
        bad: receivables.filter(r => r.overdue_level === 'bad').length
      }
    }
  },

  // 채권 생성
  async create(receivableData: any) {
    const { data, error } = await supabase
      .from('receivables')
      .insert(receivableData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 채권 수정
  async update(id: string, receivableData: any) {
    const { data, error } = await supabase
      .from('receivables')
      .update(receivableData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// 입금 관리 관련 함수들
export const paymentService = {
  // 특정 채권의 모든 입금 내역 조회
  async getByReceivableId(receivableId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('receivable_id', receivableId)
      .order('payment_date', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 입금 처리
  async create(paymentData: PaymentFormData & { receivable_id: string }) {
    // 입금번호 자동 생성
    const { data: lastPayment } = await supabase
      .from('payments')
      .select('payment_number')
      .order('created_at', { ascending: false })
      .limit(1)
    
    let nextNumber = 1
    if (lastPayment && lastPayment.length > 0) {
      const lastNumber = parseInt(lastPayment[0].payment_number.split('-')[2])
      nextNumber = lastNumber + 1
    }
    
    const payment_number = `PAY-${new Date().getFullYear()}-${nextNumber.toString().padStart(3, '0')}`
    
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        payment_number,
        created_by: '시스템' // 나중에 실제 사용자 정보로 교체
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 모든 입금 내역 조회
  async getAll() {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        receivables (
          receivable_number,
          company_name,
          project_name
        )
      `)
      .order('payment_date', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// 연체 이력 관리 관련 함수들
export const overdueHistoryService = {
  // 특정 채권의 연체 이력 조회
  async getByReceivableId(receivableId: string) {
    const { data, error } = await supabase
      .from('overdue_history')
      .select('*')
      .eq('receivable_id', receivableId)
      .order('action_date', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 새로운 연체 조치 등록
  async create(historyData: any) {
    const { data, error } = await supabase
      .from('overdue_history')
      .insert({
        ...historyData,
        created_by: '시스템' // 나중에 실제 사용자 정보로 교체
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 모든 연체 이력 조회
  async getAll() {
    const { data, error } = await supabase
      .from('overdue_history')
      .select(`
        *,
        receivables (
          receivable_number,
          company_name,
          project_name
        )
      `)
      .order('action_date', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// 대시보드 통계 조회
export const dashboardService = {
  async getStats() {
    try {
      // 수주 통계
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
      
      if (ordersError) throw ordersError

      // 채권 통계
      const receivableStats = await receivableService.getStats()

      // 최근 수주 (상위 3건)
      const { data: recentOrders, error: recentError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)
      
      if (recentError) throw recentError

      // 연체 채권
      const overdueReceivables = await receivableService.getOverdue()

      return {
        orders: {
          total: orders?.length || 0,
          in_progress: orders?.filter(o => o.status === 'in_progress').length || 0,
          completed: orders?.filter(o => o.status === 'completed').length || 0,
          total_amount: orders?.reduce((sum, o) => sum + o.contract_amount, 0) || 0
        },
        receivables: receivableStats,
        recent_orders: recentOrders || [],
        overdue_receivables: overdueReceivables || []
      }
    } catch (error) {
      console.error('Dashboard stats error:', error)
      throw error
    }
  }
}

// 실시간 데이터 구독 함수들
export const subscriptions = {
  // 채권 데이터 변경 구독
  subscribeToReceivables(callback: (payload: any) => void) {
    return supabase
      .channel('receivables-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'receivables' }, 
        callback
      )
      .subscribe()
  },

  // 입금 데이터 변경 구독
  subscribeToPayments(callback: (payload: any) => void) {
    return supabase
      .channel('payments-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' }, 
        callback
      )
      .subscribe()
  },

  // 수주 데이터 변경 구독
  subscribeToOrders(callback: (payload: any) => void) {
    return supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        callback
      )
      .subscribe()
  }
}