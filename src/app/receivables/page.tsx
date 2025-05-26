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

// 타입 정의 (간소화된 버전)
type ClientType = 'government' | 'private'
type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'
type OverdueLevel = 'normal' | 'warning' | 'longterm' | 'bad'

interface Receivable {
  id: string
  receivable_number: string
  order_number: string
  project_name: string
  company_name: string
  client_type: ClientType
  contract_amount: number
  paid_amount: number
  remaining_amount: number
  due_date: string
  payment_status: PaymentStatus
  overdue_days: number
  overdue_level: OverdueLevel
  primary_manager: string
  last_contact_date?: string
  next_contact_date?: string
}

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

// 실제 수주 데이터와 연계된 임시 채권 데이터
const receivablesData: Receivable[] = [
  {
    id: "1",
    receivable_number: "REC-2024-001",
    order_number: "ORD-2024-001",
    project_name: "24-A-OO부대 토양오염정화공사(1517)",
    company_name: "제2218부대",
    client_type: "government",
    contract_amount: 1063758000,
    paid_amount: 700000000,     // 부분 수금
    remaining_amount: 363758000,
    due_date: "2024-12-28",     // 30일 후 만료
    payment_status: "partial",
    overdue_days: 0,
    overdue_level: "normal",
    primary_manager: "이대룡",
    last_contact_date: "2024-11-20",
    next_contact_date: "2024-12-15"
  },
  {
    id: "2", 
    receivable_number: "REC-2025-002",
    order_number: "ORD-2025-002",
    project_name: "OO지역 토양오염 정화공사",
    company_name: "육군5378부대",
    client_type: "government",
    contract_amount: 85105000,
    paid_amount: 0,             // 미수금
    remaining_amount: 85105000,
    due_date: "2025-04-26",     // 향후 만료
    payment_status: "unpaid",
    overdue_days: 0,
    overdue_level: "normal",
    primary_manager: "이대룡"
  },
  {
    id: "3",
    receivable_number: "REC-2021-003", 
    order_number: "ORD-2021-003",
    project_name: "광명시흥 일반산업단지 토양오염 정화용역",
    company_name: "한국토지주택공사",
    client_type: "private",
    contract_amount: 4957675600,
    paid_amount: 4957675600,    // 완료
    remaining_amount: 0,
    due_date: "2021-07-14",
    payment_status: "paid",
    overdue_days: 0,
    overdue_level: "normal", 
    primary_manager: "박찬수"
  },
  {
    id: "4",
    receivable_number: "REC-2024-004",
    order_number: "ORD-2024-004",
    project_name: "숭인지하차도 연결도로 오염토양 정화처리용역",
    company_name: "인천광역시 종합건설본부",
    client_type: "government",
    contract_amount: 12759450,
    paid_amount: 0,             // 연체
    remaining_amount: 12759450,
    due_date: "2024-09-25",     // 62일 연체 (주의 단계)
    payment_status: "overdue",
    overdue_days: 62,
    overdue_level: "warning",
    primary_manager: "최진우",
    last_contact_date: "2024-11-01",
    next_contact_date: "2024-11-30"
  },
  {
    id: "5",
    receivable_number: "REC-2024-005",
    order_number: "ORD-2023-015",
    project_name: "구)○○공장 부지 토양오염 정화공사",
    company_name: "○○화학 주식회사",
    client_type: "private",
    contract_amount: 180000000,
    paid_amount: 50000000,      // 장기 연체
    remaining_amount: 130000000,
    due_date: "2024-01-15",     // 315일 연체 (부실 단계)
    payment_status: "overdue",
    overdue_days: 315,
    overdue_level: "bad",
    primary_manager: "김판근",
    last_contact_date: "2024-10-15",
    next_contact_date: "2024-12-01"
  }
]

