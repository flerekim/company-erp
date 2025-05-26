// src/app/receivables/page.tsx
// 채권 관리 페이지 - 토양정화 업무 특화

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Plus,
  Search,
  Filter,
  Eye,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Phone,
  Mail,
  MoreHorizontal,
  DollarSign
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Receivable, PaymentStatus, ClientType, OverdueLevel } from "@/types/receivables"
import { PaymentForm } from "@/components/forms/payment-form"
import { OverdueAlerts } from "@/components/overdue/overdue-alerts"
import { OverdueLevels } from "@/components/overdue/overdue-levels"
import { OverdueDetails } from "@/components/overdue/overdue-details"

// 라벨 상수
const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  government: '관수',
  private: '민수'
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: '미수',
  partial: '부분수금',
  paid: '완료',
  overdue: '연체'
}

const OVERDUE_LEVEL_LABELS: Record<OverdueLevel, string> = {
  normal: '정상',
  warning: '주의',
  longterm: '장기',
  bad: '부실'
}

// 색상 상수
const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  government: 'bg-purple-100 text-purple-800',
  private: 'bg-cyan-100 text-cyan-800'
}

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  unpaid: 'bg-gray-100 text-gray-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800'
}

const OVERDUE_LEVEL_COLORS: Record<OverdueLevel, string> = {
  normal: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  longterm: 'bg-orange-100 text-orange-800',
  bad: 'bg-red-100 text-red-800'
}

// 유틸리티 함수
const calculateOverdueLevel = (overdueDays: number): OverdueLevel => {
  if (overdueDays <= 60) return 'normal'
  if (overdueDays <= 90) return 'warning'
  if (overdueDays <= 180) return 'longterm'
  return 'bad'
}

