"use client"

import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Loader2,
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { OrderWithFileCount, ContaminationItem } from "@/types/order"
import { ProjectStatus, getProjectStatusLabel } from "@/types/project"
import {
  formatCurrency,
  formatDate,
  getClientTypeBadge,
  getStatusBadge,
  getTransportTypeBadge,
  getTransportTypeLabel,
  getStatusLabel,
  getContaminationGroups,
  getContaminationDisplay,
  toContaminationArray
} from "@/lib/order-utils"

interface OrdersTableProps {
  ordersToRender: OrderWithFileCount[]
  tableViewMode: 'summary' | 'full'
  isLoading: boolean
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  showManagementColumn?: boolean
  onSort: (column: string) => void
  onFileManager: (order: OrderWithFileCount) => void
  onEditOrder: (order: OrderWithFileCount) => void
  onDeleteConfirm: (order: OrderWithFileCount) => void
  onOrderGroupDetails: (orders: OrderWithFileCount[]) => void
}

export function OrdersTable({
  ordersToRender,
  tableViewMode,
  isLoading,
  sortColumn,
  sortDirection,
  showManagementColumn = true,
  onSort,
  onFileManager,
  onEditOrder,
  onDeleteConfirm,
  onOrderGroupDetails,
}: OrdersTableProps) {
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <div className="w-4 h-4"></div>; // 투명한 공간 확보
    }
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const isSummaryMode = tableViewMode === 'summary';
  
  // 요약 모드: No, 계약상태, 고객사 유형, 프로젝트명, 고객사명, 계약일, 계약금액, 정화장소, 진행률, 오염정보, 파일 = 11개
  // 전체 모드: 기존과 동일 = 12개 (상태 컬럼 제거되어 수주번호까지 포함)
  const summaryColSpan = 11 + (showManagementColumn ? 1 : 0);
  const fullColSpan = 12 + (showManagementColumn ? 1 : 0);
  const currentTableColSpan = isSummaryMode ? summaryColSpan : fullColSpan;

  return (
    <Table className="min-w-full whitespace-nowrap">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px] text-center">No</TableHead>
          {isSummaryMode ? (
            // 요약 모드 헤더
            <>
              <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('status')}>
                <div className="flex items-center justify-center relative">
                  <span>계약상태</span>
                  <div className="absolute right-0">
                    {renderSortIcon('status')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('client_type')}>
                <div className="flex items-center justify-center relative">
                  <span>고객사 유형</span>
                  <div className="absolute right-0">
                    {renderSortIcon('client_type')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[200px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('project_name')}>
                <div className="flex items-center justify-center relative">
                  <span>프로젝트명</span>
                  <div className="absolute right-0">
                    {renderSortIcon('project_name')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[150px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('company_name')}>
                <div className="flex items-center justify-center relative">
                  <span>고객사명</span>
                  <div className="absolute right-0">
                    {renderSortIcon('company_name')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[110px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('contract_date')}>
                <div className="flex items-center justify-center relative">
                  <span>계약일</span>
                  <div className="absolute right-0">
                    {renderSortIcon('contract_date')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[130px] text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort('contract_amount')}>
                <div className="flex items-center justify-center relative">
                  <span>계약금액</span>
                  <div className="absolute right-0">
                    {renderSortIcon('contract_amount')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('transport_type')}>
                <div className="flex items-center justify-center relative">
                  <span>정화장소</span>
                  <div className="absolute right-0">
                    {renderSortIcon('transport_type')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('progress_percentage')}>
                <div className="flex items-center justify-center relative">
                  <span>진행률</span>
                  <div className="absolute right-0">
                    {renderSortIcon('progress_percentage')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[120px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('contamination_info')}>
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
            // 전체 모드 헤더
            <>
              <TableHead className="w-[200px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('project_name')}>
                <div className="flex items-center justify-center relative">
                  <span>프로젝트명</span>
                  <div className="absolute right-0">
                    {renderSortIcon('project_name')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('project_status')}>
                <div className="flex items-center justify-center relative">
                  <span>상태</span>
                  <div className="absolute right-0">
                    {renderSortIcon('project_status')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[150px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('order_number')}>
                <div className="flex items-center justify-center relative">
                  <span>수주번호</span>
                  <div className="absolute right-0">
                    {renderSortIcon('order_number')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[150px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('company_name')}>
                <div className="flex items-center justify-center relative">
                  <span>고객사명</span>
                  <div className="absolute right-0">
                    {renderSortIcon('company_name')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[110px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('contract_date')}>
                <div className="flex items-center justify-center relative">
                  <span>계약일</span>
                  <div className="absolute right-0">
                    {renderSortIcon('contract_date')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[130px] text-right cursor-pointer hover:bg-muted/50" onClick={() => onSort('contract_amount')}>
                <div className="flex items-center justify-center relative">
                  <span>계약금액</span>
                  <div className="absolute right-0">
                    {renderSortIcon('contract_amount')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('status')}>
                <div className="flex items-center justify-center relative">
                  <span>계약상태</span>
                  <div className="absolute right-0">
                    {renderSortIcon('status')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('transport_type')}>
                <div className="flex items-center justify-center relative">
                  <span>정화장소</span>
                  <div className="absolute right-0">
                    {renderSortIcon('transport_type')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('progress_percentage')}>
                <div className="flex items-center justify-center relative">
                  <span>진행률</span>
                  <div className="absolute right-0">
                    {renderSortIcon('progress_percentage')}
                  </div>
                </div>
              </TableHead>
              <TableHead className="w-[120px] text-center cursor-pointer hover:bg-muted/50" onClick={() => onSort('contamination_info')}>
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
          {showManagementColumn && <TableHead className="w-[80px] text-center">관리</TableHead>}
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
                // 요약 모드 데이터 셀
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
                      <Button variant="link" className="p-0 h-auto text-left whitespace-normal" onClick={() => onOrderGroupDetails(order.all_orders || [])}>
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
                      onClick={() => onFileManager(order)}
                      disabled={!order.id}
                      className="h-auto py-1"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="ml-1 text-xs">({order.fileCount ?? 0})</span>
                    </Button>
                  </TableCell>
                </>
              ) : (
                // 전체 모드 데이터 셀
                <>
                  <TableCell className="font-medium text-center whitespace-pre-wrap">
                    {isSummaryMode && order.all_orders && order.all_orders.length > 1 ? (
                      <Button variant="link" className="p-0 h-auto text-left whitespace-normal" onClick={() => onOrderGroupDetails(order.all_orders || [])}>
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
                      onClick={() => onFileManager(order)}
                      disabled={!order.id}
                      className="h-auto py-1"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="ml-1 text-xs">({order.fileCount ?? 0})</span>
                    </Button>
                  </TableCell>
                </>
              )}
              {showManagementColumn && (
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">메뉴 열기</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditOrder(order)}>
                        <Edit className="mr-2 h-4 w-4" /> 수정
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteConfirm(order)} className="text-red-600 hover:text-red-700 focus:text-red-700">
                        <Trash2 className="mr-2 h-4 w-4" /> 삭제
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onOrderGroupDetails(order.all_orders || [order])}>
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