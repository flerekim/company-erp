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
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Download,
  Printer,
  ChevronUp,
  ChevronDown,
  Loader2,
  Info
} from "lucide-react"
import { Order, OrderFormData, ClientType, OrderStatus, OrderType, OrderFile, OrderWithFileCount, ContaminationItem } from "@/types/order"
import { OrderForm } from "@/components/forms/order-form"
import { orderService } from "@/lib/supabase/database"
import { FileManagerDialog } from "@/components/file-manager/file-manager-dialog"
import { supabase } from "@/lib/supabase/client"
import { FileUploadService } from "@/lib/supabase/file-upload"
import { MainLayout } from "@/components/layout/main-layout"
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx"
import {
  toContaminationArray,
  formatCurrency,
  formatDate,
  getClientTypeBadge,
  getStatusBadge,
  getTransportTypeBadge,
  getTransportTypeLabel,
  getOrderTypeLabel,
  getStatusLabel,
  getContaminationGroups,
  getContaminationDisplay
} from "@/lib/order-utils"

// 초기 필터 상태 정의
const INITIAL_FILTERS = {
  searchTerm: "",
  clientType: "all" as ClientType | "all",
  status: "all" as OrderStatus | "all",
  orderType: "all" as OrderType | "all",
  dateRange: {
    startDate: "",
    endDate: ""
  }
};

// 정렬 기본값 정의
const DEFAULT_SORT_DIRECTION = 'asc';

