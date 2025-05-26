// src/app/layout.tsx
"use client"

import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Breadcrumb } from '@/components/layout/breadcrumb'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // 인증 페이지에서는 레이아웃을 숨김
  const isAuthPage = pathname?.startsWith('/auth')

  if (isAuthPage) {
    return (
      <html lang="ko">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    )
  }

  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="flex h-screen bg-gray-100">
          {/* 사이드바 - 이제 자체적으로 호버 상태 관리 */}
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
      </body>
    </html>
  )
}