const calculateOverdueDays = (dueDate: string): number => {
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = today.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

// 임시 데이터 (나중에 Supabase에서 가져올 예정)
const receivables: Receivable[] = [
  {
    id: "1",
    receivable_number: "REC-2024-001",
    order_id: "ORD-2024-001",
    order_number: "ORD-2024-001",
    project_name: "24-A-OO부대 토양오염정화공사",
    company_name: "제2218부대",
    client_type: "government",
    contract_amount: 1063758000,
    tax_amount: 106375800,
    total_amount: 1170133800,
    paid_amount: 585066900,
    remaining_amount: 585066900,
    payment_terms: "net_30",
    due_date: "2024-12-28",
    payment_due_days: 30,
    payment_status: "partial",
    overdue_days: 0,
    overdue_level: "normal",
    primary_manager: "이대룡",
    created_at: "2024-11-28",
    updated_at: "2024-11-28"
  },
  {
    id: "2",
    receivable_number: "REC-2024-002",
    order_id: "ORD-2024-002",
    order_number: "ORD-2024-002",
    project_name: "OO지역 토양오염 정화공사",
    company_name: "한국토지주택공사",
    client_type: "private",
    contract_amount: 85105000,
    tax_amount: 8510500,
    total_amount: 93615500,
    paid_amount: 0,
    remaining_amount: 93615500,
    payment_terms: "net_60",
    due_date: "2025-01-27",
    payment_due_days: 60,
    payment_status: "unpaid",
    overdue_days: 0,
    overdue_level: "normal",
    primary_manager: "박찬수",
    created_at: "2024-11-28",
    updated_at: "2024-11-28"
  },
  {
    id: "3",
    receivable_number: "REC-2023-001",
    order_id: "ORD-2023-001",
    order_number: "ORD-2023-001",
    project_name: "OO산단 토양정화 시범사업",
    company_name: "OO산업단지관리공단",
    client_type: "private",
    contract_amount: 250000000,
    tax_amount: 25000000,
    total_amount: 275000000,
    paid_amount: 0,
    remaining_amount: 275000000,
    payment_terms: "net_30",
    due_date: "2023-12-15",
    payment_due_days: 30,
    payment_status: "overdue",
    overdue_days: 120,
    overdue_level: "longterm",
    primary_manager: "김철수",
    created_at: "2023-11-15",
    updated_at: "2024-03-15"
  },
  {
    id: "4",
    receivable_number: "REC-2023-002",
    order_id: "ORD-2023-002",
    order_number: "ORD-2023-002",
    project_name: "OO시 토양오염 정화사업",
    company_name: "OO시청",
    client_type: "government",
    contract_amount: 500000000,
    tax_amount: 50000000,
    total_amount: 550000000,
    paid_amount: 0,
    remaining_amount: 550000000,
    payment_terms: "net_60",
    due_date: "2023-10-30",
    payment_due_days: 60,
    payment_status: "overdue",
    overdue_days: 200,
    overdue_level: "bad",
    primary_manager: "이영희",
    created_at: "2023-08-30",
    updated_at: "2024-03-15"
  },
  {
    id: "5",
    receivable_number: "REC-2023-003",
    order_id: "ORD-2023-003",
    order_number: "ORD-2023-003",
    project_name: "OO공단 토양정화 사업",
    company_name: "OO공단",
    client_type: "private",
    contract_amount: 180000000,
    tax_amount: 18000000,
    total_amount: 198000000,
    paid_amount: 0,
    remaining_amount: 198000000,
    payment_terms: "net_30",
    due_date: "2023-09-15",
    payment_due_days: 30,
    payment_status: "overdue",
    overdue_days: 240,
    overdue_level: "bad",
    primary_manager: "박지성",
    created_at: "2023-08-15",
    updated_at: "2024-03-15"
  }
]

export default function ReceivablesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all")
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)
  const [showOverdueDetails, setShowOverdueDetails] = useState(false)

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

  const filteredReceivables = receivables.filter(receivable => {
    const matchesSearch = 
      receivable.receivable_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receivable.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receivable.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesClientType = clientTypeFilter === "all" || receivable.client_type === clientTypeFilter
    const matchesStatus = statusFilter === "all" || receivable.payment_status === statusFilter

    return matchesSearch && matchesClientType && matchesStatus
  })

  // 통계 계산
  const stats = {
    total_amount: filteredReceivables.reduce((sum, r) => sum + r.total_amount, 0),
    paid_amount: filteredReceivables.reduce((sum, r) => sum + r.paid_amount, 0),
    remaining_amount: filteredReceivables.reduce((sum, r) => sum + r.remaining_amount, 0),
    overdue_amount: filteredReceivables
      .filter(r => r.payment_status === 'overdue')
      .reduce((sum, r) => sum + r.remaining_amount, 0),
    collection_rate: 0,
    by_client_type: {
      government: {
        count: filteredReceivables.filter(r => r.client_type === 'government').length,
        amount: filteredReceivables
          .filter(r => r.client_type === 'government')
          .reduce((sum, r) => sum + r.remaining_amount, 0)
      },
      private: {
        count: filteredReceivables.filter(r => r.client_type === 'private').length,
        amount: filteredReceivables
          .filter(r => r.client_type === 'private')
          .reduce((sum, r) => sum + r.remaining_amount, 0)
      }
    },
    by_overdue_level: {
      normal: filteredReceivables.filter(r => r.overdue_level === 'normal').length,
      warning: filteredReceivables.filter(r => r.overdue_level === 'warning').length,
      longterm: filteredReceivables.filter(r => r.overdue_level === 'longterm').length,
      bad: filteredReceivables.filter(r => r.overdue_level === 'bad').length
    }
  }

  // 수금률 계산
  stats.collection_rate = stats.total_amount > 0 
    ? Math.round((stats.paid_amount / stats.total_amount) * 100) 
    : 0

  const handlePaymentSubmit = (data: any) => {
    // TODO: Supabase에 입금 내역 저장
    console.log('입금 처리:', data)
    setIsPaymentDialogOpen(false)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">채권 관리</h1>
      </div>

      {/* 연체 단계별 현황 */}
      <OverdueLevels receivables={receivables} />

      {/* 연체 알림 */}
      <OverdueAlerts receivables={receivables} />

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 채권</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_amount)}</div>
            <div className="text-sm text-gray-500">{filteredReceivables.length}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">수금완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid_amount)}</div>
            <div className="text-sm text-green-500">수금률 {stats.collection_rate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">미수금</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.remaining_amount)}</div>
            <div className="text-sm text-blue-500">
              관수: {formatCurrency(stats.by_client_type.government.amount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">연체금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue_amount)}</div>
            <div className="text-sm text-red-500">
              {stats.by_overdue_level.warning + stats.by_overdue_level.longterm + stats.by_overdue_level.bad}건 연체
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">부실채권</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{stats.by_overdue_level.bad}건</div>
            <div className="text-sm text-red-600">181일+ 연체</div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
          <CardDescription>채권 검색 및 필터링</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="채권번호, 프로젝트명, 고객사 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={clientTypeFilter} onValueChange={(value) => setClientTypeFilter(value as ClientType | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="고객사 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="government">관수</SelectItem>
                <SelectItem value="private">민수</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentStatus | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="결제 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="unpaid">미수</SelectItem>
                <SelectItem value="partial">부분수금</SelectItem>
                <SelectItem value="paid">완료</SelectItem>
                <SelectItem value="overdue">연체</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 채권 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>채권 목록</CardTitle>
          <CardDescription>총 {filteredReceivables.length}건의 채권</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>채권번호</TableHead>
                <TableHead>고객사</TableHead>
                <TableHead>프로젝트명</TableHead>
                <TableHead>계약금액</TableHead>
                <TableHead>미수금액</TableHead>
                <TableHead>만료일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceivables.map((receivable) => (
                <TableRow key={receivable.id}>
                  <TableCell className="font-mono">{receivable.receivable_number}</TableCell>
                  <TableCell>
                    <Badge className={
                      receivable.client_type === 'government' 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-cyan-100 text-cyan-800'
                    }>
                      {receivable.client_type === 'government' ? '관수' : '민수'}
                    </Badge>
                    <div className="mt-1">{receivable.company_name}</div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate" title={receivable.project_name}>
                      {receivable.project_name}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(receivable.contract_amount)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(receivable.remaining_amount)}
                  </TableCell>
                  <TableCell>{formatDate(receivable.due_date)}</TableCell>
                  <TableCell>
                    <Badge className={
                      receivable.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                      receivable.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      receivable.payment_status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {receivable.payment_status === 'paid' ? '완료' :
                       receivable.payment_status === 'partial' ? '부분수금' :
                       receivable.payment_status === 'overdue' ? '연체' :
                       '미수'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{receivable.primary_manager}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>액션</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setSelectedReceivable(receivable)
                          setShowOverdueDetails(true)
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          상세보기
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          alert(`${receivable.company_name}에 입금 요청 연락을 진행합니다.`)
                        }}>
                          <Phone className="mr-2 h-4 w-4" />
                          전화연락
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          alert(`${receivable.company_name}에 이메일을 발송합니다.`)
                        }}>
                          <Mail className="mr-2 h-4 w-4" />
                          이메일 발송
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => {
                          setSelectedReceivable(receivable)
                          setIsPaymentDialogOpen(true)
                        }}>
                          <DollarSign className="mr-2 h-4 w-4" />
                          입금 처리
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 연체 채권 상세 정보 */}
      <Dialog open={showOverdueDetails} onOpenChange={setShowOverdueDetails}>
        <DialogContent className="max-w-screen-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>연체 채권 상세 정보</DialogTitle>
            <DialogDescription>
              {selectedReceivable?.receivable_number} 상세 정보
            </DialogDescription>
          </DialogHeader>
          {selectedReceivable && (
            <OverdueDetails receivable={selectedReceivable} />
          )}
        </DialogContent>
      </Dialog>

      {/* 입금 처리 다이얼로그 */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>입금 처리</DialogTitle>
            <DialogDescription>
              새로운 입금 내역을 등록하세요.
            </DialogDescription>
          </DialogHeader>
          {selectedReceivable && (
            <PaymentForm
              receivable={selectedReceivable}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setIsPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}