export default function OrdersPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithFileCount | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  
  const [isLoading, setIsLoading] = useState(false)
  const [ordersList, setOrdersList] = useState<OrderWithFileCount[]>([])

  const [showOrderGroupDialog, setShowOrderGroupDialog] = useState(false)
  const [orderGroupDetails, setOrderGroupDetails] = useState<OrderWithFileCount[] | null>(null)

  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(DEFAULT_SORT_DIRECTION)

  const [tableViewMode, setTableViewMode] = useState<'summary' | 'full'>('summary')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        const data = await orderService.getAll()
        
        const normalizedOrders = data.map((order: any) => ({
          ...order,
          contamination_info: toContaminationArray(order.contamination_info) 
        }));

        const ordersWithFileCount = await Promise.all(
          normalizedOrders.map(async (order) => {
            try {
              const { count, error } = await supabase
                .from('order_files')
                .select('*', { count: 'exact', head: true })
                .eq('order_id', order.id)
              if (error) {
                console.warn(`파일 개수 조회 실패 for order ${order.id}:`, error.message)
                return { ...order, fileCount: 0 } as OrderWithFileCount;
              }
              return { ...order, fileCount: count || 0 } as OrderWithFileCount;
            } catch (error: any) {
              console.warn(`파일 개수 조회 예외 for order ${order.id}:`, error?.message || error)
              return { ...order, fileCount: 0 } as OrderWithFileCount;
            }
          })
        );
        setOrdersList(ordersWithFileCount);
      } catch (error: any) {
        console.error('수주 데이터 조회 실패:', error?.message || error)
        setOrdersList([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const filteredOrders = ordersList.filter((order) => {
    const searchTermLower = filters.searchTerm.toLowerCase();
    const matchesSearch = !filters.searchTerm ||
      order.project_name.toLowerCase().includes(searchTermLower) ||
      order.company_name.toLowerCase().includes(searchTermLower)

    const matchesClientType = filters.clientType === "all" || order.client_type === filters.clientType
    const matchesStatus = filters.status === "all" || order.status === filters.status
    
    const orderTypeMatches = (currentOrderType: OrderType | 'new+change', filterType: OrderType | 'all') => {
      if (filterType === "all") return true;
      if (currentOrderType === 'new+change') return filterType === 'new';
      return currentOrderType === filterType;
    };
    const matchesOrderType = orderTypeMatches(order.order_type, filters.orderType);

    if (filters.dateRange.startDate && filters.dateRange.endDate) {
        const orderDate = new Date(order.contract_date);
        const startDate = new Date(filters.dateRange.startDate);
        const endDate = new Date(filters.dateRange.endDate);
        orderDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        const matchesDateRange = orderDate >= startDate && orderDate <= endDate;
        return matchesSearch && matchesClientType && matchesStatus && matchesOrderType && matchesDateRange;
    }
    
    const matchesDateRangeLoose = 
      (!filters.dateRange.startDate || new Date(order.contract_date) >= new Date(filters.dateRange.startDate)) &&
      (!filters.dateRange.endDate || new Date(order.contract_date) <= new Date(filters.dateRange.endDate));

    return matchesSearch && matchesClientType && matchesStatus && matchesOrderType && matchesDateRangeLoose;
  })

  const groupByProject = (orders: OrderWithFileCount[]): Record<string, OrderWithFileCount[]> => {
    const map: Record<string, OrderWithFileCount[]> = {}
    orders.forEach((o) => {
      if (!map[o.project_name]) map[o.project_name] = []
      map[o.project_name].push(o)
    })
    return map
  }
  
  const summaryDisplayOrders = Object.values(groupByProject(filteredOrders)).map((group) => {
    const newOrder = group.find((o) => o.order_type === 'new');
    if (!newOrder || !newOrder.id) return null; 
    
    const changeOrders = group.filter((o) => o.order_type !== 'new' && o.order_type !== 'new+change');
    const totalAmount = group.reduce((sum, o) => sum + o.contract_amount, 0);
    
    return {
      ...newOrder,
      contract_amount: totalAmount,
      order_type: changeOrders.length > 0 ? 'new+change' : 'new',
      change_orders: changeOrders,
      all_orders: group, 
    } as OrderWithFileCount;
  }).filter(Boolean) as OrderWithFileCount[];

  const getSortedData = () => {
    const dataToSort: OrderWithFileCount[] = tableViewMode === 'summary' ? [...summaryDisplayOrders] : [...filteredOrders];
    
    if (!sortColumn) return dataToSort;

    return dataToSort.sort((a, b) => {
      let aValue: any = a[sortColumn as keyof OrderWithFileCount];
      let bValue: any = b[sortColumn as keyof OrderWithFileCount];

      if (sortColumn === 'contract_amount' || sortColumn === 'progress_percentage') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortColumn === 'contract_date') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      } else if (sortColumn === 'contamination_info') {
        aValue = getContaminationDisplay(a.contamination_info as ContaminationItem[] | string);
        bValue = getContaminationDisplay(b.contamination_info as ContaminationItem[] | string);
      } else if (sortColumn === 'transport_type') {
        aValue = getTransportTypeLabel(a.transport_type as string);
        bValue = getTransportTypeLabel(b.transport_type as string);
      } else if (sortColumn === 'status') {
        aValue = getStatusLabel(a.status);
        bValue = getStatusLabel(b.status);
      } else if (sortColumn === 'client_type') {
        aValue = a.client_type === 'government' ? '관수' : '민수';
        bValue = b.client_type === 'government' ? '관수' : '민수';
      } else if (sortColumn === 'order_type') {
        aValue = (a.order_type === 'new+change') ? '신규+변경' : getOrderTypeLabel(a.order_type as OrderType);
        bValue = (b.order_type === 'new+change') ? '신규+변경' : getOrderTypeLabel(b.order_type as OrderType);
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  const finalSortedOrders = getSortedData();

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection(DEFAULT_SORT_DIRECTION); 
      }
    } else {
      setSortColumn(column);
      setSortDirection(DEFAULT_SORT_DIRECTION);
    }
  }

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600 ml-1" />
      : <ChevronDown className="h-4 w-4 text-blue-600 ml-1" />;
  }

  function renderOrderTable(ordersToRender: OrderWithFileCount[], options?: { showManagementColumn?: boolean }) {
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
          ) : ordersToRender.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpanValue} className="text-center py-8">
                <p className="text-muted-foreground">조회된 수주가 없습니다.</p>
              </TableCell>
            </TableRow>
          ) : (
            ordersToRender.map((o: OrderWithFileCount) => (
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
                  {tableViewMode === 'summary' && o.order_type === 'new+change' ? (
                    <button
                      className="underline text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={() => {
                        setOrderGroupDetails(o.all_orders ? o.all_orders : []) 
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
                          <span>{getContaminationDisplay(o.contamination_info as ContaminationItem[] | string)}</span>
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
                            const { foundGroups } = getContaminationGroups(o.contamination_info as ContaminationItem[] | string);
                            const infoArr = toContaminationArray(o.contamination_info);
                            let contaminationDetails: string | null = null;
                            if (infoArr.length > 0) {
                              contaminationDetails = infoArr.map((item: ContaminationItem) => `${item.type} (${item.value} mg/kg)`).join(', ');
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
                                {foundGroups.length === 0 && !contaminationDetails && (
                                   <p className="text-xs text-gray-500">상세 오염 정보가 없습니다.</p>
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
                  <Badge className={getTransportTypeBadge(o.transport_type as string)}>
                    {getTransportTypeLabel(o.transport_type as string)}
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
                          disabled={tableViewMode === 'summary'}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteConfirm(o)}
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

  const handleCreateOrder = () => {
    setFormMode('create')
    setSelectedOrder(null)
    setIsFormDialogOpen(true)
  }

  const handleEditOrder = (order: OrderWithFileCount) => {
    if (tableViewMode === 'summary') {
      alert("수정 작업은 '전체 보기' 모드에서만 가능합니다.");
      return;
    }
    setFormMode('edit')
    setSelectedOrder(order)
    setIsFormDialogOpen(true)
    setShowOrderGroupDialog(false) 
  }

  const handleDeleteConfirm = (order: OrderWithFileCount) => {
    if (tableViewMode === 'summary' && order.order_type !== 'new+change') {
        alert("개별 계약 삭제는 '전체 보기' 모드에서 가능합니다.");
        return;
    }
    setSelectedOrder(order)
    setIsDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (data: OrderFormData, files: File[]) => {
    try {
      setIsLoading(true)
      let newOrderId: string | undefined;

      if (formMode === 'create') {
        const { data: lastOrder } = await orderService.getLastOrder()
        let nextNumber = 1
        if (lastOrder && lastOrder.order_number) {
          const parts = lastOrder.order_number.split('-');
          if (parts.length === 3 && !isNaN(parseInt(parts[2]))) {
            nextNumber = parseInt(parts[2]) + 1;
          }
        }
        const order_number = `ORD-${new Date().getFullYear()}-${nextNumber.toString().padStart(3, '0')}`

        const orderDataToCreate = {
          ...data,
          order_number,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        const createdOrder = await orderService.create(orderDataToCreate);
        newOrderId = createdOrder?.id;

      } else if (formMode === 'edit' && selectedOrder) {
        const updateData = {
          ...data,
          updated_at: new Date().toISOString(),
        }
        await orderService.update(selectedOrder.id, updateData);
        newOrderId = selectedOrder.id;
      }

      if (newOrderId && files && files.length > 0) {
        const uploadResult = await FileUploadService.uploadMultipleFiles(files, newOrderId);
        if (uploadResult.failCount > 0) {
          console.warn(`${uploadResult.failCount}개 파일 업로드 실패`);
          uploadResult.results.forEach(result => {
            if (!result.success) {
              console.error(`파일 "${result.file.name}" 업로드 실패:`, result.error);
            }
          });
        }
      }

      await refreshOrders()
      setIsFormDialogOpen(false)
      if (formMode === 'create') setSelectedOrder(null);
      
    } catch (error) {
      console.error('수주 저장 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return

    try {
      setIsLoading(true)
      let deleteError: any = null

      if (tableViewMode === 'summary' && selectedOrder.order_type === 'new+change') {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('project_name', selectedOrder.project_name)
        deleteError = error
      } else {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', selectedOrder.id)
        deleteError = error
      }

      if (deleteError) throw deleteError

      await refreshOrders()
      setIsDeleteDialogOpen(false)
      setSelectedOrder(null) 
    } catch (error) {
      console.error('수주 삭제 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileManager = (order: OrderWithFileCount) => {
    setSelectedOrder(order)
    setIsFileManagerOpen(true)
  }

  const refreshOrders = async () => {
    try {
      setIsLoading(true)
      const data = await orderService.getAll()
      
      const normalizedOrders = data.map((order: any) => ({
        ...order,
        contamination_info: toContaminationArray(order.contamination_info)
      }));
      
      const ordersWithFileCount = await Promise.all(
        normalizedOrders.map(async (order) => {
          try {
            const { count, error } = await supabase
              .from('order_files')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', order.id)
            if (error) {
              console.warn(`파일 개수 재조회 실패 for order ${order.id}:`, error.message)
              return { ...order, fileCount: 0 } as OrderWithFileCount;
            }
            return { ...order, fileCount: count || 0 } as OrderWithFileCount;
          } catch (error: any) {
            console.warn(`파일 개수 재조회 예외 for order ${order.id}:`, error?.message || error)
            return { ...order, fileCount: 0 } as OrderWithFileCount;
          }
        })
      );
      setOrdersList(ordersWithFileCount);

      if (showOrderGroupDialog && orderGroupDetails && selectedOrder) {
        const updatedGroup = ordersWithFileCount.filter(o => o.project_name === selectedOrder.project_name);
        if (updatedGroup.length > 0) {
          setOrderGroupDetails(updatedGroup);
        } else {
          setShowOrderGroupDialog(false);
          setOrderGroupDetails(null);
        }
      }

    } catch (error: any) {
      console.error('수주 목록 새로고침 실패:', error?.message || error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportExcel = () => {
    const exportData = finalSortedOrders.filter(Boolean).map((order) => ({
      상태: getStatusLabel(order.status),
      고객사유형: order.client_type === 'government' ? '관수' : '민수',
      프로젝트명: order.project_name,
      거래처: order.company_name,
      계약금액: order.contract_amount,
      수주유형: order.order_type === 'new+change' ? '신규+변경' : getOrderTypeLabel(order.order_type as OrderType),
      계약일: formatDate(order.contract_date),
      진행률: `${order.progress_percentage}%`,
      오염정보: getContaminationDisplay(order.contamination_info as ContaminationItem[] | string),
      정화장소: getTransportTypeLabel(order.transport_type as string),
      파일: order.fileCount
    }))
    const ws = XLSXUtils.json_to_sheet(exportData)
    const wb = XLSXUtils.book_new()
    XLSXUtils.book_append_sheet(wb, ws, "수주목록")
    XLSXWriteFile(wb, "수주목록.xlsx")
  }

  return (
    <MainLayout>
      <div className="py-6 px-10">
        <Card id="printable-orders-area">
          <CardHeader className="pb-4 overflow-x-hidden">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex-shrink-0 min-w-[220px]">
                <CardTitle className="text-4xl font-bold">수주 관리</CardTitle>
              </div>
              <div className="flex-1">
                <div className="flex flex-nowrap gap-3 items-end justify-end overflow-x-auto py-1">
                  <div className="flex items-center rounded-md border bg-gray-100 p-0.5 shadow-sm no-print">
                    <Button
                      variant={tableViewMode === 'summary' ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => { setTableViewMode('summary'); setSortColumn(null); setSortDirection(DEFAULT_SORT_DIRECTION); }}
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
                      onClick={() => { setTableViewMode('full'); setSortColumn(null); setSortDirection(DEFAULT_SORT_DIRECTION); }}
                      className={`px-3 py-1.5 h-auto text-sm rounded-sm transition-colors duration-150 
                                  ${tableViewMode === 'full' 
                                    ? 'bg-white text-primary shadow-md' 
                                    : 'text-muted-foreground hover:bg-gray-200 hover:text-gray-700'}`}
                    >
                      전체 보기
                    </Button>
                  </div>
                  <div className="relative min-w-[200px] no-print">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="프로젝트명 또는 거래처명"
                      value={filters.searchTerm}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                      className="pl-8 h-10"
                    />
                  </div>
                  <div className="no-print">
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
                  </div>
                  <div className="no-print">
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as OrderStatus | "all" }))}
                    >
                      <SelectTrigger className="h-10 min-w-[150px]">
                        <SelectValue>
                          {filters.status === 'all' ? '상태: 전체' : getStatusLabel(filters.status as OrderStatus)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">상태: 전체</SelectItem>
                        <SelectItem value="bidding">입찰예정</SelectItem>
                        <SelectItem value="contracted">계약</SelectItem>
                        <SelectItem value="in_progress">진행중</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="date"
                    value={filters.dateRange.startDate}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, startDate: e.target.value }
                    }))}
                    className="h-10 min-w-[100px] no-print"
                  />
                  <Input
                    type="date"
                    value={filters.dateRange.endDate}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, endDate: e.target.value }
                    }))}
                    className="h-10 min-w-[100px] no-print"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="border border-gray-300 no-print"
                    title="엑셀 내보내기"
                    onClick={handleExportExcel}
                  >
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border border-gray-300 no-print"
                    title="화면 인쇄"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-5 w-5" />
                  </Button>
                  <Button 
                    onClick={handleCreateOrder} 
                    className="h-10 min-w-[140px] no-print"
                  >
                    <Plus className="mr-2 h-4 w-4" />새 수주 등록
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div id="orders-table-container" className="rounded-md border">
              {renderOrderTable(
                finalSortedOrders, 
                { showManagementColumn: tableViewMode === 'full' }
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-[600px] lg:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>{formMode === 'create' ? '새 수주 등록' : '수주 수정'}</DialogTitle>
              <DialogDescription>
                수주 정보를 입력하거나 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <OrderForm
              onSubmit={handleFormSubmit}
              initialData={selectedOrder}
              mode={formMode}
              isLoading={isLoading}
              onClose={() => setIsFormDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                {tableViewMode === 'summary' && selectedOrder && selectedOrder.order_type === 'new+change' 
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

        {selectedOrder && (
          <FileManagerDialog
            isOpen={isFileManagerOpen}
            onClose={() => {
              setIsFileManagerOpen(false)
              setSelectedOrder(null)
              refreshOrders() 
            }}
            orderId={selectedOrder.id}
            orderNumber={selectedOrder.order_number}
            projectName={selectedOrder.project_name}
          />
        )}

        <Dialog open={showOrderGroupDialog} onOpenChange={(isOpen) => {
            setShowOrderGroupDialog(isOpen);
            if (!isOpen) {
                setOrderGroupDetails(null);
            }
        }}>
          <DialogContent className="max-w-6xl">
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