// src/components/layout/sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from '@/lib/auth/auth-context'
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Users, 
  Settings,
  Building2,
  BarChart3,
  FileSpreadsheet,
  Home
} from "lucide-react"

interface SidebarProps {
  // 더 이상 외부에서 상태를 관리하지 않음
}

export function Sidebar({ }: SidebarProps) {
  const pathname = usePathname()
  const { profile } = useAuth()
  const [isHovered, setIsHovered] = useState(false)
  const [delayTimer, setDelayTimer] = useState<NodeJS.Timeout | null>(null)

  // 로그인하지 않은 경우 렌더링하지 않음
  if (!profile) {
    return null
  }

  // 기본 메뉴 항목
  const baseMenuItems = [
    {
      title: "홈",
      href: "/",
      icon: Home,
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
      title: "실적 관리",
      href: "/performance",
      icon: BarChart3,
    },
    {
      title: "문서 관리",
      href: "/documents",
      icon: FileSpreadsheet,
    },
  ]

  // 관리자 전용 메뉴
  const adminMenuItems = [
    {
      title: "직원 관리",
      href: "/admin/employees",
      icon: Users,
    },
    {
      title: "시스템 설정",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  // 사용자 권한에 따른 메뉴 구성
  const menuItems = profile.role === 'admin' 
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems

  // 사용자 이름의 첫 글자 추출 (아바타용)
  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'U'
  }

  // 역할 표시 텍스트
  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return '시스템관리자'
      case 'manager': return '관리자'
      default: return '사용자'
    }
  }

  // 역할별 배지 색상
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive' as const
      case 'manager': return 'default' as const
      default: return 'secondary' as const
    }
  }

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
            토양정화 ERP
          </span>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {/* 기본 메뉴 */}
        {baseMenuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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

        {/* 관리자 메뉴 구분선 및 메뉴 */}
        {profile.role === 'admin' && adminMenuItems.length > 0 && (
          <>
            {/* 구분선 */}
            <div className={cn(
              "my-4 transition-all duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}>
              <div className="px-3">
                <div className="border-t border-gray-200"></div>
                <p className="mt-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  관리자 메뉴
                </p>
              </div>
            </div>

            {/* 관리자 메뉴 항목 */}
            {adminMenuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                    isActive 
                      ? "bg-red-50 text-red-700 shadow-sm" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {/* 아이콘은 항상 같은 위치에 고정 */}
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive && "text-red-700"
                  )} />
                  
                  {/* 텍스트는 아이콘 오른쪽에 절대 위치로 배치 */}
                  <span className={cn(
                    "absolute left-12 transition-all duration-300 whitespace-nowrap",
                    isHovered ? "opacity-100 visible" : "opacity-0 invisible"
                  )}>
                    {item.title}
                  </span>
                  
                  {/* 활성 상태 표시 바 (관리자 메뉴는 빨간색) */}
                  {isActive && (
                    <div className={cn(
                      "absolute right-0 top-0 bottom-0 w-1 bg-red-700 rounded-l-md",
                      "transition-all duration-300"
                    )} />
                  )}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* 사용자 정보 */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center space-x-3">
          {/* 아바타 */}
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          
          {/* 사용자 정보 (펼쳐진 상태에서만 표시) */}
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-300",
            isHovered ? "opacity-100 visible" : "opacity-0 invisible"
          )}>
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.name}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500 truncate">
                {profile.employee_id}
              </p>
              <Badge 
                variant={getRoleBadgeVariant(profile.role)} 
                className="text-xs ml-2 flex-shrink-0"
              >
                {getRoleText(profile.role)}
              </Badge>
            </div>
            {profile.department && (
              <p className="text-xs text-gray-500 truncate mt-1">
                {profile.department}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 하단 정보 */}
      <div className={cn(
        "px-4 pb-3 transition-all duration-300",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <div className="text-xs text-gray-500 whitespace-nowrap">
          © Ik Group IManagement System
        </div>
      </div>

      {/* 호버 힌트 (축소 상태일 때만) */}
      {!isHovered && (
        <div className="absolute left-full top-4 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          마우스를 올려서 메뉴 펼치기
        </div>
      )}
    </div>
  )
}