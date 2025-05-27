// src/components/layout/header.tsx
// 헤더 컴포넌트 - 사용자 정보 및 로그아웃 기능 추가

"use client"

import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Bell, Search, User, Settings, LogOut, Menu } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const { profile, signOut } = useAuth()

  // 로그아웃 처리
  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

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

  // 현재 시간 표시
  const getCurrentTime = () => {
    return new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!profile) {
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 좌측: 현재 시간 및 인사말 */}
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900">
            안녕하세요, {profile.name}님! 👋
          </h2>
          <p className="text-sm text-gray-500">
            {getCurrentTime()}
          </p>
        </div>

        {/* 우측: 알림, 검색, 사용자 메뉴 */}
        <div className="flex items-center space-x-4">
          {/* 검색 버튼 (나중에 검색 기능 추가 시 사용) */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <Search className="h-4 w-4" />
          </Button>

          {/* 알림 버튼 (나중에 알림 기능 추가 시 사용) */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {/* 알림 배지 예시 */}
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* 사용자 정보 및 메뉴 */}
          <div className="flex items-center space-x-3">
            {/* 사용자 정보 (데스크톱에서만 표시) */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {profile.name}
              </p>
              <div className="flex items-center justify-end space-x-2">
                <p className="text-xs text-gray-500">
                  {profile.employee_id}
                </p>
                <Badge 
                  variant={getRoleBadgeVariant(profile.role)} 
                  className="text-xs"
                >
                  {getRoleText(profile.role)}
                </Badge>
              </div>
            </div>

            {/* 사용자 드롭다운 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile.name}</p>
                    <p className="text-xs text-gray-500">{profile.email}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{profile.employee_id}</span>
                      <Badge 
                        variant={getRoleBadgeVariant(profile.role)} 
                        className="text-xs"
                      >
                        {getRoleText(profile.role)}
                      </Badge>
                    </div>
                    {profile.department && (
                      <p className="text-xs text-gray-500">
                        {profile.department} • {profile.position}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  프로필 설정
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  계정 설정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}