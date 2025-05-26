// src/app/orders/page.tsx
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
  Edit, 
  MoreHorizontal,
  MapPin,
  Users
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 타입 정의 (페이지 내부에서 정의)
type ClientType = 'government' | 'private'
type OrderStatus = 'contracted' | 'in_progress' | 'completed' | 'cancelled'
type OrderType = 'new' | 'change1' | 'change2' | 'change3'
type TransportType = 'onsite' | 'transport'

interface Company {
  id: string
  company_name: string
  company_type: ClientType
  industry: string
  status: string
  credit_rating: string
  created_at: string
  updated_at: string
}

interface Employee {
  id: string
  employee_number: string
  name: string
  department: string
  role: string
  status: string
  created_at: string
  updated_at: string
}

interface Order {
  id: string
  order_number: string
  company_id: string
  project_name: string
  client_type: ClientType
  contract_date?: string
  contract_amount: number
  tax_amount: number
  total_amount: number
  order_type: OrderType
  original_order_id?: string
  transport_type?: TransportType
  remediation_method?: string
  contamination_info?: string
  verification_company?: string
  status: OrderStatus
  priority: string
  progress_percentage: number
  created_at: string
  updated_at: string
  notes?: string
  company?: Company
  primary_manager?: Employee
  secondary_manager?: Employee
}

// 라벨 상수
const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  government: '관수',
  private: '민수'
}

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  new: '신규',
  change1: '1차 변경',
  change2: '2차 변경',
  change3: '3차 변경'
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  contracted: '계약',
  in_progress: '진행중',
  completed: '완료',
  cancelled: '취소'
}

const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  onsite: '부지내',
  transport: '반출'
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  contracted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800', 
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  government: 'bg-purple-100 text-purple-800',
  private: 'bg-cyan-100 text-cyan-800'
}

