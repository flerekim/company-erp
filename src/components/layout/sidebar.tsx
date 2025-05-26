// src/components/layout/sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Users, 
  Settings,
  Building2
} from "lucide-react"

interface SidebarProps {
  // 더 이상 외부에서 상태를 관리하지 않음
}

const menuItems = [
  {
    title: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "수주 관리",
    href: "/orders",
    icon: FileText,
  },
  {
    title: "채권 관리", 
    href: "/receivables",
    icon: CreditCard,
  },
  {
    title: "직원 관리",
    href: "/employees",
    icon: Users,
  },
  {
    title: "설정",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar({ }: SidebarProps) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)
  const [delayTimer, setDelayTimer] = useState<NodeJS.Timeout | null>(null)

  // 마우스 진입 시 딜레이 후 열기
  const handleMouseEnter = () => {
    if (delayTimer) clearTimeout(delayTimer)
    const timer = setTimeout(() => {
      setIsHovered(true)
    }, 100) // 100ms 딜레이로 민감도 조절
    setDelayTimer(timer)
  }

  // 마우스 벗어날 시 딜레이 후 닫기
  const handleMouseLeave = () => {
    if (delayTimer) clearTimeout(delayTimer)
    const timer = setTimeout(() => {
      setIsHovered(false)
    }, 200) // 200ms 딜레이로 실수 방지
    setDelayTimer(timer)
  }

  return (
    <div 
      className={cn(
        "relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-lg",
        isHovered ? "w-64" : "w-16"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 헤더 */}
      <div className="flex items-center p-4 border-b border-gray-200 h-16">
        <div className="flex items-center space-x-2 min-w-0">
          <Building2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <span className={cn(
            "font-bold text-lg text-gray-900 transition-all duration-300 whitespace-nowrap",
            isHovered ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
          )}>
            회사 ERP
          </span>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {/* 아이콘은 항상 같은 위치에 고정 */}
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive && "text-blue-700"
              )} />
              
              {/* 텍스트는 아이콘 오른쪽에 절대 위치로 배치 */}
              <span className={cn(
                "absolute left-12 transition-all duration-300 whitespace-nowrap",
                isHovered ? "opacity-100 visible" : "opacity-0 invisible"
              )}>
                {item.title}
              </span>
              
              {/* 활성 상태 표시 바 */}
              {isActive && (
                <div className={cn(
                  "absolute right-0 top-0 bottom-0 w-1 bg-blue-700 rounded-l-md",
                  "transition-all duration-300"
                )} />
              )}
            </Link>
          )
        })}
      </nav>

      {/* 하단 정보 */}
      <div className={cn(
        "p-4 border-t border-gray-200 transition-all duration-300",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <div className="text-xs text-gray-500 whitespace-nowrap">
          © 2024 회사 ERP
        </div>
      </div>

      {/* 호버 힌트 (축소 상태일 때만) */}
      {!isHovered && (
        <div className="absolute left-full top-4 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          마우스를 올려서 메뉴 펼치기
        </div>
      )}
    </div>
  )
}