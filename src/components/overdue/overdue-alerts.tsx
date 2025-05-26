// src/components/overdue/overdue-alerts.tsx
// 연체 알림 컴포넌트

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, Phone, Mail, TrendingDown } from "lucide-react"
import { Receivable } from "@/types/receivables"

interface OverdueAlertsProps {
  receivables: Receivable[]
}

export function OverdueAlerts({ receivables }: OverdueAlertsProps) {
  // 연체 채권 필터링 및 정렬
  const overdueReceivables = receivables
    .filter(r => r.payment_status === 'overdue')
    .sort((a, b) => b.overdue_days - a.overdue_days) // 연체일수 내림차순
    .slice(0, 5) // 상위 5건만

  const urgentReceivables = overdueReceivables.filter(r => r.overdue_level === 'bad')
  const warningReceivables = overdueReceivables.filter(r => r.overdue_level === 'longterm')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getOverdueLevelColor = (level: string) => {
    switch (level) {
      case 'bad': return 'bg-red-100 text-red-800 border-red-200'
      case 'longterm': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getOverdueLevelLabel = (level: string) => {
    switch (level) {
      case 'bad': return '부실'
      case 'longterm': return '장기연체'
      case 'warning': return '주의'
      default: return '정상'
    }
  }

  if (overdueReceivables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-green-600">
            ✅ 연체 알림
          </CardTitle>
          <CardDescription>현재 연체된 채권이 없습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">모든 채권이 정상적으로 관리되고 있습니다.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* 긴급 알림: 부실 채권 */}
      {urgentReceivables.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              🚨 긴급: 부실 채권 ({urgentReceivables.length}건)
            </CardTitle>
            <CardDescription className="text-red-600">
              181일 이상 연체된 채권입니다. 즉시 조치가 필요합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentReceivables.map((receivable) => (
              <div key={receivable.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      {receivable.client_type === 'government' ? '관수' : '민수'}
                    </Badge>
                    <span className="font-medium">{receivable.company_name}</span>
                    <Badge className={getOverdueLevelColor(receivable.overdue_level)}>
                      {getOverdueLevelLabel(receivable.overdue_level)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {receivable.project_name}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-red-600">
                      {formatCurrency(receivable.remaining_amount)}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <Clock className="h-3 w-3" />
                      {receivable.overdue_days}일 연체
                    </span>
                    <span className="text-gray-500">담당: {receivable.primary_manager}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
                    <Phone className="h-3 w-3 mr-1" />
                    전화
                  </Button>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200">
                    <Mail className="h-3 w-3 mr-1" />
                    메일
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 경고 알림: 장기연체 채권 */}
      {warningReceivables.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
              <TrendingDown className="h-5 w-5" />
              ⚠️ 주의: 장기연체 채권 ({warningReceivables.length}건)
            </CardTitle>
            <CardDescription className="text-orange-600">
              91-180일 연체된 채권입니다. 적극적인 수금 활동이 필요합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {warningReceivables.map((receivable) => (
              <div key={receivable.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      {receivable.client_type === 'government' ? '관수' : '민수'}
                    </Badge>
                    <span className="font-medium">{receivable.company_name}</span>
                    <Badge className={getOverdueLevelColor(receivable.overdue_level)}>
                      {getOverdueLevelLabel(receivable.overdue_level)}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {receivable.project_name}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-orange-600">
                      {formatCurrency(receivable.remaining_amount)}
                    </span>
                    <span className="flex items-center gap-1 text-orange-600">
                      <Clock className="h-3 w-3" />
                      {receivable.overdue_days}일 연체
                    </span>
                    <span className="text-gray-500">담당: {receivable.primary_manager}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
                    <Phone className="h-3 w-3 mr-1" />
                    전화
                  </Button>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-200">
                    <Mail className="h-3 w-3 mr-1" />
                    메일
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 일반 연체 채권 요약 */}
      {overdueReceivables.length > urgentReceivables.length + warningReceivables.length && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
              <Clock className="h-5 w-5" />
              📋 기타 연체 채권
            </CardTitle>
            <CardDescription>
              기타 연체 중인 채권 {overdueReceivables.length - urgentReceivables.length - warningReceivables.length}건
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">총 연체건수</div>
                <div className="font-semibold text-lg">{overdueReceivables.length}건</div>
              </div>
              <div>
                <div className="text-gray-500">총 연체금액</div>
                <div className="font-semibold text-lg text-red-600">
                  {formatCurrency(overdueReceivables.reduce((sum, r) => sum + r.remaining_amount, 0))}
                </div>
              </div>
              <div>
                <div className="text-gray-500">평균 연체일수</div>
                <div className="font-semibold text-lg">
                  {Math.round(overdueReceivables.reduce((sum, r) => sum + r.overdue_days, 0) / overdueReceivables.length)}일
                </div>
              </div>
              <div>
                <div className="text-gray-500">최대 연체일수</div>
                <div className="font-semibold text-lg text-red-600">
                  {Math.max(...overdueReceivables.map(r => r.overdue_days))}일
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}