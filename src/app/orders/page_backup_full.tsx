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
  Loader2,
  Info,
  Printer,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  Calendar as CalendarIcon,
} from "lucide-react"
import { Order, OrderFormData, ClientType, OrderStatus, OrderType, OrderFile, OrderWithFileCount, ContaminationItem } from "@/types/order"
import { ProjectStatus, getProjectStatusLabel } from "@/types/project";
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
import { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/components/ui/use-toast"

// 프로젝트 상태 옵션 정의
const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ['planning', 'active', 'completed', 'on_hold', 'canceled'];
// 계약 상태 옵션 정의
const ORDER_STATUS_OPTIONS: OrderStatus[] = ['bidding', 'contracted', 'in_progress', 'completed'];

// 초기 필터 상태 정의
const INITIAL_FILTERS = {
  searchTerm: "",
  clientType: "all" as ClientType | "all",
  status: "all" as OrderStatus | "all",
  dateRange: {
    startDate: "",
    endDate: ""
  }
};

// 정렬 기본값 정의
const DEFAULT_SORT_DIRECTION = 'asc';

export default function OrdersPage() {
  const { toast } = useToast();
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

  const [sortColumn, setSortColumn] = useState<string | null>('contract_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const [tableViewMode, setTableViewMode] = useState<'summary' | 'full'>('summary')
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const data = await orderService.getAll()
      
      const normalizedOrders = data.map((order: any) => ({
        ...order,
        contamination_info: toContaminationArray(order.contamination_info),
        project_status: order.project_status || null,
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
      toast({
        title: "데이터 조회 실패",
        description: "수주 목록을 가져오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const filteredOrders = ordersList.filter((order) => {
    const searchTermLower = filters.searchTerm.toLowerCase();
    const matchesSearch = !filters.searchTerm ||
      order.project_name?.toLowerCase().includes(searchTermLower) ||
      order.company_name?.toLowerCase().includes(searchTermLower) ||
      order.order_number?.toLowerCase().includes(searchTermLower)

    const matchesClientType = filters.clientType === "all" || order.client_type === filters.clientType
    const matchesOrderStatus = filters.status === "all" || order.status === filters.status

    let matchesDateRange = true;
    if (date?.from && date?.to) {
      const orderDate = new Date(order.contract_date);
      orderDate.setHours(0,0,0,0);
      const fromDate = new Date(date.from);
      fromDate.setHours(0,0,0,0);
      const toDate = new Date(date.to);
      toDate.setHours(0,0,0,0);
      matchesDateRange = orderDate >= fromDate && orderDate <= toDate;
    } else if (date?.from) {
      const orderDate = new Date(order.contract_date);
      orderDate.setHours(0,0,0,0);
      const fromDate = new Date(date.from);
      fromDate.setHours(0,0,0,0);
      matchesDateRange = orderDate >= fromDate;
    }

    return matchesSearch && matchesClientType && matchesOrderStatus && matchesDateRange;
  })

  const groupByProject = (orders: OrderWithFileCount[]): Record<string, OrderWithFileCount[]> => {
    const map: Record<string, OrderWithFileCount[]> = {}
    orders.forEach((o) => {
      if (!o.project_id) { 
        console.warn("Order without project_id found:", o.id);
        return;
      }
      if (!map[o.project_id]) {
        map[o.project_id] = []
      }
      map[o.project_id].push(o)
    })
    return map
  }
  
  const summaryDisplayOrders = Object.values(groupByProject(filteredOrders)).map((group) => {
    if (group.length === 0) return null;
    
    const representativeOrder = group.find((o) => o.order_type === 'new') || group[0];
    if (!representativeOrder || !representativeOrder.id) return null; 
    
    const changeOrders = group.filter((o) => o.order_type !== 'new' && o.order_type !== 'new+change');
    const totalAmount = group.reduce((sum, o) => sum + o.contract_amount, 0);
    
    return {
      ...representativeOrder, 
      contract_amount: totalAmount, 
      order_type: changeOrders.length > 0 ? 'new+change' : 'new', 
      change_orders: changeOrders, 
      all_orders: group, 
      project_status: representativeOrder.project_status
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
      } else if (sortColumn === 'project_status') { 
        aValue = getProjectStatusLabel(a.project_status);
        bValue = getProjectStatusLabel(b.project_status);
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // 세 번째 클릭: 정렬 해제
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <div className="w-4 h-4"></div>; // 투명한 공간 확보
    }
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };
  
  const TABLE_COL_SPAN_FULL = 13;
  const TABLE_COL_SPAN_MANAGEMENT = 1;

  function renderOrderTable(ordersToRender: OrderWithFileCount[], options?: { showManagementColumn?: boolean }) {
    const showManagement = options?.showManagementColumn ?? true;
    const isSummaryMode = tableViewMode === 'summary';
    
    // 요약 모드: No, 계약상태, 고객사 유형, 프로젝트명, 고객사명, 계약일, 계약금액, 정화장소, 진행률, 오염정보, 파일 = 11개
    // 전체 모드: 기존과 동일 = 12개 (상태 컬럼 제거되어 수주번호까지 포함)
    const summaryColSpan = 11 + (showManagement ? 1 : 0);
    const fullColSpan = 12 + (showManagement ? 1 : 0);
    const currentTableColSpan = isSummaryMode ? summaryColSpan : fullColSpan;

    return (
      <Table className="min-w-full whitespace-nowrap">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] text-center">No</TableHead>
            {isSummaryMode ? (
              // 요약 모드 헤더: 계약상태, 고객사 유형, 프로젝트명, 고객사명, 계약일, 계약금액, 정화장소, 진행률, 오염정보, 파일
              <>
                <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                  <div className="flex items-center justify-center relative">
                    <span>계약상태</span>
                    <div className="absolute right-0">
                      {renderSortIcon('status')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('client_type')}>
                  <div className="flex items-center justify-center relative">
                    <span>고객사 유형</span>
                    <div className="absolute right-0">
                      {renderSortIcon('client_type')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[200px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('project_name')}>
                  <div className="flex items-center justify-center relative">
                    <span>프로젝트명</span>
                    <div className="absolute right-0">
                      {renderSortIcon('project_name')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[150px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('company_name')}>
                  <div className="flex items-center justify-center relative">
                    <span>고객사명</span>
                    <div className="absolute right-0">
                      {renderSortIcon('company_name')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[110px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('contract_date')}>
                  <div className="flex items-center justify-center relative">
                    <span>계약일</span>
                    <div className="absolute right-0">
                      {renderSortIcon('contract_date')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[130px] text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('contract_amount')}>
                  <div className="flex items-center justify-center relative">
                    <span>계약금액</span>
                    <div className="absolute right-0">
                      {renderSortIcon('contract_amount')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('transport_type')}>
                  <div className="flex items-center justify-center relative">
                    <span>정화장소</span>
                    <div className="absolute right-0">
                      {renderSortIcon('transport_type')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('progress_percentage')}>
                  <div className="flex items-center justify-center relative">
                    <span>진행률</span>
                    <div className="absolute right-0">
                      {renderSortIcon('progress_percentage')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[120px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('contamination_info')}>
                  <div className="flex items-center justify-center relative">
                    <span>오염정보</span>
                    <div className="absolute right-0">
                      {renderSortIcon('contamination_info')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[80px] text-center">파일</TableHead>
              </>
            ) : (
              // 전체 모드 헤더: 프로젝트명, 상태, 수주번호, 고객사명, 계약일, 계약금액, 계약상태, 정화장소, 진행률, 오염정보, 파일
              <>
                <TableHead className="w-[200px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('project_name')}>
                  <div className="flex items-center justify-center relative">
                    <span>프로젝트명</span>
                    <div className="absolute right-0">
                      {renderSortIcon('project_name')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('project_status')}>
                  <div className="flex items-center justify-center relative">
                    <span>상태</span>
                    <div className="absolute right-0">
                      {renderSortIcon('project_status')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[150px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('order_number')}>
                  <div className="flex items-center justify-center relative">
                    <span>수주번호</span>
                    <div className="absolute right-0">
                      {renderSortIcon('order_number')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[150px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('company_name')}>
                  <div className="flex items-center justify-center relative">
                    <span>고객사명</span>
                    <div className="absolute right-0">
                      {renderSortIcon('company_name')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[110px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('contract_date')}>
                  <div className="flex items-center justify-center relative">
                    <span>계약일</span>
                    <div className="absolute right-0">
                      {renderSortIcon('contract_date')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[130px] text-right cursor-pointer hover:bg-muted/50" onClick={() => handleSort('contract_amount')}>
                  <div className="flex items-center justify-center relative">
                    <span>계약금액</span>
                    <div className="absolute right-0">
                      {renderSortIcon('contract_amount')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('status')}>
                  <div className="flex items-center justify-center relative">
                    <span>계약상태</span>
                    <div className="absolute right-0">
                      {renderSortIcon('status')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('transport_type')}>
                  <div className="flex items-center justify-center relative">
                    <span>정화장소</span>
                    <div className="absolute right-0">
                      {renderSortIcon('transport_type')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('progress_percentage')}>
                  <div className="flex items-center justify-center relative">
                    <span>진행률</span>
                    <div className="absolute right-0">
                      {renderSortIcon('progress_percentage')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[120px] text-center cursor-pointer hover:bg-muted/50" onClick={() => handleSort('contamination_info')}>
                  <div className="flex items-center justify-center relative">
                    <span>오염정보</span>
                    <div className="absolute right-0">
                      {renderSortIcon('contamination_info')}
                    </div>
                  </div>
                </TableHead>
                <TableHead className="w-[80px] text-center">파일</TableHead>
              </>
            )}
            {showManagement && <TableHead className="w-[80px] text-center">관리</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={currentTableColSpan} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" />데이터 로딩 중...</TableCell></TableRow>
          ) : ordersToRender.length === 0 ? (
            <TableRow><TableCell colSpan={currentTableColSpan} className="h-24 text-center">결과가 없습니다.</TableCell></TableRow>
          ) : (
            ordersToRender.map((order, index) => (
              <TableRow key={order.id} className="hover:bg-muted/50">
                <TableCell className="text-center">{index + 1}</TableCell>
                {isSummaryMode ? (
                  // 요약 모드 데이터 셀: No, 계약상태, 고객사 유형, 프로젝트명, 고객사명, 계약일, 계약금액, 정화장소, 진행률, 오염정보, 파일
                  <>
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
                    <TableCell className="font-medium text-center whitespace-pre-wrap">
                      {isSummaryMode && order.all_orders && order.all_orders.length > 1 ? (
                        <Button variant="link" className="p-0 h-auto text-left whitespace-normal" onClick={() => { setOrderGroupDetails(order.all_orders || []); setShowOrderGroupDialog(true); }}>
                          {order.project_name} ({order.all_orders.length})
                        </Button>
                      ) : order.project_name}
                    </TableCell>
                    <TableCell className="text-center whitespace-pre-wrap">{order.company_name}</TableCell>
                    <TableCell className="text-center">{formatDate(order.contract_date)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.contract_amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getTransportTypeBadge(order.transport_type)}>
                        {getTransportTypeLabel(order.transport_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${order.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{order.progress_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {order.contamination_info && (Array.isArray(order.contamination_info) ? order.contamination_info : []).length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs h-auto py-1 px-2">
                              {getContaminationDisplay(order.contamination_info)}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 max-h-[400px] overflow-y-auto">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">오염물질 상세</h4>
                              <div className="text-sm text-muted-foreground">
                                검출된 오염물질 그룹: {getContaminationGroups(order.contamination_info).foundGroups.map(g => <Badge key={g} variant="secondary" className="mr-1 mb-1">{g}</Badge>)}
                              </div>
                              <div className="text-sm">
                                <p className="font-medium mb-1">구체적 물질 및 농도:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                {(toContaminationArray(order.contamination_info)).map(item => (
                                    <li key={item.type}>
                                    {item.type}: <span className="font-semibold">{item.value}</span> mg/kg
                                    </li>
                                ))}
                                </ul>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-xs text-gray-400">정보 없음</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFileManager(order)}
                        disabled={!order.id}
                        className="h-auto py-1"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="ml-1 text-xs">({order.fileCount ?? 0})</span>
                      </Button>
                    </TableCell>
                  </>
                ) : (
                  // 전체 모드 데이터 셀: 기존과 동일
                  <>
                    <TableCell className="font-medium text-center whitespace-pre-wrap">
                      {isSummaryMode && order.all_orders && order.all_orders.length > 1 ? (
                        <Button variant="link" className="p-0 h-auto text-left whitespace-normal" onClick={() => { setOrderGroupDetails(order.all_orders || []); setShowOrderGroupDialog(true); }}>
                          {order.project_name} ({order.all_orders.length})
                        </Button>
                      ) : order.project_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.project_status ? (
                        <Badge 
                          variant={
                            order.project_status === 'completed' ? 'default' : 
                            order.project_status === 'active' || order.project_status === 'planning' ? 'default' : 
                            order.project_status === 'canceled' || order.project_status === 'on_hold' ? 'destructive' : 
                            'outline'
                          }
                          className={`text-xs whitespace-nowrap ${
                            order.project_status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 
                            order.project_status === 'active' || order.project_status === 'planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' : 
                            (order.project_status === 'canceled' || order.project_status === 'on_hold') ? '' :
                            'dark:border-gray-600'
                          }`}
                        >
                          {getProjectStatusLabel(order.project_status as ProjectStatus)}
                        </Badge>
                      ) : <span className="text-xs text-gray-500">N/A</span>}
                    </TableCell>
                    <TableCell className="text-center">{order.order_number}</TableCell>
                    <TableCell className="text-center whitespace-pre-wrap">{order.company_name}</TableCell>
                    <TableCell className="text-center">{formatDate(order.contract_date)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.contract_amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusBadge(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getTransportTypeBadge(order.transport_type)}>
                        {getTransportTypeLabel(order.transport_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${order.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{order.progress_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {order.contamination_info && (Array.isArray(order.contamination_info) ? order.contamination_info : []).length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs h-auto py-1 px-2">
                              {getContaminationDisplay(order.contamination_info)}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 max-h-[400px] overflow-y-auto">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">오염물질 상세</h4>
                              <div className="text-sm text-muted-foreground">
                                검출된 오염물질 그룹: {getContaminationGroups(order.contamination_info).foundGroups.map(g => <Badge key={g} variant="secondary" className="mr-1 mb-1">{g}</Badge>)}
                              </div>
                              <div className="text-sm">
                                <p className="font-medium mb-1">구체적 물질 및 농도:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                {(toContaminationArray(order.contamination_info)).map(item => (
                                    <li key={item.type}>
                                    {item.type}: <span className="font-semibold">{item.value}</span> mg/kg
                                    </li>
                                ))}
                                </ul>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-xs text-gray-400">정보 없음</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleFileManager(order)}
                        disabled={!order.id}
                        className="h-auto py-1"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="ml-1 text-xs">({order.fileCount ?? 0})</span>
                      </Button>
                    </TableCell>
                  </>
                )}
                {showManagement && (
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">메뉴 열기</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                          <Edit className="mr-2 h-4 w-4" /> 수정
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteConfirm(order)} className="text-red-600 hover:text-red-700 focus:text-red-700">
                          <Trash2 className="mr-2 h-4 w-4" /> 삭제
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setOrderGroupDetails(order.all_orders || [order]); setShowOrderGroupDialog(true); }}>
                            <Info className="mr-2 h-4 w-4" /> 상세 보기
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
    );
  }

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setFormMode('create');
    setIsFormDialogOpen(true);
  };

  const handleEditOrder = (order: OrderWithFileCount) => {
    setSelectedOrder(order);
    setFormMode('edit');
    setIsFormDialogOpen(true);
  };

  const handleDeleteConfirm = (order: OrderWithFileCount) => {
    setSelectedOrder(order);
    setIsDeleteDialogOpen(true);
  };
  
  const handleFormSubmit = async (data: OrderFormData, files: File[]) => {
    setIsLoading(true);
    let newOrderId: string | undefined;

    try {
      if (formMode === 'edit' && selectedOrder?.id) {
        await orderService.update(selectedOrder.id, data);
        newOrderId = selectedOrder.id;
        toast({
          title: "수정 완료",
          description: "수주 정보가 성공적으로 수정되었습니다.",
          variant: "success",
          duration: 2000,
        });
      } else {
        const createdOrder = await orderService.create(data);
        if (createdOrder && createdOrder.id) { // create가 id를 포함한 객체를 반환한다고 가정
          newOrderId = createdOrder.id;
        } else {
          // ID를 얻지 못한 경우의 오류 처리 (예: 토스트 메시지, 로깅)
          console.error("Failed to get new order ID after creation.");
          toast({
            title: "등록 오류",
            description: "수주 등록 후 ID를 가져오지 못했습니다.",
            variant: "destructive",
          });
          setIsLoading(false);
          return; // 파일 업로드 없이 종료
        }
        toast({
          title: "등록 완료",
          description: "새 수주가 성공적으로 등록되었습니다.",
          variant: "success",
          duration: 2000,
        });
      }

      if (newOrderId && files.length > 0) {
        let successfulUploads = 0;
        for (const file of files) {
          const uploadResult = await FileUploadService.uploadFile(file, newOrderId, 'other'); 
          if (uploadResult.success) {
            successfulUploads++;
          } else {
            console.warn(`File upload failed for ${file.name}: ${uploadResult.error}`);
            toast({
              title: `파일 업로드 실패: ${file.name}`,
              description: uploadResult.error || "알 수 없는 오류가 발생했습니다.",
              variant: "destructive",
            });
          }
        }
        if (successfulUploads > 0) {
          toast({
              title: "파일 업로드 완료",
              description: `${successfulUploads}개의 파일이 성공적으로 업로드되었습니다.`,
              variant: "success",
              duration: 2000,
            });
        }
      }
      setIsFormDialogOpen(false);
      fetchOrders(); // 목록 새로고침
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        title: "오류 발생",
        description: error.message || "정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (selectedOrder) {
      try {
        await orderService.delete(selectedOrder.id);
        toast({
          title: "삭제 완료",
          description: "수주 정보가 삭제되었습니다.",
          variant: "success",
          duration: 2000,
        });
        setIsDeleteDialogOpen(false);
        fetchOrders();
      } catch (error: any) {
        toast({
          title: "삭제 실패",
          description: error.message || "수주 정보 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileManager = (order: OrderWithFileCount) => {
    setSelectedOrder(order);
    setIsFileManagerOpen(true);
  };

  const refreshOrders = () => {
    fetchOrders();
     toast({
      title: "목록 새로고침",
      description: "수주 목록을 최신 정보로 업데이트했습니다.",
      duration: 1500,
    });
  };
  
  const handleExportExcel = () => {
    const dataToExport = getSortedData().map(order => ({
      '프로젝트명': order.project_name,
      '프로젝트상태': getProjectStatusLabel(order.project_status as ProjectStatus),
      '수주번호': order.order_number,
      '고객사명': order.company_name,
      '계약일': formatDate(order.contract_date),
      '계약금액': order.contract_amount,
      '수주유형': order.order_type === 'new+change' ? '신규+변경' : getOrderTypeLabel(order.order_type as OrderType),
      '계약상태': getStatusLabel(order.status),
      '정화장소': getTransportTypeLabel(order.transport_type),
      '진행률(%)': order.progress_percentage,
      '오염정보': getContaminationDisplay(order.contamination_info),
      '파일개수': order.fileCount,
    }));

    const worksheet = XLSXUtils.json_to_sheet(dataToExport);
    const colWidths = Object.keys(dataToExport[0] || {}).map(key => ({ wch: Math.max(20, key.length, ...dataToExport.map(row => String(row[key as keyof typeof row]).length)) }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(workbook, worksheet, "수주목록");
    const simpleDate = new Date().toISOString().slice(0,10).replace(/-/g,"");
    XLSXWriteFile(workbook, `수주목록_${simpleDate}.xlsx`);
    toast({
        title: "엑셀 다운로드",
        description: "수주 목록이 엑셀 파일로 저장되었습니다.",
        variant: "success",
        duration: 2000,
    });
  };

  const handleFilterChange = (filterName: keyof typeof INITIAL_FILTERS, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const handleDateRangeChange = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
    if (selectedDate?.from && selectedDate?.to) {
      handleFilterChange('dateRange', { 
        startDate: selectedDate.from.toISOString().slice(0, 10), 
        endDate: selectedDate.to.toISOString().slice(0, 10) 
      });
    } else if (selectedDate?.from) {
         handleFilterChange('dateRange', { 
           startDate: selectedDate.from.toISOString().slice(0, 10), 
           endDate: '' 
         });
    } else {
       handleFilterChange('dateRange', { startDate: '', endDate: '' });
    }
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setDate(undefined);
  };
  
  const currentFiltersCount = Object.values(filters).filter(value => {
    if (typeof value === 'string') return value !== "" && value !== "all";
    if (typeof value === 'object' && value !== null && 'startDate' in value && 'endDate' in value) {
        return (value as {startDate: string, endDate: string}).startDate !== "" || (value as {startDate: string, endDate: string}).endDate !== "";
    }
    return false;
  }).length;

  return (
    <MainLayout>
      <div className="py-6 px-10">
        <Card id="printable-orders-area">
          <CardHeader className="pb-1 overflow-x-hidden">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex-shrink-0 min-w-[220px] flex items-center gap-4">
                <CardTitle className="text-4xl font-bold">수주 관리</CardTitle>
                <div className="flex items-center rounded-md border bg-gray-100 dark:bg-gray-800 p-0.5 shadow-sm">
                  <Button
                    variant={tableViewMode === 'summary' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => { setTableViewMode('summary'); setSortColumn('contract_date'); setSortDirection('desc'); }}
                    className={`px-3 py-1.5 h-auto text-sm rounded-sm ${tableViewMode === 'summary' ? 'bg-white dark:bg-background text-primary dark:text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700/[0.5] hover:text-accent-foreground'}`}
                  >
                    요약
                  </Button>
                  <Button
                    variant={tableViewMode === 'full' ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => { setTableViewMode('full'); setSortColumn('contract_date'); setSortDirection('desc'); }}
                    className={`px-3 py-1.5 h-auto text-sm rounded-sm ${tableViewMode === 'full' ? 'bg-white dark:bg-background text-primary dark:text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700/[0.5] hover:text-accent-foreground'}`}
                  >
                    전체
                  </Button>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-nowrap gap-2 items-end justify-end overflow-x-auto py-1">
                  <div className="relative min-w-[250px] no-print">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="프로젝트명, 담당자, 비고 검색"
                      value={filters.searchTerm}
                      onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      className="pl-8 h-10"
                    />
                  </div>
                  <div className="no-print">
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value as OrderStatus | 'all')}>
                      <SelectTrigger className="h-10 min-w-[150px]">
                        <SelectValue placeholder="계약 상태: 전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">계약 상태: 전체</SelectItem>
                        {ORDER_STATUS_OPTIONS.map((st: OrderStatus) => (
                          <SelectItem value={st} key={st}>{getStatusLabel(st)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="no-print">
                    <Select value={filters.clientType} onValueChange={(value) => handleFilterChange('clientType', value as ClientType | 'all')}>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full sm:w-auto justify-start text-left font-normal h-10 min-w-[160px] no-print ${!date && "text-muted-foreground"}`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                          date.to ? (
                            <>{formatDate(date.from.toISOString())} - {formatDate(date.to.toISOString())}</>
                          ) : (
                            formatDate(date.from.toISOString())
                          )
                        ) : (
                          <span>계약일 범위</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={handleDateRangeChange} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
                  {currentFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-10 px-2.5 no-print">
                      <X className="mr-1 h-3 w-3" />
                      초기화
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="border border-gray-300 no-print h-10 w-10" title="엑셀 내보내기" onClick={handleExportExcel}>
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="border border-gray-300 no-print h-10 w-10" title="화면 인쇄" onClick={() => window.print()}>
                    <Printer className="h-5 w-5" />
                  </Button>
                  <Button onClick={handleCreateOrder} className="h-10 min-w-[140px] no-print">
                    <Plus className="mr-2 h-4 w-4" />새 수주 등록
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div id="orders-table-container" className="rounded-md border">
              {renderOrderTable(getSortedData(), {showManagementColumn: tableViewMode === 'full'})}
            </div>
          </CardContent>
        </Card>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{formMode === 'edit' ? '수주 정보 수정' : '새 수주 등록'}</DialogTitle>
              <DialogDescription>
                {formMode === 'edit' ? '수주 계약의 상세 정보를 수정합니다.' : '새로운 수주 계약 정보를 입력합니다.'}
              </DialogDescription>
            </DialogHeader>
            <OrderForm
              initialData={selectedOrder}
              onSubmit={handleFormSubmit}
              onClose={() => setIsFormDialogOpen(false)}
              isLoading={isLoading}
              mode={formMode}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>삭제 확인</AlertDialogTitle>
              <AlertDialogDescription>
                선택한 수주 정보를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                {selectedOrder && <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">삭제 대상: {selectedOrder.project_name} (수주번호: {selectedOrder.order_number})</div>}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOrder} className="bg-red-600 hover:bg-red-700">삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {selectedOrder && (
          <FileManagerDialog
            orderId={selectedOrder.id}
            orderNumber={selectedOrder.order_number}
            projectName={selectedOrder.project_name}
            isOpen={isFileManagerOpen}
            onClose={() => { setIsFileManagerOpen(false); fetchOrders(); }}
          />
        )}

        <Dialog open={showOrderGroupDialog} onOpenChange={setShowOrderGroupDialog}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>프로젝트 계약 상세: {orderGroupDetails?.[0]?.project_name || ''}</DialogTitle>
              <DialogDescription>
                해당 프로젝트에 포함된 모든 계약 목록입니다.
                {orderGroupDetails && orderGroupDetails.length > 0 && orderGroupDetails[0]?.project_status && PROJECT_STATUS_OPTIONS.includes(orderGroupDetails[0].project_status as ProjectStatus) && (
                  <div className="mt-1">
                    <Badge 
                      variant={
                          orderGroupDetails[0].project_status === 'completed' ? 'default' : 
                          orderGroupDetails[0].project_status === 'active' || orderGroupDetails[0].project_status === 'planning' ? 'default' : 
                          orderGroupDetails[0].project_status === 'canceled' || orderGroupDetails[0].project_status === 'on_hold' ? 'destructive' : 
                          'outline'
                      }
                      className={`text-xs ${
                          orderGroupDetails[0].project_status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 
                          orderGroupDetails[0].project_status === 'active' || orderGroupDetails[0].project_status === 'planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' : ''
                      }`}
                    >
                      프로젝트 상태: {getProjectStatusLabel(orderGroupDetails[0].project_status as ProjectStatus)}
                    </Badge>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto pr-2">
              {orderGroupDetails && renderOrderTable(orderGroupDetails, {showManagementColumn: false})}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}