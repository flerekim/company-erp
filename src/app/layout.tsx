// src/app/layout.tsx
// 루트 레이아웃 - 서버 컴포넌트로 변경

import { Inter } from 'next/font/google'
import './globals.css'
import { MainLayout } from '@/components/layout/main-layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '회사 ERP 시스템',
  description: '토양오염정화공사 전문 ERP 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}