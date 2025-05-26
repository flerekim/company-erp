// src/app/orders/page.tsx
// 수주 관리 페이지 (폼 기능 추가)

"use client"

import { useState, useEffect } from "react"
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
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Download,
  Upload
} from "lucide-react"
import { Order, OrderFormData, ClientType, OrderStatus, OrderType } from "@/types/order"
import { OrderForm } from "@/components/forms/order-form"
import { orderService } from "@/lib/supabase/database"

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderType | "all">("all")
  
  // 다이얼로그 상태
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false)
  const [ordersList, setOrdersList] = useState<Order[]>([])

  // Supabase에서 수주 데이터 가져오기
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const data = await orderService.getAll()
        setOrdersList(data)
      } catch (error) {
        console.error('수주 데이터 조회 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

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

  const getClientTypeBadge = (type: ClientType) => {
    return type === 'government' 
      ? 'bg-purple-100 text-purple-800'
      : 'bg-cyan-100 text-cyan-800'
  }

  const getStatusBadge = (status: OrderStatus) => {
    const statusColors = {
      contracted: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return statusColors[status]
  }

  const getTransportTypeBadge = (type: string) => {
    return type === 'onsite'
      ? 'bg-green-50 text-green-700'
      : 'bg-amber-50 text-amber-700'
  }

  const getOrderTypeLabel = (type: OrderType) => {
    const labels = {
      new: '신규',
      change1: '1차변경',
      change2: '2차변경',
      change3: '3차변경'
    }
    return labels[type]
  }

  const getStatusLabel = (status: OrderStatus) => {
    const labels = {
      contracted: '계약',
      in_progress: '진행중',
      completed: '완료',
      cancelled: '취소'
    }
    return labels[status]
  }

  const filteredOrders = ordersList.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.company_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClientType = clientTypeFilter === "all" || order.client_type === clientTypeFilter
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesOrderType = orderTypeFilter === "all" || order.order_type === orderTypeFilter

    return matchesSearch && matchesClientType && matchesStatus && matchesOrderType
  })

  // 새 수주 등록
  const handleCreateOrder = () => {
    setFormMode('create')
    setSelectedOrder(null)
    setIsFormDialogOpen(true)
  }

  // 수주 수정
  const handleEditOrder = (order: Order) => {
    setFormMode('edit')
    setSelectedOrder(order)
    setIsFormDialogOpen(true)
  }

  // 수주 삭제 확인
  const handleDeleteConfirm = (order: Order) => {
    setSelectedOrder(order)
    setIsDeleteDialogOpen(true)
  }

  // 폼 제출 처리
  const handleFormSubmit = async (data: OrderFormData) => {
    try {
      setIsLoading(true)
      if (formMode === 'create') {
        // 수주번호 자동 생성
        const { data: lastOrder } = await orderService.getLastOrder()
        let nextNumber = 1
        if (lastOrder) {
          const lastNumber = parseInt(lastOrder.order_number.split('-')[2])
          nextNumber = lastNumber + 1
        }
        const order_number = `ORD-${new Date().getFullYear()}-${nextNumber.toString().padStart(3, '0')}`

        // 새 수주 생성
        await orderService.create({
          ...data,
          order_number,
          status: 'contracted',
          progress_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      } else if (formMode === 'edit' && selectedOrder) {
        // 수주 수정
        await orderService.update(selectedOrder.id, {
          ...data,
          updated_at: new Date().toISOString()
        })
      }

      // 목록 새로고침
      const updatedOrders = await orderService.getAll()
      setOrdersList(updatedOrders)
      setIsFormDialogOpen(false)
    } catch (error) {
      console.error('수주 저장 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 수주 삭제
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return

    try {
      setIsLoading(true)
      await orderService.delete(selectedOrder.id)
      
      // 목록 새로고침
      const updatedOrders = await orderService.getAll()
      setOrdersList(updatedOrders)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('수주 삭제 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">수주 관리</h1>
        <Button onClick={handleCreateOrder}>
          <Plus className="h-4 w-4 mr-2" />
          새 수주 등록
        </Button>
      </div>

      {/* 통계 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 수주</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}건</div>
            <div className="text-sm text-gray-500">
              {formatCurrency(filteredOrders.reduce((sum, o) => sum + o.contract_amount, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">진행중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredOrders.filter(o => o.status === 'in_progress').length}건
            </div>
            <div className="text-sm text-yellow-500">
              {Math.round((filteredOrders.filter(o => o.status === 'in_progress').length / filteredOrders.length) * 100) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredOrders.filter(o => o.status === 'completed').length}건
            </div>
            <div className="text-sm text-green-500">
              {Math.round((filteredOrders.filter(o => o.status === 'completed').length / filteredOrders.length) * 100) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">관수/민수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-purple-600">관수:</span>
                <span className="font-medium">{filteredOrders.filter(o => o.client_type === 'government').length}건</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-600">민수:</span>
                <span className="font-medium">{filteredOrders.filter(o => o.client_type === 'private').length}건</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
          <CardDescription>수주 검색 및 필터링</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="수주번호, 프로젝트명, 고객사 검색"
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

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="프로젝트 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="contracted">계약</SelectItem>
                <SelectItem value="in_progress">진행중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
                <SelectItem value="cancelled">취소</SelectItem>
              </SelectContent>
            </Select>

            <Select value={orderTypeFilter} onValueChange={(value) => setOrderTypeFilter(value as OrderType | "all")}>
              <SelectTrigger>
                <SelectValue placeholder="수주 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="new">신규</SelectItem>
                <SelectItem value="change1">1차변경</SelectItem>
                <SelectItem value="change2">2차변경</SelectItem>
                <SelectItem value="change3">3차변경</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 수주 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>수주 목록</CardTitle>
          <CardDescription>총 {filteredOrders.length}건의 수주</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>수주번호</TableHead>
                <TableHead>고객사</TableHead>
                <TableHead>프로젝트명</TableHead>
                <TableHead>계약금액</TableHead>
                <TableHead>정화방법</TableHead>
                <TableHead>처리방식</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>진행률</TableHead>
                <TableHead>담당자</TableHead>
                <TableHead className="text-right">액션</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">
                    <div className="space-y-1">
                      <div>{order.order_number}</div>
                      <Badge variant="outline" className="text-xs">
                        {getOrderTypeLabel(order.order_type)}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={getClientTypeBadge(order.client_type)}>
                        {order.client_type === 'government' ? '관수' : '민수'}
                      </Badge>
                      <div className="text-sm">{order.company_name}</div>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-[300px]">
                    <div className="space-y-1">
                      <div className="truncate font-medium" title={order.project_name}>
                        {order.project_name}
                      </div>
                      <div className="text-xs text-gray-500">{order.contamination_info}</div>
                    </div>
                  </TableCell>

                  <TableCell className="font-medium">
                    {formatCurrency(order.contract_amount)}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">{order.remediation_method}</div>
                  </TableCell>

                  <TableCell>
                    <Badge className={getTransportTypeBadge(order.transport_type)}>
                      {order.transport_type === 'onsite' ? '부지내' : '반출'}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge className={getStatusBadge(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{order.progress_percentage}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${order.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{order.primary_manager}</div>
                      {order.secondary_manager && (
                        <div className="text-gray-500">{order.secondary_manager}</div>
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
                        <DropdownMenuItem onClick={() => alert('상세보기 기능 준비중')}>
                          <Eye className="mr-2 h-4 w-4" />
                          상세보기
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => alert('파일 관리 기능 준비중')}>
                          <FileText className="mr-2 h-4 w-4" />
                          파일 관리
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteConfirm(order)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
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

      {/* 수주 등록/수정 다이얼로그 */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? '새 수주 등록' : '수주 정보 수정'}
            </DialogTitle>
            <DialogDescription>
              토양오염정화공사 프로젝트의 상세 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <OrderForm
            order={selectedOrder || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>수주 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 수주를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              <br />
              <br />
              <strong>수주번호:</strong> {selectedOrder?.order_number}
              <br />
              <strong>프로젝트명:</strong> {selectedOrder?.project_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOrder}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}