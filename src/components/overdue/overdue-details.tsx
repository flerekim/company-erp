"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Receivable, OverdueLevel } from "@/types/receivables"
import { Calendar, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface OverdueDetailsProps {
  receivable: Receivable
}

type CollectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed'
type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

interface CollectionPlan {
  id: string
  date: string
  action: string
  status: CollectionStatus
  notes: string
  next_follow_up: string
}

interface RiskAssessment {
  level: RiskLevel
  factors: string[]
  probability: number
  impact: number
  mitigation_plan: string
}

export function OverdueDetails({ receivable }: OverdueDetailsProps) {
  const [collectionPlans, setCollectionPlans] = useState<CollectionPlan[]>([
    {
      id: "1",
      date: "2024-03-15",
      action: "전화 상담",
      status: "completed",
      notes: "담당자와 통화 완료, 다음 주 중 입금 예정",
      next_follow_up: "2024-03-22"
    },
    {
      id: "2",
      date: "2024-03-22",
      action: "이메일 발송",
      status: "in_progress",
      notes: "입금 요청 이메일 발송",
      next_follow_up: "2024-03-29"
    }
  ])

  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment>({
    level: "high",
    factors: [
      "장기 연체 (240일)",
      "이전 채권 회수 이력 부재",
      "담당자 연락 지연"
    ],
    probability: 70,
    impact: 80,
    mitigation_plan: "법적 대응 검토 및 담당자 교체 요청"
  })

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

  const getStatusColor = (status: CollectionStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'critical':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>연체 채권 상세 정보</CardTitle>
          <CardDescription>채권번호: {receivable.receivable_number}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-500">프로젝트명</div>
              <div className="mt-1">{receivable.project_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">고객사</div>
              <div className="mt-1">{receivable.company_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">연체 금액</div>
              <div className="mt-1 text-lg font-bold text-red-600">
                {formatCurrency(receivable.remaining_amount)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">연체일수</div>
              <div className="mt-1">
                <Badge className="bg-red-100 text-red-800">
                  {receivable.overdue_days}일
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 리스크 평가 */}
      <Card>
        <CardHeader>
          <CardTitle>리스크 평가</CardTitle>
          <CardDescription>연체 채권의 리스크 수준과 대응 방안</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">리스크 수준</div>
                <Badge className={`mt-1 ${getRiskLevelColor(riskAssessment.level)}`}>
                  {riskAssessment.level === 'low' ? '낮음' :
                   riskAssessment.level === 'medium' ? '중간' :
                   riskAssessment.level === 'high' ? '높음' : '심각'}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">발생 확률</div>
                <div className="mt-1">{riskAssessment.probability}%</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">리스크 요인</div>
              <ul className="mt-2 space-y-1">
                {riskAssessment.factors.map((factor, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-500">대응 방안</div>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                {riskAssessment.mitigation_plan}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 회수 계획 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>회수 계획</CardTitle>
              <CardDescription>채권 회수를 위한 활동 계획</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>새 계획 추가</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>회수 계획 추가</DialogTitle>
                  <DialogDescription>
                    새로운 회수 활동을 계획하세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">활동 일자</label>
                    <Input type="date" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">활동 유형</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="활동 유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">전화 상담</SelectItem>
                        <SelectItem value="email">이메일 발송</SelectItem>
                        <SelectItem value="visit">방문 상담</SelectItem>
                        <SelectItem value="legal">법적 대응</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">비고</label>
                    <Textarea className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">다음 후속 조치</label>
                    <Input type="date" className="mt-1" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일자</TableHead>
                <TableHead>활동</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>비고</TableHead>
                <TableHead>다음 조치</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectionPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{formatDate(plan.date)}</TableCell>
                  <TableCell>{plan.action}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(plan.status)}>
                      {plan.status === 'completed' ? '완료' :
                       plan.status === 'in_progress' ? '진행중' :
                       plan.status === 'pending' ? '대기중' : '실패'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">{plan.notes}</TableCell>
                  <TableCell>{formatDate(plan.next_follow_up)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 