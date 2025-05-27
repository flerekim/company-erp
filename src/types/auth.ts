// 사용자 인증 및 프로필 관련 타입 정의

export interface UserProfile {
    id: string
    auth_user_id: string | null
    employee_id: string
    name: string
    email: string
    phone?: string
    department?: string
    position?: string
    role: 'admin' | 'manager' | 'user'
    is_active: boolean
    created_at: string
    updated_at: string
    created_by?: string
    updated_by?: string
  }
  
  export interface CreateUserProfile {
    employee_id: string
    name: string
    email: string
    phone?: string
    department?: string
    position?: string
    role?: 'admin' | 'manager' | 'user'
    is_active?: boolean
  }
  
  export interface UpdateUserProfile {
    name?: string
    phone?: string
    department?: string
    position?: string
    role?: 'admin' | 'manager' | 'user'
    is_active?: boolean
  }
  
  export interface AuthUser {
    id: string
    email: string
    profile?: UserProfile
  }
  
  export type UserRole = 'admin' | 'manager' | 'user'