export default function ReceivablesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all")
  const [overdueFilter, setOverdueFilter] = useState<string>("all")
  const [isPaymentRecordOpen, setIsPaymentRecordOpen] = useState(false)
  const [receivables, setReceivables] = useState<Receivable[]>(receivablesData)

  // 필터링된 데이터
  const filteredReceivables = receivables.filter(receivable => {
    const matchesSearch = 
      receivable.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receivable.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receivable.receivable_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receivable.order_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || receivable.payment_status === statusFilter
    const matchesClientType = clientTypeFilter === "all" || receivable.client_type === clientTypeFilter
    const matchesOverdue = overdueFilter === "all" || receivable.overdue_level === overdueFilter

    return matchesSearch && matchesStatus && matchesClientType && matchesOverdue
  })

  // 통계 계산
  const stats = {
    total: receivables.length,
    total_amount: receivables.reduce((sum, r) => sum + r.contract_amount, 0),
    paid_amount: receivables.reduce((sum, r) => sum + r.paid_amount, 0),
    remaining_amount: receivables.reduce((sum, r) => sum + r.remaining_amount, 0),
    overdue_amount: receivables.filter(r => r.payment_status === 'overdue').reduce((sum, r) => sum + r.remaining_amount, 0),
    collection_rate: 0,
    by_status: {
      unpaid: receivables.filter(r => r.payment_status === "unpaid").length,
      partial: receivables.filter(r => r.payment_status === "partial").length,
      paid: receivables.filter(r => r.payment_status === "paid").length,
      overdue: receivables.filter(r => r.payment_status === "overdue").length,
    },
    by_client_type: {
      government: receivables.filter(r => r.client_type === "government").length,
      private: receivables.filter(r => r.client_type === "private").length,
    },
    by_overdue_level: {
      normal: receivables.filter(r => r.overdue_level === "normal").length,
      warning: receivables.filter(r => r.overdue_level === "warning").length,
      longterm: receivables.filter(r => r.overdue_level === "longterm").length,
      bad: receivables.filter(r => r.overdue_level === "bad").length,
    }
  }

  // 수금률 계산
  stats.collection_rate = stats.total_amount > 0 
    ? Math.round((stats.paid_amount / stats.total_amount) * 100) 
    : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  // 연체일수 업데이트 (실제로는 매일 자동 업데이트 되어야 함)
  const updateOverdueStatus = (receivable: Receivable) => {
    const overdueDays = calculateOverdueDays(receivable.due_date)
    const overdueLevel = calculateOverdueLevel(overdueDays)
    return {
      ...receivable,
      overdue_days: overdueDays,
      overdue_level: overdueLevel,
      payment_status: overdueDays > 0 && receivable.remaining_amount > 0 ? 'overdue' as PaymentStatus : receivable.payment_status
    }
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">채권 관리</h1>
          <p className="text-gray-600 mt-1">토양정화 프로젝트 미수금 및 수금 현황을 관리하세요</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isPaymentRecordOpen} onOpenChange={setIsPaymentRecordOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <DollarSign className="mr-2 h-4 w-4" />
                입금 처리
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>입금 처리</DialogTitle>
                <DialogDescription>
                  새로운 입금 내역을 등록하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="text-center text-gray-500 py-4">
                입금 처리 폼은 다음 단계에서 구현 예정입니다.
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 채권</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}건</div>
            <div className="text-sm text-gray-500">{formatCurrency(stats.total_amount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">수금완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.paid_amount)}</div>
            <div className="text-sm text-green-500">수금률 {stats.collection_rate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">미수금</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.remaining_amount)}</div>
            <div className="text-sm text-blue-500">{stats.by_status.unpaid + stats.by_status.partial}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">연체금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue_amount)}</div>
            <div className="text-sm text-red-500">{stats.by_status.overdue}건 연체</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">부실채권</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{stats.by_overdue_level.bad}건</div>
            <div className="text-sm text-red-600">181일+ 연체</div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            검색 및 필터
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="프로젝트명, 업체명, 채권번호로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="민관구분" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="government">관수</SelectItem>
                <SelectItem value="private">민수</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="결제상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="unpaid">미수</SelectItem>
                <SelectItem value="partial">부분수금</SelectItem>
                <SelectItem value="paid">완료</SelectItem>
                <SelectItem value="overdue">연체</SelectItem>
              </SelectContent>
            </Select>

            <Select value={overdueFilter} onValueChange={setOverdueFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="연체수준" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="normal">정상</SelectItem>
                <SelectItem value="warning">주의</SelectItem>
                <SelectItem value="longterm">장기</SelectItem>
                <SelectItem value="bad">부실</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 채권 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>채권 목록</CardTitle>
          <CardDescription>
            총 {filteredReceivables.length}건의 채권이 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>채권번호</TableHead>
                  <TableHead>민관구분</TableHead>
                  <TableHead>업체명</TableHead>
                  <TableHead>프로젝트명</TableHead>
                  <TableHead>계약금액</TableHead>
                  <TableHead>미수금액</TableHead>
                  <TableHead>결제상태</TableHead>
                  <TableHead>연체수준</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceivables.map((receivable) => {
                  const updated = updateOverdueStatus(receivable)
                  return (
                    <TableRow key={receivable.id}>
                      <TableCell className="font-mono text-sm">{receivable.receivable_number}</TableCell>
                      <TableCell>
                        <Badge className={CLIENT_TYPE_COLORS[receivable.client_type]}>
                          {CLIENT_TYPE_LABELS[receivable.client_type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {receivable.company_name}
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        <div className="truncate" title={receivable.project_name}>
                          {receivable.project_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          수주: {receivable.order_number}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(receivable.contract_amount)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className={receivable.remaining_amount > 0 ? "text-red-600" : "text-green-600"}>
                          {formatCurrency(receivable.remaining_amount)}
                        </div>
                        {receivable.paid_amount > 0 && (
                          <div className="text-xs text-gray-500">
                            입금: {formatCurrency(receivable.paid_amount)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={PAYMENT_STATUS_COLORS[updated.payment_status]}>
                          {PAYMENT_STATUS_LABELS[updated.payment_status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={OVERDUE_LEVEL_COLORS[updated.overdue_level]}>
                          {OVERDUE_LEVEL_LABELS[updated.overdue_level]}
                        </Badge>
                        {updated.overdue_days > 0 && (
                          <div className="text-xs text-red-500 mt-1">
                            {updated.overdue_days}일 연체
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className={updated.overdue_days > 0 ? "text-red-600 font-medium" : ""}>
                          {formatDate(receivable.due_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{receivable.primary_manager}</div>
                          {receivable.last_contact_date && (
                            <div className="text-xs text-gray-500">
                              최근: {formatDate(receivable.last_contact_date)}
                            </div>
                          )}
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
                              alert(`${receivable.receivable_number} 상세보기 기능은 다음 단계에서 구현됩니다.`)
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
                              setIsPaymentRecordOpen(true)
                            }}>
                              <CreditCard className="mr-2 h-4 w-4" />
                              입금 처리
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}