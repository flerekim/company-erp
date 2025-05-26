// src/components/layout/main-layout.tsx
// 메인 레이아웃 클라이언트 컴포넌트 - 조건부 렌더링 처리

"use client"

import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'  
import { Breadcrumb } from '@/components/layout/breadcrumb'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  
  // 인증 페이지에서는 레이아웃을 숨김
  const isAuthPage = pathname?.startsWith('/auth')
  
  // 인증 페이지는 단순한 레이아웃  
  if (isAuthPage) {
    return <>{children}</>
  }

  // 메인 ERP 레이아웃
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 - 자체적으로 호버 상태 관리 */}
      <Sidebar />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <Header />
        
        {/* 브레드크럼 */}
        <Breadcrumb />
        
        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}