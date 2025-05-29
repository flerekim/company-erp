// src/lib/supabase.ts
// Supabase 클라이언트 설정

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL과 Anon Key가 설정되지 않았습니다. .env.local 파일을 확인하세요.')
}

// 브라우저 환경에서만 sessionStorage 접근
const getSessionStorage = () => {
  if (typeof window !== 'undefined') {
    return {
      getItem: (key: string) => {
        try {
          const value = sessionStorage.getItem(key)
          return value ? JSON.parse(value) : null
        } catch (error) {
          console.error('Error reading from sessionStorage:', error)
          return null
        }
      },
      setItem: (key: string, value: any) => {
        try {
          sessionStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
          console.error('Error writing to sessionStorage:', error)
        }
      },
      removeItem: (key: string) => {
        try {
          sessionStorage.removeItem(key)
        } catch (error) {
          console.error('Error removing from sessionStorage:', error)
        }
      }
    }
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'inkwang-erp-auth',
    storage: getSessionStorage(),
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// 타입 안전성을 위한 Database 타입 정의 (나중에 자동 생성 예정)
export type Database = {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          order_number: string
          project_name: string
          company_name: string
          client_type: 'government' | 'private'
          contract_date: string
          contract_amount: number
          order_type: 'new' | 'change1' | 'change2' | 'change3'
          transport_type: 'onsite' | 'transport'
          remediation_method: string
          contamination_info: string
          verification_company: string
          status: 'contracted' | 'in_progress' | 'completed' | 'bidding'
          progress_percentage: number
          primary_manager: string
          secondary_manager: string | null
          created_at: string
          updated_at: string
          attachments?: any[] | null // JSONB 배열 타입
        }
        Insert: {
          id?: string
          order_number: string
          project_name: string
          company_name: string
          client_type: 'government' | 'private'
          contract_date: string
          contract_amount: number
          order_type?: 'new' | 'change1' | 'change2' | 'change3'
          transport_type: 'onsite' | 'transport'
          remediation_method: string
          contamination_info: string
          verification_company: string
          status?: 'contracted' | 'in_progress' | 'completed' | 'bidding'
          progress_percentage?: number
          primary_manager: string
          secondary_manager?: string | null
          created_at?: string
          updated_at?: string
          attachments?: any[] | null // JSONB 배열 타입
        }
        Update: {
          id?: string
          order_number?: string
          project_name?: string
          company_name?: string
          client_type?: 'government' | 'private'
          contract_date?: string
          contract_amount?: number
          order_type?: 'new' | 'change1' | 'change2' | 'change3'
          transport_type?: 'onsite' | 'transport'
          remediation_method?: string
          contamination_info?: string
          verification_company?: string
          status?: 'contracted' | 'in_progress' | 'completed' | 'bidding'
          progress_percentage?: number
          primary_manager?: string
          secondary_manager?: string | null
          created_at?: string
          updated_at?: string
          attachments?: any[] | null // JSONB 배열 타입
        }
      }
      receivables: {
        Row: {
          id: string
          receivable_number: string
          order_id: string
          order_number: string
          project_name: string
          company_name: string
          client_type: 'government' | 'private'
          contract_amount: number
          tax_amount: number
          total_amount: number
          paid_amount: number
          remaining_amount: number
          payment_terms: 'net_30' | 'net_60' | 'net_90' | 'immediate'
          due_date: string
          payment_due_days: number
          payment_status: 'unpaid' | 'partial' | 'paid' | 'overdue'
          overdue_days: number
          overdue_level: 'normal' | 'warning' | 'longterm' | 'bad'
          primary_manager: string
          secondary_manager: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          receivable_number: string
          order_id: string
          order_number: string
          project_name: string
          company_name: string
          client_type: 'government' | 'private'
          contract_amount: number
          tax_amount: number
          total_amount: number
          paid_amount?: number
          remaining_amount: number
          payment_terms: 'net_30' | 'net_60' | 'net_90' | 'immediate'
          due_date: string
          payment_due_days: number
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'overdue'
          overdue_days?: number
          overdue_level?: 'normal' | 'warning' | 'longterm' | 'bad'
          primary_manager: string
          secondary_manager?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          receivable_number?: string
          order_id?: string
          order_number?: string
          project_name?: string
          company_name?: string
          client_type?: 'government' | 'private'
          contract_amount?: number
          tax_amount?: number
          total_amount?: number
          paid_amount?: number
          remaining_amount?: number
          payment_terms?: 'net_30' | 'net_60' | 'net_90' | 'immediate'
          due_date?: string
          payment_due_days?: number
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'overdue'
          overdue_days?: number
          overdue_level?: 'normal' | 'warning' | 'longterm' | 'bad'
          primary_manager?: string
          secondary_manager?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          receivable_id: string
          payment_number: string
          payment_date: string
          payment_amount: number
          payment_method: 'bank_transfer' | 'check' | 'cash' | 'other'
          bank_name: string | null
          account_number: string | null
          depositor_name: string | null
          memo: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          receivable_id: string
          payment_number: string
          payment_date: string
          payment_amount: number
          payment_method: 'bank_transfer' | 'check' | 'cash' | 'other'
          bank_name?: string | null
          account_number?: string | null
          depositor_name?: string | null
          memo?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          receivable_id?: string
          payment_number?: string
          payment_date?: string
          payment_amount?: number
          payment_method?: 'bank_transfer' | 'check' | 'cash' | 'other'
          bank_name?: string | null
          account_number?: string | null
          depositor_name?: string | null
          memo?: string | null
          created_by?: string
          created_at?: string
        }
      }
      overdue_history: {
        Row: {
          id: string
          receivable_id: string
          action_type: 'call' | 'email' | 'visit' | 'letter' | 'legal'
          action_date: string
          action_description: string
          result: 'no_response' | 'promised' | 'partial_payment' | 'full_payment' | 'dispute'
          next_action_date: string | null
          memo: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          receivable_id: string
          action_type: 'call' | 'email' | 'visit' | 'letter' | 'legal'
          action_date: string
          action_description: string
          result: 'no_response' | 'promised' | 'partial_payment' | 'full_payment' | 'dispute'
          next_action_date?: string | null
          memo?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          receivable_id?: string
          action_type?: 'call' | 'email' | 'visit' | 'letter' | 'legal'
          action_date?: string
          action_description?: string
          result?: 'no_response' | 'promised' | 'partial_payment' | 'full_payment' | 'dispute'
          next_action_date?: string | null
          memo?: string | null
          created_by?: string
          created_at?: string
        }
      }
    }
  }
}