// 실제 엑셀 데이터 기반 임시 데이터
const ordersData: Order[] = [
  {
    id: "1",
    order_number: "ORD-2024-001",
    company_id: "comp1",
    project_name: "24-A-OO부대 토양오염정화공사(1517)",
    client_type: "government",
    contract_date: "2024-11-28",
    contract_amount: 1063758000,
    tax_amount: 106375800,
    total_amount: 1170133800,
    order_type: "new",
    transport_type: "onsite",
    remediation_method: "토양경작법",
    contamination_info: "",
    verification_company: "",
    status: "in_progress",
    priority: "normal",
    progress_percentage: 65,
    created_at: "2024-11-28T00:00:00Z",
    updated_at: "2024-11-28T00:00:00Z",
    company: { 
      id: "comp1", 
      company_name: "제2218부대", 
      company_type: "government",
      industry: "국방부",
      status: "active",
      credit_rating: "A",
      created_at: "",
      updated_at: ""
    },
    primary_manager: { 
      id: "emp1", 
      employee_number: "EMP-001",
      name: "이대룡", 
      department: "기술부",
      role: "engineer",
      status: "active",
      created_at: "",
      updated_at: ""
    },
    secondary_manager: { 
      id: "emp2", 
      employee_number: "EMP-002",
      name: "백승호", 
      department: "기술부",
      role: "engineer",
      status: "active",
      created_at: "",
      updated_at: ""
    }
  },
  {
    id: "2",
    order_number: "ORD-2025-002",
    company_id: "comp2",
    project_name: "OO지역 토양오염 정화공사",
    client_type: "government",
    contract_date: "2025-03-27",
    contract_amount: 85105000,
    tax_amount: 8510500,
    total_amount: 93615500,
    order_type: "new",
    transport_type: "transport",
    remediation_method: "",
    contamination_info: "",
    verification_company: "",
    status: "contracted",
    priority: "normal",
    progress_percentage: 0,
    created_at: "2025-03-27T00:00:00Z",
    updated_at: "2025-03-27T00:00:00Z",
    company: { 
      id: "comp2", 
      company_name: "육군5378부대", 
      company_type: "government",
      industry: "국방부",
      status: "active",
      credit_rating: "A",
      created_at: "",
      updated_at: ""
    },
    primary_manager: { 
      id: "emp1", 
      employee_number: "EMP-001",
      name: "이대룡", 
      department: "기술부",
      role: "engineer",
      status: "active",
      created_at: "",
      updated_at: ""
    },
    secondary_manager: { 
      id: "emp2", 
      employee_number: "EMP-002",
      name: "백승호", 
      department: "기술부",
      role: "engineer",
      status: "active",
      created_at: "",
      updated_at: ""
    }
  },
  {
    id: "3",
    order_number: "ORD-2021-003",
    company_id: "comp3",
    project_name: "광명시흥 일반산업단지 및 유통단지 토양오염 정화용역",
    client_type: "private",
    contract_date: "2021-05-14",
    contract_amount: 4957675600,
    tax_amount: 495767560,
    total_amount: 5453443160,
    order_type: "new",
    transport_type: "transport",
    remediation_method: "토양세척법",
    contamination_info: "",
    verification_company: "울산과학대학교 산학협력단",
    status: "completed",
    priority: "high",
    progress_percentage: 100,
    created_at: "2021-05-14T00:00:00Z",
    updated_at: "2021-05-14T00:00:00Z",
    company: { 
      id: "comp3", 
      company_name: "한국토지주택공사", 
      company_type: "private",
      industry: "건설업",
      status: "active",
      credit_rating: "A+",
      created_at: "",
      updated_at: ""
    },
    primary_manager: { 
      id: "emp3", 
      employee_number: "EMP-003",
      name: "박찬수", 
      department: "기술부",
      role: "engineer",
      status: "active",
      created_at: "",
      updated_at: ""
    }
  },
  {
    id: "4",
    order_number: "ORD-2024-004",
    company_id: "comp4",
    project_name: "숭인지하차도 및 연결도로 건설공사 오염토양 정화처리용역",
    client_type: "government",
    contract_date: "2024-10-25",
    contract_amount: 12759450,
    tax_amount: 1275945,
    total_amount: 14035395,
    order_type: "new",
    transport_type: "transport",
    remediation_method: "토양경작법, 토양세척법",
    contamination_info: "TPH(3,915mg/kg)",
    verification_company: "재단법인 경기환경과학연구원",
    status: "in_progress",
    priority: "normal",
    progress_percentage: 40,
    created_at: "2024-10-25T00:00:00Z",
    updated_at: "2024-10-25T00:00:00Z",
    company: { 
      id: "comp4", 
      company_name: "인천광역시 종합건설본부", 
      company_type: "government",
      industry: "공공기관",
      status: "active",
      credit_rating: "A",
      created_at: "",
      updated_at: ""
    },
    primary_manager: { 
      id: "emp4", 
      employee_number: "EMP-004",
      name: "최진우", 
      department: "기술부",
      role: "engineer",
      status: "active",
      created_at: "",
      updated_at: ""
    }
  },
  {
    id: "5",
    order_number: "ORD-2025-005",
    company_id: "comp4",
    project_name: "숭인지하차도 및 연결도로 건설공사 오염토양 정화처리용역",
    client_type: "government",
    contract_date: "2025-01-16",
    contract_amount: 5983450,
    tax_amount: 598345,
    total_amount: 6581795,
    order_type: "change1",
    original_order_id: "4",
    transport_type: "transport",
    remediation_method: "토양경작법, 토양세척법",
    contamination_info: "TPH(3,915mg/kg)",
    verification_company: "재단법인 경기환경과학연구원",
    status: "contracted",
    priority: "normal",
    progress_percentage: 0,
    created_at: "2025-01-16T00:00:00Z",
    updated_at: "2025-01-16T00:00:00Z",
    company: { 
      id: "comp4", 
      company_name: "인천광역시 종합건설본부", 
      company_type: "government",
      industry: "공공기관",
      status: "active",
      credit_rating: "A",
      created_at: "",
      updated_at: ""
    },
    primary_manager: { 
      id: "emp4", 
      employee_number: "EMP-004",
      name: "최진우", 
      department: "기술부",
      role: "engineer",
      status: "active",
      created_at: "",
      updated_at: ""
    }
  }
]

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [clientTypeFilter, setClientTypeFilter] = useState<string>("all")
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all")
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [orders, setOrders] = useState<Order[]>(ordersData)

  // 새 수주 등록 처리 (임시)
  const handleNewOrder = async () => {
    try {
      // 임시 수주 데이터 생성
      const newOrder: Order = {
        id: String(orders.length + 1),
        order_number: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`,
        company_id: "comp1",
        project_name: "새로운 토양정화 프로젝트",
        client_type: "government",
        contract_date: new Date().toISOString().split('T')[0],
        contract_amount: 10000000,
        tax_amount: 1000000,
        total_amount: 11000000,
        order_type: "new",
        transport_type: "transport",
        remediation_method: "토양경작법",
        contamination_info: "",
        verification_company: "",
        status: "contracted",
        priority: "normal",
        progress_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        company: {
          id: "comp1",
          company_name: "테스트 회사",
          company_type: "government",
          industry: "공공기관",
          status: "active",
          credit_rating: "A",
          created_at: "",
          updated_at: ""
        }
      }

      setOrders(prev => [...prev, newOrder])
      setIsNewOrderOpen(false)
      alert("새 수주가 성공적으로 등록되었습니다!")
    } catch (error) {
      console.error("수주 등록 오류:", error)
      alert("수주 등록 중 오류가 발생했습니다.")
    }
  }

  // 필터링된 데이터
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.company?.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesClientType = clientTypeFilter === "all" || order.client_type === clientTypeFilter
    const matchesOrderType = orderTypeFilter === "all" || order.order_type === orderTypeFilter
    
    return matchesSearch && matchesStatus && matchesClientType && matchesOrderType
  })

  // 통계 계산
  const stats = {
    total: orders.length,
    by_status: {
      contracted: orders.filter(o => o.status === "contracted").length,
      in_progress: orders.filter(o => o.status === "in_progress").length,
      completed: orders.filter(o => o.status === "completed").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
    },
    by_client_type: {
      government: orders.filter(o => o.client_type === "government").length,
      private: orders.filter(o => o.client_type === "private").length,
    },
    total_amount: orders.reduce((sum, order) => sum + order.contract_amount, 0)
  }

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

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">수주 관리</h1>
          <p className="text-gray-600 mt-1">토양오염정화공사 수주 현황을 관리하세요</p>
        </div>
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              새 수주 등록
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>새 수주 등록</DialogTitle>
              <DialogDescription>
                새로운 토양정화 프로젝트 수주 정보를 입력하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center text-gray-500">
                수주 등록 폼은 다음 단계에서 구현 예정입니다.
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleNewOrder}>
                  임시 등록
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 수주</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}건</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">관수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.by_client_type.government}건</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">민수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{stats.by_client_type.private}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">진행중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.by_status.in_progress}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.by_status.completed}건</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">총 수주액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(stats.total_amount)}
            </div>
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
                placeholder="공사명, 계약업체, 수주번호로 검색..."
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
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 상태</SelectItem>
                <SelectItem value="contracted">계약</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>
            <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="구분" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="new">신규</SelectItem>
                <SelectItem value="change1">1차 변경</SelectItem>
                <SelectItem value="change2">2차 변경</SelectItem>
                <SelectItem value="change3">3차 변경</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 수주 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>수주 목록</CardTitle>
          <CardDescription>
            총 {filteredOrders.length}건의 수주가 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>수주번호</TableHead>
                  <TableHead>민관구분</TableHead>
                  <TableHead>계약업체</TableHead>
                  <TableHead>공사명</TableHead>
                  <TableHead>구분</TableHead>
                  <TableHead>계약금액</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>반출여부</TableHead>
                  <TableHead>담당자</TableHead>
                  <TableHead>계약일자</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                    <TableCell>
                      <Badge className={CLIENT_TYPE_COLORS[order.client_type]}>
                        {CLIENT_TYPE_LABELS[order.client_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {order.company?.company_name || '-'}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={order.project_name}>
                        {order.project_name}
                      </div>
                      {order.remediation_method && (
                        <div className="text-xs text-gray-500 mt-1">
                          정화: {order.remediation_method}
                        </div>
                      )}
                      {order.contamination_info && (
                        <div className="text-xs text-orange-600 mt-1">
                          오염: {order.contamination_info}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        order.order_type === 'new' ? 'bg-blue-50 text-blue-700' :
                        'bg-orange-50 text-orange-700'
                      }>
                        {ORDER_TYPE_LABELS[order.order_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.contract_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.transport_type && (
                        <Badge variant="outline" className={
                          order.transport_type === 'onsite' ? 'bg-green-50 text-green-700' :
                          'bg-amber-50 text-amber-700'
                        }>
                          <MapPin className="mr-1 h-3 w-3" />
                          {TRANSPORT_TYPE_LABELS[order.transport_type]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{order.primary_manager?.name || '-'}</div>
                        {order.secondary_manager && (
                          <div className="text-gray-500">/ {order.secondary_manager.name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(order.contract_date)}
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
                            alert(`${order.order_number} 상세보기 기능은 다음 단계에서 구현됩니다.`)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            상세보기
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            alert(`${order.order_number} 수정 기능은 다음 단계에서 구현됩니다.`)
                          }}>
                            <Edit className="mr-2 h-4 w-4" />
                            수정하기
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => {
                              if (confirm("정말로 이 수주를 삭제하시겠습니까?")) {
                                setOrders(prev => prev.filter(o => o.id !== order.id))
                                alert("수주가 삭제되었습니다.")
                              }
                            }}
                          >
                            삭제하기
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}