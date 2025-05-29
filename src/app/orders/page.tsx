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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  Calendar,
  Info,
  Printer,
  ChevronUp,
  ChevronDown
} from "lucide-react"
import { Order, OrderFormData, ClientType, OrderStatus, OrderType, OrderFile } from "@/types/order"
import { OrderForm } from "@/components/forms/order-form"
import { orderService } from "@/lib/supabase/database"
import { FileManagerDialog } from "@/components/file-manager/file-manager-dialog"
import { supabase } from "@/lib/supabase/client"
import { FileUploadService } from "@/lib/supabase/file-upload"
import { MainLayout } from "@/components/layout/main-layout"
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx"
import { motion, AnimatePresence } from "framer-motion"

// 파일 개수를 포함한 Order 타입
interface OrderWithFileCount extends Order {
  fileCount: number
}

// contamination_info를 항상 배열로 변환하는 함수
function toContaminationArray(val: any): any[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const arr = JSON.parse(val)
      if (Array.isArray(arr)) return arr
    } catch {}
  }
  return []
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

  // 신규+변경 다이얼로그 상태
  const [showOrderGroupDialog, setShowOrderGroupDialog] = useState(false)
  const [orderGroupDetails, setOrderGroupDetails] = useState<OrderWithFileCount[] | null>(null)

  // 정렬 상태 추가
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // 테이블 뷰 모드 상태 추가
  const [tableViewMode, setTableViewMode] = useState<'summary' | 'full'>('summary')

  // Supabase에서 수주 데이터 가져오기
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const data = await orderService.getAll()
        // contamination_info를 항상 배열로 변환
        const normalized = data.map((order: any) => ({
          ...order,
          contamination_info: toContaminationArray(order.contamination_info)
        }))
        // 각 수주별 파일 개수 조회 (안전한 방식)
        const ordersWithFileCount = await Promise.all(
          normalized.map(async (order) => {
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
      bidding: 'bg-gray-200 text-gray-700',
    } as const
    return statusColors[status as keyof typeof statusColors] ?? 'bg-gray-200 text-gray-700'
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
      change1: '1차 변경',
      change2: '2차 변경',
      change3: '3차 변경',
      change4: '4차 변경',
      change5: '5차 변경'
    }
    return labels[type]
  }

  const getStatusLabel = (status: OrderStatus) => {
    const labels = {
      contracted: '계약',
      in_progress: '진행중',
      completed: '완료',
      bidding: '입찰예정',
    } as const
    return labels[status as keyof typeof labels] ?? status
  }

  const getContaminationGroups = (contaminationInfo: any) => {
    // contaminationInfo가 배열이면 type만 join해서 string처럼 처리
    let infoStr = ''
    if (Array.isArray(contaminationInfo)) {
      infoStr = contaminationInfo.map((item: any) => item.type).join(', ')
    } else if (typeof contaminationInfo === 'string') {
      infoStr = contaminationInfo
    }
    const groups = {
      중금속류: ['카드뮴', '구리', '비소', '수은', '납', '6가크롬', '아연', '니켈'],
      유류: ['TPH', '벤젠', '톨루엔', '에틸벤젠', '크실렌'],
      염소계용매: ['TCE', 'PCE', '1,2-디클로로에탄'],
      유기염소화합물: ['폴리클로리네이티드비페닐', 'PCB', '다이옥신'],
      기타유기물: ['유기인화합물', '페놀'],
      기타무기물: ['불소', '시안']
    }
    const foundGroups: string[] = []
    const detectedSubstances: string[] = []
    Object.entries(groups).forEach(([groupName, substances]) => {
      const foundInGroup = substances.filter(substance =>
        infoStr.toLowerCase().includes(substance.toLowerCase())
      )
      if (foundInGroup.length > 0) {
        foundGroups.push(groupName)
        detectedSubstances.push(...foundInGroup)
      }
    })
    // 벤조(a)피렌은 별도로 처리
    if (infoStr.toLowerCase().includes('벤조(a)피렌')) {
      detectedSubstances.push('벤조(a)피렌')
    }
    return { foundGroups, detectedSubstances, originalInfo: infoStr }
  }

  const getContaminationDisplay = (contaminationInfo: string) => {
    const { foundGroups, detectedSubstances } = getContaminationGroups(contaminationInfo)
    
    if (foundGroups.length === 0) {
      return "기타오염"
    }
    
    if (foundGroups.length === 1) {
      return foundGroups[0]
    }
    
    if (foundGroups.length <= 2) {
      return foundGroups.join(", ")
    }
    
    return `${foundGroups.length}종 복합`
  }

  // 필터링된 수주 목록
  const filteredOrders = ordersList.filter((order) => {
    const matchesSearch = !filters.searchTerm ||
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

  // ordersList를 프로젝트명 기준으로 그룹화하여 대표(신규) 계약만 보여주고, 변경 계약이 있으면 금액 합산 및 유형 표시
  const groupByProject = (orders: OrderWithFileCount[]): Record<string, OrderWithFileCount[]> => {
    const map: Record<string, OrderWithFileCount[]> = {}
    orders.forEach((o: OrderWithFileCount) => {
      if (!map[o.project_name]) map[o.project_name] = []
      map[o.project_name].push(o)
    })
    return map
  }
  
  const summaryDisplayOrders = Object.values(groupByProject(filteredOrders)).map((group: OrderWithFileCount[]) => {
    const newOrder = group.find((o) => o.order_type === 'new')
    if (!newOrder || !newOrder.id) return null // id 등 필수값이 없으면 건너뜀
    const changeOrders = group.filter((o) => o.order_type !== 'new')
    const totalAmount = group.reduce((sum, o) => sum + o.contract_amount, 0)
    return {
      ...newOrder,
      contract_amount: totalAmount,
      order_type: changeOrders.length > 0 ? 'new+change' : 'new',
      change_orders: changeOrders,
      all_orders: group, // 팝오버/다이얼로그용 전체 계약
    } as OrderWithFileCount & { order_type: string; change_orders: OrderWithFileCount[]; all_orders: OrderWithFileCount[] }
  }).filter(Boolean)

  // 정렬 함수 - tableViewMode에 따라 다른 데이터를 정렬
  const getSortedData = () => {
    const dataToSort = tableViewMode === 'summary' ? [...summaryDisplayOrders] : [...filteredOrders];
    
    if (!sortColumn) return dataToSort; // sortColumn이 null이면 원본 순서대로

    return dataToSort.sort((a: any, b: any) => {
      let aValue = a[sortColumn!];
      let bValue = b[sortColumn!];

      // 데이터 유형에 따른 비교 로직 (기존과 동일)
      if (sortColumn === 'contract_amount' || sortColumn === 'progress_percentage') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      if (sortColumn === 'contract_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      if (sortColumn === 'contamination_info') {
        aValue = getContaminationDisplay(a.contamination_info);
        bValue = getContaminationDisplay(b.contamination_info);
      }
      if (sortColumn === 'transport_type') {
        aValue = getTransportTypeLabel(a.transport_type);
        bValue = getTransportTypeLabel(b.transport_type);
      }
      if (sortColumn === 'status') {
        aValue = getStatusLabel(a.status);
        bValue = getStatusLabel(b.status);
      }
      if (sortColumn === 'client_type') {
        aValue = a.client_type === 'government' ? '관수' : '민수';
        bValue = b.client_type === 'government' ? '관수' : '민수';
      }
      // 수주 유형 정렬 시 주의: summary 모드에서는 'new+change'가 있고, full 모드에서는 실제 OrderType 값만 있음
      if (sortColumn === 'order_type') {
        if (tableViewMode === 'summary') {
          aValue = String(a.order_type) === 'new+change' ? '신규+변경' : getOrderTypeLabel(a.order_type as OrderType);
          bValue = String(b.order_type) === 'new+change' ? '신규+변경' : getOrderTypeLabel(b.order_type as OrderType);
        } else {
          aValue = getOrderTypeLabel(a.order_type as OrderType);
          bValue = getOrderTypeLabel(b.order_type as OrderType);
        }
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  const finalSortedOrders = getSortedData();

  // 테이블 헤더 클릭 핸들러
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // 같은 컬럼을 다시 클릭
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        // 세 번째 클릭: 정렬 해제
        setSortColumn(null);
        setSortDirection('asc'); // 다음 클릭 시 오름차순으로 시작하도록 기본값 설정
      }
    } else {
      // 새로운 컬럼을 클릭 (항상 오름차순으로 시작)
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  // 정렬 아이콘 렌더링 함수
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      // 현재 정렬된 컬럼이 아니면 아이콘을 표시하지 않음 (호버 시 아이콘도 제거)
      return null;
    }
    // 정렬된 컬럼이면 해당 방향의 아이콘 표시
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600 ml-1" />
      : <ChevronDown className="h-4 w-4 text-blue-600 ml-1" />;
  }

  // 테이블 렌더링 함수(메인/다이얼로그에서 재사용)
  function renderOrderTable(orders: any[], options?: { showManagementColumn?: boolean }) {
    const showManagement = options?.showManagementColumn ?? true;
    const colSpanValue = showManagement ? 12 : 11;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[80px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none" 
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center justify-center">
                상태
                {renderSortIcon('status')}
              </div>
            </TableHead>
            <TableHead 
              className="w-[100px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none" 
              onClick={() => handleSort('client_type')}
            >
              <div className="flex items-center justify-center">
                고객사 유형
                {renderSortIcon('client_type')}
              </div>
            </TableHead>
            <TableHead 
              className="w-[200px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none" 
              onClick={() => handleSort('project_name')}
            >
              <div className="flex items-center justify-center">
                프로젝트명
                {renderSortIcon('project_name')}
              </div>
            </TableHead>
            <TableHead 
              className="w-[150px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none" 
              onClick={() => handleSort('company_name')}
            >
              <div className="flex items-center justify-center">
                거래처
                {renderSortIcon('company_name')}
              </div>
            </TableHead>
            <TableHead 
              className="w-[150px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none" 
              onClick={() => handleSort('contract_amount')}
            >
              <div className="flex items-center justify-center">
                계약금액(V.A.T 포함)
                {renderSortIcon('contract_amount')}
              </div>
            </TableHead>
            <TableHead 
              className="w-[100px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none" 
              onClick={() => handleSort('order_type')}
            >
              <div className="flex items-center justify-center">
                수주유형
                {renderSortIcon('order_type')}
              </div>
            </TableHead>
            <TableHead 
              className="w-[120px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none" 
              onClick={() => handleSort('contract_date')}
            >
              <div className="flex items-center justify-center">
                계약일
                {renderSortIcon('contract_date')}
              </div>
            </TableHead>
            <TableHead 
              className="w-[80px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none" 
              onClick={() => handleSort('progress_percentage')}
            >
              <div className="flex items-center justify-center">
                진행률
                {renderSortIcon('progress_percentage')}
              </div>
            </TableHead>
            <TableHead 
              className="w-[120px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none"
              onClick={() => handleSort('contamination_info')}
            >
              <div className="flex items-center justify-center">
                오염정보
                {renderSortIcon('contamination_info')}
              </div>
            </TableHead>
            <TableHead 
              className="w-[100px] text-center text-base cursor-pointer hover:bg-gray-50 group select-none"
              onClick={() => handleSort('transport_type')}
            >
              <div className="flex items-center justify-center">
                정화 장소
                {renderSortIcon('transport_type')}
              </div>
            </TableHead>
            <TableHead className="w-[120px] text-center text-base">파일</TableHead>
            {showManagement && (
              <TableHead className="w-[80px] text-center text-base">관리</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpanValue} className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="mt-2 text-sm text-muted-foreground">데이터를 불러오는 중...</p>
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpanValue} className="text-center py-8">
                <p className="text-muted-foreground">조회된 수주가 없습니다.</p>
              </TableCell>
            </TableRow>
          ) : (
            orders.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell className="w-[80px] text-center">
                  <Badge className={getStatusBadge(o.status)}>
                    {getStatusLabel(o.status)}
                  </Badge>
                </TableCell>
                <TableCell className="w-[100px] text-center">
                  <Badge className={getClientTypeBadge(o.client_type)}>
                    {o.client_type === 'government' ? '관수' : '민수'}
                  </Badge>
                </TableCell>
                <TableCell className="w-[200px] text-center truncate">
                  {o.project_name}
                </TableCell>
                <TableCell className="w-[150px] text-center">{o.company_name}</TableCell>
                <TableCell className="w-[150px] text-center">{formatCurrency(o.contract_amount)}</TableCell>
                <TableCell className="w-[100px] text-center">
                  {tableViewMode === 'summary' && String(o.order_type) === 'new+change' ? (
                    <button
                      className="underline text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={() => {
                        setOrderGroupDetails(o.all_orders as OrderWithFileCount[])
                        setShowOrderGroupDialog(true)
                      }}
                    >
                      신규+변경
                    </button>
                  ) : (
                    getOrderTypeLabel(o.order_type as OrderType)
                  )}
                </TableCell>
                <TableCell className="w-[120px] text-center">{formatDate(o.contract_date)}</TableCell>
                <TableCell className="w-[80px] text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-12 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${o.progress_percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 min-w-[30px]">
                      {o.progress_percentage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="w-[120px] text-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-auto p-2 text-xs hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          <span>{getContaminationDisplay(o.contamination_info)}</span>
                          <Info className="h-3 w-3 text-gray-400" />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="center">
                      <div className="space-y-3">
                        <div className="font-medium text-sm border-b pb-2">
                          오염정보 상세내역
                        </div>
                        <div className="space-y-2">
                          {(() => {
                            const { foundGroups, detectedSubstances } = getContaminationGroups(o.contamination_info)
                            let contaminationDetails: string | null = null
                            const infoArr = toContaminationArray(o.contamination_info)
                            if (infoArr.length > 0) {
                              contaminationDetails = infoArr.map((item: any) => `${item.type} (${item.value} mg/kg)`).join(', ')
                            }
                            return (
                              <>
                                {foundGroups.length > 0 && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">검출된 오염물질 그룹:</div>
                                    <div className="flex flex-wrap gap-1">
                                      {foundGroups.map((group, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {group}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {contaminationDetails && (
                                  <div>
                                    <div className="text-xs text-gray-500 mb-1">구체적 물질 및 농도:</div>
                                    <div className="text-xs text-gray-700">
                                      {contaminationDetails}
                                    </div>
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell className="w-[100px] text-center">
                  <Badge className={getTransportTypeBadge(o.transport_type)}>
                    {getTransportTypeLabel(o.transport_type)}
                  </Badge>
                </TableCell>
                <TableCell className="w-[120px] text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileManager(o)}
                    className="flex items-center justify-center gap-2 mx-auto"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                      {o.fileCount}
                    </span>
                  </Button>
                </TableCell>
                {showManagement && (
                  <TableCell className="w-[80px] text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          disabled={
                            (tableViewMode === 'summary' && o.order_type === 'new+change') || 
                            (tableViewMode === 'summary' && !o.all_orders && o.order_type !== 'new+change')
                          }
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleEditOrder(o)}
                          disabled={tableViewMode === 'summary'} // 요약 보기에서는 항상 수정 비활성화
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteConfirm(o)}
                          // 요약 보기의 '신규+변경' 행이 아닌 경우 (단일 계약 요약) 삭제 비활성화
                          disabled={(tableViewMode === 'summary' && !o.all_orders && o.order_type !== 'new+change')}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    )
  }

  // 새 수주 등록
  const handleCreateOrder = () => {
    setFormMode('create')
    setSelectedOrder(null)
    setIsFormDialogOpen(true)
  }

  // 수주 수정
  const handleEditOrder = (order: Order) => {
    if (tableViewMode === 'summary') {
      alert("수정 작업은 '전체 보기' 모드에서만 가능합니다.");
      console.warn("수정 작업은 '전체 보기' 모드에서만 가능합니다. 현재 선택된 항목:", order);
      return;
    }
    setFormMode('edit')
    setSelectedOrder(order)
    setIsFormDialogOpen(true)
    setShowOrderGroupDialog(false) 
  }

  // 수주 삭제 확인
  const handleDeleteConfirm = (order: Order) => {
    // 요약 보기에서 '신규+변경'이 아닌 행의 삭제 버튼을 클릭한 경우 (실제로는 버튼이 disabled 상태여야 함)
    if (tableViewMode === 'summary' && (order as any).order_type !== 'new+change') {
        alert("개별 계약 삭제는 '전체 보기' 모드에서 가능합니다.");
        console.warn("개별 계약 삭제는 '전체 보기' 모드에서만 가능합니다. 현재 선택된 항목:", order);
        return;
    }
    // '신규+변경' 행의 삭제는 프로젝트 전체 삭제를 의미 (기존 로직 유지)
    // '전체 보기' 모드에서는 항상 개별 삭제
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
      let deleteError: any = null

      // "요약 보기" 모드에서 "신규+변경" 행을 삭제하는 경우 프로젝트 전체 삭제
      if (tableViewMode === 'summary' && (selectedOrder as any).order_type === 'new+change') {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('project_name', selectedOrder.project_name)
        deleteError = error
      } else {
        // "전체 보기" 모드이거나, 요약 보기에서 단일 건 삭제 시도 (버튼은 비활성화 되어야 함) 시 ID 기준 삭제
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', selectedOrder.id)
        deleteError = error
      }

      if (deleteError) throw deleteError

      // 목록 새로고침
      await refreshOrders()
      setIsDeleteDialogOpen(false)
      setSelectedOrder(null) // 선택된 수주 초기화
    } catch (error) {
      console.error('수주 삭제 실패:', error)
      // 사용자에게 오류 알림 추가 가능 (예: toast)
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
      setIsLoading(true) // refresh 시에도 로딩 상태 반영
      const data = await orderService.getAll()
      const normalized = data.map((order: any) => ({
        ...order,
        contamination_info: toContaminationArray(order.contamination_info)
      }))
      const ordersWithFileCount = await Promise.all(
        normalized.map(async (order) => {
          try {
            const { count, error } = await supabase
              .from('order_files')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', order.id)
            if (error) {
              console.warn(`파일 개수 조회 실패 for order ${order.id}:`, error.message)
              return { ...order, fileCount: 0 }
            }
            return { ...order, fileCount: count || 0 }
          } catch (error: any) {
            console.warn(`파일 개수 조회 예외 for order ${order.id}:`, error?.message || error)
            return { ...order, fileCount: 0 }
          }
        })
      )
      setOrdersList(ordersWithFileCount)
    } catch (error: any) {
      console.error('수주 목록 새로고침 실패:', error?.message || error)
    } finally {
      setIsLoading(false)
    }
  }

  // 엑셀 내보내기 함수 추가 (xlsx 라이브러리 필요)
  const handleExportExcel = () => {
    // 테이블 데이터 엑셀로 변환
    const exportData = finalSortedOrders.filter(Boolean).map((order) => ({
      상태: getStatusLabel((order as any).status),
      고객사유형: (order as any).client_type === 'government' ? '관수' : '민수',
      프로젝트명: (order as any).project_name,
      거래처: (order as any).company_name,
      계약금액: (order as any).contract_amount,
      수주유형: String((order as any).order_type) === 'new+change' ? '신규+변경' : getOrderTypeLabel((order as any).order_type as OrderType),
      계약일: formatDate((order as any).contract_date),
      진행률: (order as any).progress_percentage + '%',
      오염정보: getContaminationDisplay((order as any).contamination_info),
      정화장소: getTransportTypeLabel((order as any).transport_type),
      파일: (order as any).fileCount
    }))
    const ws = XLSXUtils.json_to_sheet(exportData)
    const wb = XLSXUtils.book_new()
    XLSXUtils.book_append_sheet(wb, ws, "수주목록")
    XLSXWriteFile(wb, "수주목록.xlsx")
  }

  return (
    <MainLayout>
      <div className="py-6 px-10">
        <Card>
          <CardHeader className="pb-4 overflow-x-hidden">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              {/* 타이틀/설명 왼쪽 고정 */}
              <div className="flex-shrink-0 min-w-[220px]">
                <CardTitle className="text-4xl font-bold">수주 관리</CardTitle>
              </div>
              {/* 필터/버튼 한 줄로 오른쪽 정렬, 넘치면 스크롤 */}
              <div className="flex-1">
                <div className="flex flex-nowrap gap-3 items-end justify-end overflow-x-auto py-1">
                  {/* 테이블 뷰 모드 전환 버튼 */}
                  <div className="flex items-center rounded-md border bg-gray-100 p-0.5 shadow-sm">
                    <Button
                      variant={tableViewMode === 'summary' ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => { setTableViewMode('summary'); setSortColumn(null); setSortDirection('asc'); }}
                      className={`px-3 py-1.5 h-auto text-sm rounded-sm transition-colors duration-150 
                                  ${tableViewMode === 'summary' 
                                    ? 'bg-white text-primary shadow-md' 
                                    : 'text-muted-foreground hover:bg-gray-200 hover:text-gray-700'}`}
                    >
                      요약 보기
                    </Button>
                    <Button
                      variant={tableViewMode === 'full' ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => { setTableViewMode('full'); setSortColumn(null); setSortDirection('asc'); }}
                      className={`px-3 py-1.5 h-auto text-sm rounded-sm transition-colors duration-150 
                                  ${tableViewMode === 'full' 
                                    ? 'bg-white text-primary shadow-md' 
                                    : 'text-muted-foreground hover:bg-gray-200 hover:text-gray-700'}`}
                    >
                      전체 보기
                    </Button>
                  </div>
                  {/* 검색 */}
                  <div className="relative min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="프로젝트명 또는 거래처명"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-8 h-10"
                    />
                  </div>
                  {/* 고객사 유형 */}
                  <Select
                    value={filters.clientType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, clientType: value as ClientType | "all" }))}
                  >
                    <SelectTrigger className="h-10 min-w-[150px]">
                      <SelectValue placeholder="고객사 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">고객사 유형: 전체</SelectItem>
                      <SelectItem value="government">관수</SelectItem>
                      <SelectItem value="private">민수</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* 상태 */}
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as OrderStatus | "all" }))}
                  >
                    <SelectTrigger className="h-10 min-w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">상태: 전체</SelectItem>
                      <SelectItem value="cancelled">취소</SelectItem>
                      <SelectItem value="contracted">계약</SelectItem>
                      <SelectItem value="in_progress">진행중</SelectItem>
                      <SelectItem value="completed">완료</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* 계약일 범위 */}
                  <Input
                    type="date"
                    value={filters.dateRange.startDate}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, startDate: e.target.value }
                    }))}
                    className="h-10 min-w-[100px]"
                  />
                  <Input
                    type="date"
                    value={filters.dateRange.endDate}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, endDate: e.target.value }
                    }))}
                    className="h-10 min-w-[100px]"
                  />
                  {/* 엑셀 내보내기, 화면인쇄, 새 수주 등록 */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="border border-gray-300"
                    title="엑셀 내보내기"
                    onClick={handleExportExcel}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border border-gray-300"
                    title="화면 인쇄"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-5 w-5" />
                  </Button>
                  <Button onClick={handleCreateOrder} className="h-10 min-w-[140px]">
                    <Plus className="mr-2 h-4 w-4" />
                    새 수주 등록
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {/* 기존 필터 영역 → 대시보드 자리 제거 */}
            {/* 
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-center min-h-[80px] text-2xl text-gray-400">
              향후 대시보드 삽입
            </div>
            */}

            {/* 개선된 테이블 레이아웃 */}
            <div className="rounded-md border">
              {renderOrderTable(
                finalSortedOrders, 
                { showManagementColumn: tableViewMode === 'full' }
              )}
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
                {tableViewMode === 'summary' && selectedOrder && (selectedOrder as any).order_type === 'new+change' 
                  ? "이 프로젝트의 모든 계약(신규 및 변경 계약 포함)이 삭제됩니다. 계속하시겠습니까?"
                  : "선택한 계약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
                }
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

        {/* 신규+변경 전체 계약 내역 다이얼로그 */}
        <Dialog open={showOrderGroupDialog} onOpenChange={setShowOrderGroupDialog}>
          <DialogContent className="max-w-6xl"> {/* max-w-7xl에서 6xl로 조정됨 */}
            <DialogHeader>
              <DialogTitle>전체 계약 내역</DialogTitle>
              <DialogDescription>이 프로젝트의 신규 및 변경 계약 전체 내역입니다.</DialogDescription>
            </DialogHeader>
            {orderGroupDetails && orderGroupDetails.length > 0 ? (
              <div className="overflow-x-auto">
                {renderOrderTable(orderGroupDetails, { showManagementColumn: false })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                계약 내역을 불러올 수 없습니다.
              </p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}