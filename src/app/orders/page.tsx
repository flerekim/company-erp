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
import { FileManagerDialog } from "@/components/file-manager/file-manager-dialog"
import { supabase } from "@/lib/supabase/client"
import { FileUploadService } from "@/lib/supabase/file-upload"
import { MainLayout } from "@/components/layout/main-layout"

// 파일 개수를 포함한 Order 타입
interface OrderWithFileCount extends Order {
  fileCount: number
}

export default function OrdersPage() {
  const [filters, setFilters] = useState({
    searchTerm: "",
    clientType: "all" as ClientType | "all",
    status: "all" as OrderStatus | "all",
    orderType: "all" as OrderType | "all",
    dateRange: {
      startDate: "",
      endDate: ""
    }
  })
  
  // 다이얼로그 상태
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false)
  const [ordersList, setOrdersList] = useState<OrderWithFileCount[]>([])

  // Supabase에서 수주 데이터 가져오기
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const data = await orderService.getAll()
        
        // 각 수주별 파일 개수 조회 (안전한 방식)
        const ordersWithFileCount = await Promise.all(
          data.map(async (order) => {
            try {
              const { count, error } = await supabase
                .from('order_files')
                .select('*', { count: 'exact', head: true })
                .eq('order_id', order.id)
              
              if (error) {
                // 테이블 접근 오류는 로그만 남기고 0으로 처리
                console.warn(`파일 개수 조회 실패 for order ${order.id}:`, error.message)
                return {
                  ...order,
                  fileCount: 0
                }
              }
              
              return {
                ...order,
                fileCount: count || 0
              }
            } catch (error: any) {
              // 예외 발생 시에도 0으로 처리하여 앱 실행 중단 방지
              console.warn(`파일 개수 조회 예외 for order ${order.id}:`, error?.message || error)
              return {
                ...order,
                fileCount: 0
              }
            }
          })
        )
        
        setOrdersList(ordersWithFileCount)
      } catch (error: any) {
        console.error('수주 데이터 조회 실패:', error?.message || error)
        // 수주 데이터 조회 실패 시에도 빈 배열로 설정하여 UI 깨짐 방지
        setOrdersList([])
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

  const getTransportTypeLabel = (type: string) => {
    return type === 'onsite' ? '부지내' : '반출'
  }

  const getOrderTypeLabel = (type: OrderType) => {
    const labels = {
      new: '신규',
      change1: '1차변경',
      change2: '2차변경',
      change3: '3차변경',
      change4: '4차변경',
      change5: '5차변경'
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
      order.order_number.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      order.project_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      order.company_name.toLowerCase().includes(filters.searchTerm.toLowerCase())

    const matchesClientType = filters.clientType === "all" || order.client_type === filters.clientType
    const matchesStatus = filters.status === "all" || order.status === filters.status
    const matchesOrderType = filters.orderType === "all" || order.order_type === filters.orderType

    const orderDate = new Date(order.contract_date)
    const matchesDateRange = 
      (!filters.dateRange.startDate || orderDate >= new Date(filters.dateRange.startDate)) &&
      (!filters.dateRange.endDate || orderDate <= new Date(filters.dateRange.endDate))

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
        const orderDataWithoutAttachments = {
          ...data,
          order_number,
          status: 'contracted',
          progress_percentage: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        const createdOrder = await orderService.create(orderDataWithoutAttachments)

        // 파일 업로드 (FileUploadService 사용)
        if (files && files.length > 0 && createdOrder?.id) {
          const uploadResult = await FileUploadService.uploadMultipleFiles(files, createdOrder.id)
          
          if (uploadResult.failCount > 0) {
            console.warn(`${uploadResult.failCount}개 파일 업로드 실패`)
            // 실패한 파일들에 대한 로그
            uploadResult.results.forEach(result => {
              if (!result.success) {
                console.error(`파일 "${result.file.name}" 업로드 실패:`, result.error)
              }
            })
          }
        }

      } else if (formMode === 'edit' && selectedOrder) {
        // 수주 수정
        const updateData = {
          ...data,
          updated_at: new Date().toISOString(),
        }

        await orderService.update(selectedOrder.id, updateData)

        // 파일 업로드 (수정 시에도 새 파일 추가 가능)
        if (files && files.length > 0) {
          const uploadResult = await FileUploadService.uploadMultipleFiles(files, selectedOrder.id)
          
          if (uploadResult.failCount > 0) {
            console.warn(`${uploadResult.failCount}개 파일 업로드 실패`)
          }
        }
      }

      // 목록 새로고침 (파일 개수 포함)
      await refreshOrders()
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
      await refreshOrders()
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('수주 삭제 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 파일 관리 다이얼로그 열기
  const handleFileManager = (order: Order) => {
    setSelectedOrder(order)
    setIsFileManagerOpen(true)
  }

  // 파일 변경 후 수주 목록 새로고침
  const refreshOrders = async () => {
    try {
      const data = await orderService.getAll()
      
      // 각 수주별 파일 개수 조회 (안전한 방식)
      const ordersWithFileCount = await Promise.all(
        data.map(async (order) => {
          try {
            const { count, error } = await supabase
              .from('order_files')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', order.id)
            
            if (error) {
              // 테이블 접근 오류는 로그만 남기고 0으로 처리
              console.warn(`파일 개수 조회 실패 for order ${order.id}:`, error.message)
              return {
                ...order,
                fileCount: 0
              }
            }
            
            return {
              ...order,
              fileCount: count || 0
            }
          } catch (error: any) {
            // 예외 발생 시에도 0으로 처리하여 앱 실행 중단 방지
            console.warn(`파일 개수 조회 예외 for order ${order.id}:`, error?.message || error)
            return {
              ...order,
              fileCount: 0
            }
          }
        })
      )
      
      setOrdersList(ordersWithFileCount)
    } catch (error: any) {
      console.error('수주 목록 새로고침 실패:', error?.message || error)
      // 새로고침 실패 시에도 기존 목록 유지
    }
  }

  return (
    <MainLayout>
      <div className="py-6 px-10">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-4xl font-bold">수주 관리</CardTitle>
                <CardDescription className="text-base mt-1">수주 현황을 조회하고 관리합니다.</CardDescription>
              </div>
              <Button onClick={handleCreateOrder}>
                <Plus className="mr-2 h-4 w-4" />
                새 수주 등록
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* 통합된 필터 섹션 */}
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">검색</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="프로젝트명 또는 거래처명"
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="pl-8 h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">고객사 유형</label>
                    <Select
                      value={filters.clientType}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, clientType: value as ClientType | "all" }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="government">관수</SelectItem>
                        <SelectItem value="private">민수</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">상태</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as OrderStatus | "all" }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="contracted">계약</SelectItem>
                        <SelectItem value="in_progress">진행중</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                        <SelectItem value="cancelled">취소</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">계약일 범위</label>
                    <div className="flex gap-4">
                      <Input
                        type="date"
                        value={filters.dateRange.startDate}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, startDate: e.target.value }
                        }))}
                        className="h-10 min-w-[140px] flex-1"
                      />
                      <Input
                        type="date"
                        value={filters.dateRange.endDate}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, endDate: e.target.value }
                        }))}
                        className="h-10 min-w-[140px] flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 개선된 테이블 레이아웃 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center text-base">상태</TableHead>
                    <TableHead className="w-[100px] text-center text-base">고객사 유형</TableHead>
                    <TableHead className="w-[200px] text-center text-base">프로젝트명</TableHead>
                    <TableHead className="w-[150px] text-center text-base">거래처</TableHead>
                    <TableHead className="w-[150px] text-center text-base">계약금액(V.A.T 포함)</TableHead>
                    <TableHead className="w-[100px] text-center text-base">수주유형</TableHead>
                    <TableHead className="w-[120px] text-center text-base">계약일</TableHead>
                    <TableHead className="w-[100px] text-center text-base">정화 장소</TableHead>
                    <TableHead className="w-[120px] text-center text-base">파일</TableHead>
                    <TableHead className="w-[80px] text-center text-base">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-muted-foreground">데이터를 불러오는 중...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <p className="text-muted-foreground">조회된 수주가 없습니다.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-center">
                          <Badge className={getStatusBadge(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getClientTypeBadge(order.client_type)}>
                            {order.client_type === 'government' ? '관수' : '민수'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center max-w-[200px] truncate">
                          {order.project_name}
                        </TableCell>
                        <TableCell className="text-center">{order.company_name}</TableCell>
                        <TableCell className="text-center">
                          {formatCurrency(order.contract_amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getOrderTypeLabel(order.order_type)}
                        </TableCell>
                        <TableCell className="text-center">{formatDate(order.contract_date)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getTransportTypeBadge(order.transport_type)}>
                            {getTransportTypeLabel(order.transport_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFileManager(order)}
                            className="flex items-center justify-center gap-2 mx-auto"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm text-muted-foreground">
                              {order.fileCount}
                            </span>
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                                <Edit className="mr-2 h-4 w-4" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteConfirm(order)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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

        {/* 파일 관리 다이얼로그 */}
        {selectedOrder && (
          <FileManagerDialog
            isOpen={isFileManagerOpen}
            onClose={() => {
              setIsFileManagerOpen(false)
              setSelectedOrder(null)
              refreshOrders() // 파일 변경 후 수주 목록 새로고침
            }}
            orderId={selectedOrder.id}
            orderNumber={selectedOrder.order_number}
            projectName={selectedOrder.project_name}
          />
        )}
      </div>
    </MainLayout>
  )
}