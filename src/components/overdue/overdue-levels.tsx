"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receivable, OverdueLevel } from "@/types/receivables"

interface OverdueLevelsProps {
  receivables: Receivable[]
}

export function OverdueLevels({ receivables }: OverdueLevelsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getOverdueLevelStats = () => {
    const stats = {
      normal: { count: 0, amount: 0 },
      warning: { count: 0, amount: 0 },
      longterm: { count: 0, amount: 0 },
      bad: { count: 0, amount: 0 }
    }

    receivables.forEach(receivable => {
      if (receivable.payment_status === 'overdue') {
        stats[receivable.overdue_level].count++
        stats[receivable.overdue_level].amount += receivable.remaining_amount
      }
    })

    return stats
  }

  const stats = getOverdueLevelStats()

  const getLevelDescription = (level: OverdueLevel) => {
    switch (level) {
      case 'normal':
        return '60일 이내 연체'
      case 'warning':
        return '61-90일 연체'
      case 'longterm':
        return '91-180일 연체'
      case 'bad':
        return '181일 이상 연체'
      default:
        return ''
    }
  }

  const getLevelColor = (level: OverdueLevel) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {(['normal', 'warning', 'longterm', 'bad'] as OverdueLevel[]).map((level) => (
        <Card key={level}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  <Badge className={getLevelColor(level)}>
                    {level === 'normal' ? '정상' :
                     level === 'warning' ? '주의' :
                     level === 'longterm' ? '장기' : '부실'}
                  </Badge>
                </CardTitle>
                <CardDescription>{getLevelDescription(level)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {formatCurrency(stats[level].amount)}
              </div>
              <div className="text-sm text-gray-500">
                {stats[level].count}건의 연체
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 