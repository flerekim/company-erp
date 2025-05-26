// src/components/layout/breadcrumb.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const pathMap: Record<string, string> = {
  "/dashboard": "대시보드",
  "/orders": "수주 관리",
  "/receivables": "채권 관리", 
  "/employees": "직원 관리",
  "/settings": "설정",
}

export function Breadcrumb() {
  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter(Boolean)
  
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = "/" + pathSegments.slice(0, index + 1).join("/")
    const title = pathMap[path] || segment
    return { path, title, isLast: index === pathSegments.length - 1 }
  })

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 px-6 py-3 bg-gray-50 border-b border-gray-200">
      <Link 
        href="/dashboard" 
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {crumb.isLast ? (
            <span className="font-medium text-gray-900">{crumb.title}</span>
          ) : (
            <Link 
              href={crumb.path}
              className="hover:text-gray-900 transition-colors"
            >
              {crumb.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}