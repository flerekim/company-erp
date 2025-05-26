// src/components/overdue/overdue-levels.tsx
// 연체 단계별 현황 컴포넌트

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, AlertTriangle, XCircle } from "lucide-react"
import { Receivable } from "@/types/receivables"

interface OverdueLevelsProps {
  receivables: Receivable[]
}

export function OverdueLevels({ receivables }: OverdueLevelsProps) {
  // 연체 단계별 통계 계산
  const overdueLevelStats = {
    normal: {
      count: receivables.filter(r => r.overdue_level === 'normal').length,
      amount: receivables.filter(r => r.overdue_level === 'normal').reduce((sum, r) => sum + r.remaining_amount, 0),
      label: '정상',
      description: '60일 이내',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: CheckCircle,
      iconColor: 'text-blue-600'
    },
    warning: {
      count: receivables.filter(r => r.overdue_level === 'warning').length,
      amount: receivables.filter(r => r.overdue_level === 'warning').reduce((sum, r) => sum + r.remaining_amount, 0),
      label: '주의',
      description: '61-90일',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-600'
    },
    longterm: {
      count: receivables.filter(r => r.overdue_level === 'longterm').length,
      amount: receivables.filter(r => r.overdue_level === 'longterm').reduce((sum, r) => sum + r.remaining_amount, 0),
      label: '장기연체',
      description: '91-180일',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: AlertTriangle,
      iconColor: 'text-orange-600'
    },
    bad: {
      count: receivables.filter(r => r.overdue_level === 'bad').length,
      amount: receivables.filter(r => r.overdue_level === 'bad').reduce((sum, r) => sum + r.remaining_amount, 0),
      label: '부실',
      description: '181일 이상',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600'
    }
  }

  const totalCount = receivables.length
  const totalAmount = receivables.reduce((sum, r) => sum + r.remaining_amount, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0
  }

  const getAmountPercentage = (amount: number, total: number) => {
    return total > 0 ? Math.round((amount / total) * 100) : 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">연체 단계별 현황</CardTitle>
        <CardDescription>
          채권을 연체 기간에 따라 4단계로 분류한 현황입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(overdueLevelStats).map(([key, stats]) => {
            const Icon = stats.icon
            const countPercentage = getPercentage(stats.count, totalCount)
            const amountPercentage = getAmountPercentage(stats.amount, totalAmount)

            return (
              <Card key={key} className={`border-2 ${stats.color.includes('blue') ? 'border-blue-200' : 
                                                     stats.color.includes('yellow') ? 'border-yellow-200' :
                                                     stats.color.includes('orange') ? 'border-orange-200' : 'border-red-200'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${stats.iconColor}`} />
                      <CardTitle className="text-base">{stats.label}</CardTitle>
                    </div>
                    <Badge className={stats.color}>
                      {stats.description}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* 건수 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">건수</span>
                      <span className="text-sm font-medium">{countPercentage}%</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{stats.count}건</div>
                    <Progress 
                      value={countPercentage} 
                      className="h-2"
                    />
                  </div>

                  {/* 금액 */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">금액</span>
                      <span className="text-sm font-medium">{amountPercentage}%</span>
                    </div>
                    <div className="text-lg font-bold text-gray-700">
                      {formatCurrency(stats.amount)}
                    </div>
                    <Progress 
                      value={amountPercentage} 
                      className="h-2"
                    />
                  </div>

                  {/* 평균 건당 금액 */}
                  {stats.count > 0 && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-gray-500">평균 건당</div>
                      <div className="text-sm font-medium">
                        {formatCurrency(stats.amount / stats.count)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 요약 정보 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">전체 채권</div>
              <div className="font-semibold text-lg">{totalCount}건</div>
            </div>
            <div>
              <div className="text-gray-500">전체 금액</div>
              <div className="font-semibold text-lg">{formatCurrency(totalAmount)}</div>
            </div>
            <div>
              <div className="text-gray-500">연체 채권</div>
              <div className="font-semibold text-lg text-red-600">
                {overdueLevelStats.warning.count + overdueLevelStats.longterm.count + overdueLevelStats.bad.count}건
              </div>
            </div>
            <div>
              <div className="text-gray-500">건전성 비율</div>
              <div className="font-semibold text-lg text-green-600">
                {getPercentage(overdueLevelStats.normal.count, totalCount)}%
              </div>
            </div>
          </div>
        </div>

        {/* 위험도 안내 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">연체 단계 기준</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
              <span>정상: 60일 이내</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-200 rounded-full"></div>
              <span>주의: 61-90일</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-200 rounded-full"></div>
              <span>장기: 91-180일</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 rounded-full"></div>
              <span>부실: 181일 이상</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}