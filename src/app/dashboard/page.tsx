// src/app/dashboard/page.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Eye
} from "lucide-react"

// 임시 데이터 (나중에 Supabase에서 가져올 예정)
const dashboardStats = {
  totalOrders: 15,
  pendingOrders: 3,
  totalReceivables: 125000000,
  overdueReceivables: 8500000,
}

const recentOrders = [
  { id: 1, client: "ABC 건설", project: "아파트 시공", amount: 50000000, status: "진행중", date: "2024-05-20" },
  { id: 2, client: "XYZ 개발", project: "오피스텔 건설", amount: 75000000, status: "견적", date: "2024-05-18" },
  { id: 3, client: "123 기업", project: "공장 신축", amount: 120000000, status: "완료", date: "2024-05-15" },
]

const overdueReceivables = [
  { id: 1, client: "ABC 건설", amount: 5000000, daysOverdue: 15 },
  { id: 2, client: "DEF 회사", amount: 3500000, daysOverdue: 8 },
]

export default function DashboardPage() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-1">수주 및 채권 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 수주 등록
          </Button>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수주 건수</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalOrders}건</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600">대기중 {dashboardStats.pendingOrders}건</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 채권</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalReceivables)}</div>
            <p className="text-xs text-muted-foreground">
              전월 대비 +12%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">연체 채권</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(dashboardStats.overdueReceivables)}
            </div>
            <p className="text-xs text-red-500">
              즉시 조치 필요
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">수금률</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">93.2%</div>
            <p className="text-xs text-muted-foreground">
              목표: 95%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 하단 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 수주 현황 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>최근 수주 현황</CardTitle>
                <CardDescription>최근 등록된 수주 건들입니다</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                전체보기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{order.client}</div>
                    <div className="text-sm text-gray-600">{order.project}</div>
                    <div className="text-xs text-gray-500">{order.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(order.amount)}</div>
                    <Badge 
                      variant={
                        order.status === "완료" ? "default" : 
                        order.status === "진행중" ? "secondary" : 
                        "outline"
                      }
                      className="mt-1"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 연체 채권 알림 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-red-600">연체 채권 알림</CardTitle>
                <CardDescription>즉시 조치가 필요한 연체 건들입니다</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                전체보기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overdueReceivables.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex-1">
                    <div className="font-medium">{item.client}</div>
                    <div className="text-sm text-red-600">
                      {item.daysOverdue}일 연체
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">
                      {formatCurrency(item.amount)}
                    </div>
                    <Button size="sm" variant="destructive" className="mt-1">
                      연락하기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}