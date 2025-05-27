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
  Upload,
  Loader2,
  Calendar
} from "lucide-react"
import { Order, OrderFormData, ClientType, OrderStatus, OrderType, OrderFile } from "@/types/order"
import { OrderForm } from "@/components/forms/order-form"
import { orderService } from "@/lib/supabase/database"

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderType | "all">("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: ""
  })
  
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

    // 기간 필터 적용
    const orderDate = new Date(order.contract_date)
    const matchesDateRange = 
      (!dateRangeFilter.startDate || orderDate >= new Date(dateRangeFilter.startDate)) &&
      (!dateRangeFilter.endDate || orderDate <= new Date(dateRangeFilter.endDate))

    return matchesSearch && matchesClientType && matchesStatus && matchesOrderType && matchesDateRange
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
  const handleFormSubmit = async (data: OrderFormData, files: File[]) => {
    try {
      setIsLoading(true)

      // 2. 수주 데이터 Supabase에 저장 (파일 정보 포함)
      if (formMode === 'create') {
        // 수주번호 자동 생성
        const { data: lastOrder } = await orderService.getLastOrder()
        let nextNumber = 1
        if (lastOrder) {
          const lastNumber = parseInt(lastOrder.order_number.split('-')[2])
          nextNumber = lastNumber + 1
        }
        const order_number = `ORD-${new Date().getFullYear()}-${nextNumber.toString().padStart(3, '0')}`

        // 새 수주 생성 (파일 정보 제외)
        const createdOrder = await orderService.create({
          ...data,
          order_number,
          status: 'contracted',
          progress_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // attachments는 나중에 업데이트
        })

        let uploadedFileDetails: OrderFile[] = []

        // 파일 Supabase Storage에 업로드 (생성된 수주 ID 사용)
        if (files && files.length > 0 && createdOrder?.id) {
          for (const file of files) {
            const encodedFileName = encodeURIComponent(file.name)
            const filePath = `${createdOrder.id}/${Date.now()}-${encodedFileName}` // 생성된 수주 ID와 인코딩된 파일명 사용 (버킷 이름 제거)
            const { data: uploadData } = await orderService.uploadFile(filePath, file)

            // 업로드 성공 시 파일 정보 저장
            uploadedFileDetails.push({
              id: uploadData.id, // Supabase Storage에서 반환하는 고유 ID (가정)
              order_id: createdOrder.id, // 생성된 수주 ID 사용
              file_name: file.name,
              file_type: 'other', // TODO: 파일 확장자 등으로 타입 구분 로직 추가
              file_size: file.size,
              file_url: uploadData.url, // Supabase Storage에서 반환하는 파일 URL (가정)
              uploaded_at: new Date().toISOString(),
              uploaded_by: 'current_user_id', // TODO: 현재 로그인한 사용자 ID 가져오는 로직 추가
            })
          }

          // 수주 데이터에 파일 정보 업데이트
          await orderService.update(createdOrder.id, {
            attachments: uploadedFileDetails
          })
        }

      } else if (formMode === 'edit' && selectedOrder) {
        // 기존 첨부 파일 가져오기 (수정 시 기존 파일 유지 및 새 파일 추가)
        const existingAttachments = selectedOrder.attachments || [];
        let uploadedFileDetails: OrderFile[] = []

        // 파일 Supabase Storage에 업로드 (기존 수주 ID 사용)
        if (files && files.length > 0) {
          for (const file of files) {
            const encodedFileName = encodeURIComponent(file.name)
            const filePath = `${selectedOrder.id}/${Date.now()}-${encodedFileName}` // 기존 수주 ID와 인코딩된 파일명 사용 (버킷 이름 제거)
            const { data: uploadData } = await orderService.uploadFile(filePath, file)

            // 업로드 성공 시 파일 정보 저장
            uploadedFileDetails.push({
              id: uploadData.id, // Supabase Storage에서 반환하는 고유 ID (가정)
              order_id: selectedOrder.id, // 기존 수주 ID 사용
              file_name: file.name,
              file_type: 'other', // TODO: 파일 확장자 등으로 타입 구분 로직 추가
              file_size: file.size,
              file_url: uploadData.url, // Supabase Storage에서 반환하는 파일 URL (가정)
              uploaded_at: new Date().toISOString(),
              uploaded_by: 'current_user_id', // TODO: 현재 로그인한 사용자 ID 가져오는 로직 추가
            })
          }
        }

        const allAttachments = [...existingAttachments, ...uploadedFileDetails];

        // 수주 수정 (파일 정보 업데이트)
        await orderService.update(selectedOrder.id, {
          ...data,
          updated_at: new Date().toISOString(),
          attachments: allAttachments // 파일 정보 업데이트
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
    <div className="p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">수주 관리</h1>
          <p className="text-gray-600 mt-1">등록된 수주 목록을 확인하고 관리합니다.</p>
        </div>
        <Button onClick={handleCreateOrder}>
          <Plus className="mr-2 h-4 w-4" />
          새 수주 등록
        </Button>
      </div>

      {/* 검색 및 필터 영역 */}
      <Card>
        <CardContent className="pt-2 pb-2">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* 검색 필드 - 남은 공간 차지 */}
            <div className="flex-1 w-full">
              <Input
                placeholder="수주번호, 프로젝트명, 회사명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* 기간 필터 및 셀렉트 필터 그룹 */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* 기간 필터 */}
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">계약일</span>
                <Input
                  type="date"
                  value={dateRangeFilter.startDate}
                  onChange={(e) => setDateRangeFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-[140px]"
                />
                <span className="text-gray-500">~</span>
                <Input
                  type="date"
                  value={dateRangeFilter.endDate}
                  onChange={(e) => setDateRangeFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-[140px]"
                />
              </div>

              {/* 셀렉트 필터들 */}
              <div className="flex flex-wrap gap-4 items-center">
                <Select
                  value={clientTypeFilter}
                  onValueChange={(value: ClientType | "all") => setClientTypeFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="거래처 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 거래처 유형</SelectItem>
                    <SelectItem value="government">관급</SelectItem>
                    <SelectItem value="private">민간</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(value: OrderStatus | "all") => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="contracted">계약</SelectItem>
                    <SelectItem value="in_progress">진행중</SelectItem>
                    <SelectItem value="completed">완료</SelectItem>
                    <SelectItem value="cancelled">취소</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={orderTypeFilter}
                  onValueChange={(value: OrderType | "all") => setOrderTypeFilter(value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="수주 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 수주 유형</SelectItem>
                    <SelectItem value="new">신규</SelectItem>
                    <SelectItem value="change1">1차 변경</SelectItem>
                    <SelectItem value="change2">2차 변경</SelectItem>
                    <SelectItem value="change3">3차 변경</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 수주 목록 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>수주 목록</CardTitle>
          <CardDescription>등록된 총 {ordersList.length}건의 수주</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center text-gray-500">해당 조건에 맞는 수주가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="text-lg">
                  <TableRow>
                    <TableHead>상태</TableHead>
                    <TableHead>고객사 유형</TableHead>
                    <TableHead>거래처</TableHead>
                    <TableHead className="w-[200px]">프로젝트명</TableHead>
                    <TableHead className="text-right whitespace-nowrap">계약금액(V.A.T 포함)</TableHead>
                    <TableHead className="pl-12">수주유형</TableHead>
                    <TableHead>계약일</TableHead>
                    <TableHead className="text-center">현장/운반</TableHead>
                    <TableHead className="text-right">파일</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-base">
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Badge className={getStatusBadge(order.status)}>{getStatusLabel(order.status)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getClientTypeBadge(order.client_type)}>
                          {order.client_type === 'government' ? '관급' : '민간'}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.company_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{order.project_name}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatCurrency(order.contract_amount)}</TableCell>
                      <TableCell className="pl-12">{getOrderTypeLabel(order.order_type)}</TableCell>
                      <TableCell>{formatDate(order.contract_date)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getTransportTypeBadge(order.transport_type)}>{order.transport_type === 'onsite' ? '현장' : '운반'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {/* 파일 관리 링크 또는 버튼 */}
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-1" /> {order.attachments?.length || 0}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-label="Actions"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>작업</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                              <Edit className="mr-2 h-4 w-4" /> 수정
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteConfirm(order)}>
                              <Trash2 className="mr-2 h-4 w-4" /> 삭제
                            </DropdownMenuItem>
                            {/* 추가 작업 메뉴 */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 수주 등록/수정 다이얼로그 */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[600px] lg:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? '새 수주 등록' : '수주 수정'}</DialogTitle>
            <DialogDescription>
              수주 정보를 입력하거나 수정합니다.
            </DialogDescription>
          </DialogHeader>
          {/* OrderForm 컴포넌트 */}
          <OrderForm
            onSubmit={handleFormSubmit}
            initialData={selectedOrder}
            mode={formMode}
            isLoading={isLoading} // Form 내 로딩 상태 전달
            onClose={() => setIsFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 수주 삭제 확인 다이얼로그 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 수주 정보를 삭제하면 되돌릴 수 없습니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}