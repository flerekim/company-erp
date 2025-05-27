// 로그인 페이지 - 회사 이메일로만 로그인 가능
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Building2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 이메일 도메인 검증
    if (!email.endsWith('@inkwang.co.kr')) {
      setError('회사 이메일(@inkwang.co.kr)로만 로그인할 수 있습니다.')
      setLoading(false)
      return
    }

    try {
      // 1. 먼저 해당 이메일로 등록된 직원이 있는지 확인
      // 제거된 로직

      // 2. Supabase Auth로 로그인 시도
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        setLoading(false)
        return
      }

      // 3. 로그인 성공 시 프로필 정보 업데이트 (auth_user_id 연결)
      // Supabase Auth에서 반환된 user를 사용하여 프로필 업데이트 시도
      if (data.user) {
        // 프로필 정보는 AuthProvider에서 관리되므로, 여기서는 auth_user_id 연결만 시도
        // 이 로직은 createAdmin.js 스크립트에서 이미 처리되었을 수 있지만,
        // 혹시 누락된 경우를 위해 유지
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ auth_user_id: data.user.id })
          .eq('email', email); // 이메일로 프로필을 찾아 auth_user_id 업데이트

        if (updateError) {
          console.error('프로필 auth_user_id 업데이트 실패:', updateError);
          // 업데이트 실패가 로그인을 막지는 않도록 에러를 throw하지 않음
        }
      }

      // 4. 대시보드로 리다이렉트
      router.push(redirectTo)

    } catch (error) {
      console.error('로그인 중 오류:', error)
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Inkwang One</CardTitle>
          <CardDescription>
            회사 이메일(@inkwang.co.kr)로 로그인하세요
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">회사 이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@inkwang.co.kr"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>계정이 없으신가요?</p>
            <p className="mt-1">관리자에게 계정 발급을 요청하세요.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}