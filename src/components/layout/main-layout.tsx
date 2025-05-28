// src/components/layout/main-layout.tsx
// 메인 레이아웃 클라이언트 컴포넌트 - 인증 상태 연동 및 조건부 렌더링 처리

"use client"

import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'  
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion' // Framer Motion import

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const { user, profile, loading } = useAuth()
  
  // 인증 페이지에서는 레이아웃을 숨김
  const isAuthPage = pathname?.startsWith('/auth')
  
  // 로딩 중이거나 인증 페이지인 경우
  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    // 로딩 중일 때 로딩 스피너 표시
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 로그인하지 않은 사용자 또는 프로필이 없는 경우
  if (!user || !profile) {
    // 필요한 경우 에러 메시지 등을 표시할 수 있습니다.
    return <>{children}</>;
  }

  // 메인 ERP 레이아웃 (로그인된 사용자)
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <Sidebar />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <Header />
        
        {/* 브레드크럼 */}
        <Breadcrumb />
        
        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-auto px-2 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}