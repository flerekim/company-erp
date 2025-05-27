// 인증 에러 페이지
'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'unknown'

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'account_inactive':
        return {
          title: '계정이 비활성화됨',
          description: '귀하의 계정이 비활성화되었습니다. 관리자에게 문의하여 계정을 활성화해주세요.'
        }
      case 'access_denied':
        return {
          title: '접근 권한 없음',
          description: '해당 페이지에 접근할 권한이 없습니다.'
        }
      case 'no_profile':
        return {
          title: '프로필 정보 없음',
          description: '사용자 프로필 정보를 찾을 수 없습니다. 관리자에게 문의하세요.'
        }
      default:
        return {
          title: '인증 오류',
          description: '알 수 없는 오류가 발생했습니다. 관리자에게 문의하세요.'
        }
    }
  }

  const errorInfo = getErrorMessage(message)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-red-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-red-700">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                문제가 지속되면 시스템 관리자에게 문의하세요.
              </p>
              <p className="text-sm font-medium text-gray-800 mt-2">
                연락처: admin@company.com
              </p>
            </div>
            
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                로그인 페이지로 돌아가기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}