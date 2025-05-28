// 인증 컨텍스트 - 전역 사용자 상태 관리
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserProfile } from '@/types/auth'
import { initializeStorageBuckets } from '@/lib/supabase/storage-init'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 사용자 프로필 조회
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      if (error) {
        console.error('프로필 조회 실패:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('프로필 조회 중 오류:', error)
      return null
    }
  }

  // 프로필 새로고침
  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  // 로그아웃
  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  useEffect(() => {
    // 초기 세션 확인 - 타임아웃 제거하고 안정적인 세션 복원
    const getInitialSession = async () => {
      try {
        console.log('🔄 세션 복원 시작...')
        
        // 세션 복원 시도 (타임아웃 없이)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('세션 복원 오류:', error)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('✅ 세션 복원 성공:', session.user.email)
          setUser(session.user)
          
          // 프로필 데이터 조회
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
          
          // Storage 초기화를 백그라운드에서 시도
          setTimeout(async () => {
            try {
              console.log('Storage 초기화 시도...')
              const success = await initializeStorageBuckets()
              if (success) {
                console.log('✅ Storage buckets 초기화 완료')
              } else {
                console.log('⚠️ Storage buckets 초기화 건너뜀 (중요하지 않음)')
              }
            } catch (storageError) {
              console.log('⚠️ Storage 초기화 실패 (앱은 정상 작동):', storageError)
            }
          }, 1000)
        } else {
          console.log('❌ 저장된 세션 없음')
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      } catch (error) {
        console.error('세션 초기화 오류:', error)
        // 에러 발생 시에도 로딩 상태를 해제하여 UI가 멈추지 않도록 함
        setLoading(false)
        setUser(null)
        setProfile(null)
      }
    }

    getInitialSession()

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 인증 상태 변경:', event, session?.user?.email || 'no user')
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ 로그인 완료:', session.user.email)
            setUser(session.user)
            const profileData = await fetchProfile(session.user.id)
            setProfile(profileData)
          } else if (event === 'SIGNED_OUT') {
            console.log('❌ 로그아웃 완료')
            setUser(null)
            setProfile(null)
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 토큰 갱신 완료:', session.user.email)
            setUser(session.user)
            // 토큰 갱신 시에는 프로필을 다시 조회하지 않음 (성능 최적화)
          }
          
          setLoading(false)
        } catch (error) {
          console.error('인증 상태 변경 처리 오류:', error)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Auth Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다')
  }
  return context
}