// Next.js 미들웨어 - 라우트 보호 및 인증 확인
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Supabase 클라이언트 생성
  const supabase = createMiddlewareClient({ req: request, res })

  // 세션 확인
  const { data: { session } } = await supabase.auth.getSession()

  // 보호되지 않는 경로들 (로그인 페이지, 정적 파일 등)
  const publicPaths = [
    '/auth/login',
    '/auth/error',
    '/_next',
    '/favicon.ico',
    '/api/auth'
  ]

  // 정적 파일이나 API 라우트는 통과
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  if (isPublicPath) {
    return res
  }

  // 루트 경로 처리
  if (pathname === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 보호된 경로에 대한 세션 체크
  if (!session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 사용자 프로필 정보 확인
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single()

  // 프로필이 없거나 비활성 상태인 경우
  if (!profile || !profile.is_active) {
    return NextResponse.redirect(new URL('/auth/error?message=account_inactive', request.url))
  }

  // 관리자 전용 경로 보호
  const adminPaths = ['/admin']
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path))
  
  if (isAdminPath && profile.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url))
  }

  return res
}

export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 경로에 미들웨어 적용:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - robots.txt, sitemap.xml 등
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}