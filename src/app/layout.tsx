// src/app/layout.tsx
// 루트 레이아웃 - AuthProvider
"use client"

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth/auth-context"

const inter = Inter({ subsets: ["latin"] })

// Metadata는 서버 컴포넌트에서만 사용 가능하므로, "use client" 사용 시 주석 처리하거나 제거해야 합니다.
// Next.js 13 이상에서는 generateMetadata 함수를 사용하여 클라이언트 컴포넌트에서도 메타데이터를 설정할 수 있으나, 여기서는 일단 주석 처리합니다.
// export const metadata: Metadata = {
//   title: "Company ERP",
//   description: "기업 자원 관리 시스템",
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <AuthProvider>
          <Toaster />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}