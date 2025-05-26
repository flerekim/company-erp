"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bell } from "lucide-react"
import { Receivable, OverdueLevel } from "@/types/receivables"

interface OverdueAlert {
  id: string
  receivable_number: string
  project_name: string
  company_name: string
  overdue_days: number
  overdue_level: OverdueLevel
  remaining_amount: number
  due_date: string
}

interface OverdueAlertsProps {
  receivables: Receivable[]
}

export function OverdueAlerts({ receivables }: OverdueAlertsProps) {
  const [alerts, setAlerts] = useState<OverdueAlert[]>([])

  useEffect(() => {
    // 연체된 채권만 필터링
    const overdueReceivables = receivables.filter(r => r.payment_status === 'overdue')
    
    // 연체 알림 생성
    const newAlerts = overdueReceivables.map(r => ({
      id: r.id,
      receivable_number: r.receivable_number,
      project_name: r.project_name,
      company_name: r.company_name,
      overdue_days: r.overdue_days,
      overdue_level: r.overdue_level,
      remaining_amount: r.remaining_amount,
      due_date: r.due_date
    }))

    setAlerts(newAlerts)
  }, [receivables])

  const getOverdueLevelColor = (level: OverdueLevel) => {
    switch (level) {
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'longterm':
        return 'bg-orange-100 text-orange-800'
      case 'bad':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>연체 알림</CardTitle>
            <CardDescription>연체된 채권 현황</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            {alerts.length}건
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              연체된 채권이 없습니다.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="font-medium">{alert.project_name}</div>
                    <div className="text-sm text-gray-500">
                      {alert.company_name} • {alert.receivable_number}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getOverdueLevelColor(alert.overdue_level)}>
                    {alert.overdue_days}일 연체
                  </Badge>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(alert.remaining_amount)}</div>
                    <div className="text-sm text-gray-500">
                      만료일: {formatDate(alert.due_date)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
} 