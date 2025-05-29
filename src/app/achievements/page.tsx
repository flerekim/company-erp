"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  Printer,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { Order, OrderStatus, ClientType, TransportType } from "@/types/order"; // 수주 타입
import { Achievement, AchievementFormData, AchievementUnit, ACHIEVEMENT_UNITS, getAchievementUnitLabel } from "@/types/achievement"; // 실적 타입
import { AchievementForm } from "@/components/forms/achievement-form"; // 실적 폼 컴포넌트 생성 예정 -> 생성 완료
import { orderService } from "@/lib/supabase/database"; // 수주 정보 조회용
import { achievementService } from "@/lib/supabase/achievement-service"; // TODO: 실적 CRUD 서비스 생성 예정 -> 다음 단계에서 생성
import { MainLayout } from "@/components/layout/main-layout";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import {
  formatCurrency,
  formatDate,
  getClientTypeBadge,
  getStatusBadge,
  getTransportTypeBadge,
  getTransportTypeLabel,
  getStatusLabel,
} from "@/lib/order-utils"; // 수주 유틸리티 함수 재활용

// 초기 필터 상태 정의
const INITIAL_FILTERS = {
  searchTerm: "", // 프로젝트명, 담당자 등
  project_name: "all", // 특정 프로젝트 필터
  clientType: "all" as ClientType | "all",
  status: "all" as OrderStatus | "all",
  dateRange: { // 실적일자 기준
    startDate: "",
    endDate: ""
  }
};

// 정렬 기본값 정의
const DEFAULT_SORT_DIRECTION = 'asc';

export default function AchievementsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  
  const [isLoading, setIsLoading] = useState(false);
  const [achievementsList, setAchievementsList] = useState<Achievement[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]); // 프로젝트명 선택용 수주 목록

  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(DEFAULT_SORT_DIRECTION);

  // 수주 목록 데이터 가져오기 (프로젝트명 선택용)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const orders = await orderService.getAll(); // ID, project_name 등 최소 정보만 가져와도 됨
        setAllOrders(orders);
      } catch (error) {
        console.error("수주 목록 조회 실패:", error);
        setAllOrders([]);
      }
    };
    fetchOrders();
  }, []);

  // 실적 목록 데이터 가져오기
  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const data = await achievementService.getAll();
        setAchievementsList(data);
      } catch (error) {
        console.error("실적 데이터 조회 실패:", error);
        // TODO: 사용자에게 오류 알림 (toast 등)
        setAchievementsList([]);
      }
      setIsLoading(false);
    };
    fetchAchievements();
  }, []);

  const filteredAchievements = achievementsList.filter((achievement) => {
    const searchTermLower = filters.searchTerm.toLowerCase();
    const matchesSearch = !filters.searchTerm ||
      achievement.project_name.toLowerCase().includes(searchTermLower) ||
      (achievement.manager && achievement.manager.toLowerCase().includes(searchTermLower)) ||
      (achievement.remarks && achievement.remarks.toLowerCase().includes(searchTermLower));

    const matchesProjectName = filters.project_name === "all" || achievement.project_name === filters.project_name;
    const matchesClientType = filters.clientType === "all" || achievement.client_type === filters.clientType;
    const matchesStatus = filters.status === "all" || achievement.status === filters.status;
    
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
        const achievementDate = new Date(achievement.achievement_date);
        const startDate = new Date(filters.dateRange.startDate);
        const endDate = new Date(filters.dateRange.endDate);
        achievementDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        
        const matchesDateRange = achievementDate >= startDate && achievementDate <= endDate;
        return matchesSearch && matchesProjectName && matchesClientType && matchesStatus && matchesDateRange;
    }
    
    const matchesDateRangeLoose = 
      (!filters.dateRange.startDate || new Date(achievement.achievement_date) >= new Date(filters.dateRange.startDate)) &&
      (!filters.dateRange.endDate || new Date(achievement.achievement_date) <= new Date(filters.dateRange.endDate));

    return matchesSearch && matchesProjectName && matchesClientType && matchesStatus && matchesDateRangeLoose;
  });

  const getSortedData = () => {
    const dataToSort = [...filteredAchievements];
    if (!sortColumn) return dataToSort;

    return dataToSort.sort((a, b) => {
      let aValue: any = a[sortColumn as keyof Achievement];
      let bValue: any = b[sortColumn as keyof Achievement];

      // 숫자형 컬럼 처리
      if (['quantity', 'unit_price', 'amount'].includes(sortColumn)) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } 
      // 날짜형 컬럼 처리
      else if (sortColumn === 'achievement_date') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      // enum 또는 badge 표시 컬럼 처리
      else if (sortColumn === 'status') {
        aValue = getStatusLabel(a.status);
        bValue = getStatusLabel(b.status);
      }
      else if (sortColumn === 'client_type') {
        aValue = a.client_type === 'government' ? '관수' : '민수';
        bValue = b.client_type === 'government' ? '관수' : '민수';
      }
      else if (sortColumn === 'transport_type') {
        aValue = getTransportTypeLabel(a.transport_type);
        bValue = getTransportTypeLabel(b.transport_type);
      }
      else if (sortColumn === 'unit') {
        aValue = getAchievementUnitLabel(a.unit);
        bValue = getAchievementUnitLabel(b.unit);
      }
      // 문자열 컬럼 처리 (대소문자 구분 없이)
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  const finalSortedAchievements = getSortedData();

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      if (sortDirection === 'desc') { // 두 번 클릭 시 정렬 해제
         setSortColumn(null);
         setSortDirection(DEFAULT_SORT_DIRECTION);
      }
    } else {
      setSortColumn(column);
      setSortDirection(DEFAULT_SORT_DIRECTION);
    }
  };

  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600 ml-1" />
      : <ChevronDown className="h-4 w-4 text-blue-600 ml-1" />;
  };

  const handleCreateAchievement = () => {
    setFormMode('create');
    setSelectedAchievement(null);
    setIsFormDialogOpen(true);
  };

  const handleEditAchievement = (achievement: Achievement) => {
    setFormMode('edit');
    setSelectedAchievement(achievement);
    setIsFormDialogOpen(true);
  };

  const handleDeleteConfirm = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: AchievementFormData) => {
    setIsLoading(true);
    try {
      if (formMode === 'create') {
        await achievementService.create(data);
      } else if (formMode === 'edit' && selectedAchievement) {
        await achievementService.update(selectedAchievement.id, data);
      }
      await refreshAchievements();
      setIsFormDialogOpen(false);
      // 성공 토스트는 achievement-form.tsx 에서 이미 처리하고 있음
    } catch (error) {
      console.error("실적 저장 실패:", error);
      // 실패 토스트도 achievement-form.tsx 에서 이미 처리하고 있음 
      // 단, 네트워크 오류 등 onSubmit 프라미스 자체가 reject 된 경우는 여기서 처리 가능
      // toast({ title: "저장 실패", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAchievement = async () => {
    if (!selectedAchievement) return;
    setIsLoading(true);
    try {
      await achievementService.delete(selectedAchievement.id);
      await refreshAchievements();
      setIsDeleteDialogOpen(false);
      setSelectedAchievement(null);
      // TODO: 성공 알림 (toast)
      // toast({ title: "삭제 완료", description: "실적이 삭제되었습니다.", variant: "success" });
    } catch (error) {
      console.error("실적 삭제 실패:", error);
      // TODO: 사용자에게 오류 알림 (toast)
      // toast({ title: "삭제 실패", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAchievements = async () => {
    setIsLoading(true);
    try {
      const data = await achievementService.getAll();
      setAchievementsList(data);
    } catch (error) {
      console.error("실적 목록 새로고침 실패:", error);
      // TODO: 사용자에게 오류 알림
    }
    setIsLoading(false);
  };
  
  const handleExportExcel = () => {
    const exportData = finalSortedAchievements.map((ach) => ({
      상태: getStatusLabel(ach.status),
      고객사유형: ach.client_type === 'government' ? '관수' : '민수',
      프로젝트명: ach.project_name,
      담당자: ach.manager,
      일자: formatDate(ach.achievement_date),
      정화장소: getTransportTypeLabel(ach.transport_type),
      단위: getAchievementUnitLabel(ach.unit),
      수량: ach.quantity,
      단가: ach.unit_price,
      금액: ach.amount,
      비고: ach.remarks || ''
    }));
    const ws = XLSXUtils.json_to_sheet(exportData);
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, "실적목록");
    XLSXWriteFile(wb, "실적목록.xlsx");
  };

  // 컬럼 정의
  const columns = [
    { key: 'status', label: '상태', className: "w-[80px]" },
    { key: 'client_type', label: '고객사 유형', className: "w-[100px]" },
    { key: 'project_name', label: '프로젝트명', className: "w-[200px] truncate" },
    { key: 'manager', label: '담당자', className: "w-[100px]" },
    { key: 'achievement_date', label: '일자', className: "w-[120px]" },
    { key: 'transport_type', label: '정화장소', className: "w-[100px]" },
    { key: 'unit', label: '단위', className: "w-[80px]" },
    { key: 'quantity', label: '수량', className: "w-[100px]" },
    { key: 'unit_price', label: '단가', className: "w-[120px]" },
    { key: 'amount', label: '금액', className: "w-[120px]" },
    { key: 'remarks', label: '비고', className: "w-[150px] truncate" },
  ];

  return (
    <MainLayout>
      <div className="py-6 px-10">
        <Card id="printable-achievements-area">
          <CardHeader className="pb-1 overflow-x-hidden">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex-shrink-0 min-w-[220px]">
                <CardTitle className="text-4xl font-bold">실적 관리</CardTitle>
              </div>
              <div className="flex-1">
                <div className="flex flex-nowrap gap-2 items-end justify-end overflow-x-auto py-1"> {/* gap-5 to gap-2 for tighter packing */}
                  <div className="relative min-w-[250px] no-print"> {/* min-w-[300px] to min-w-[250px] */}
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="프로젝트명, 담당자, 비고 검색"
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="pl-8 h-10"
                      />
                  </div>
                  <div className="no-print">
                    <Select
                      value={filters.project_name}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, project_name: value }))}
                    >
                      <SelectTrigger className="h-10 min-w-[180px]"> {/* min-w-[150px] to min-w-[180px] */}
                        <SelectValue placeholder="프로젝트명: 전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">프로젝트명: 전체</SelectItem>
                        {allOrders.map(order => (
                          <SelectItem key={order.id} value={order.project_name}>
                            {order.project_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  {/* 추가 필터 (상태, 실적일자 등) 수주관리 페이지 참조하여 추가 가능 */}
                  <Input
                      type="date"
                      value={filters.dateRange.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, startDate: e.target.value } }))}
                      className="h-10 min-w-[100px] max-w-[130px] no-print" // max-w 줄임
                  />
                  <Input
                      type="date"
                      value={filters.dateRange.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, endDate: e.target.value } }))}
                      className="h-10 min-w-[100px] max-w-[130px] no-print" // max-w 줄임
                  />
                  <Button variant="outline" size="icon" className="border border-gray-300 no-print" title="엑셀 내보내기" onClick={handleExportExcel}>
                    <Download className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="border border-gray-300 no-print" title="화면 인쇄" onClick={() => window.print()}>
                    <Printer className="h-5 w-5" />
                  </Button>
                  <Button onClick={handleCreateAchievement} className="h-10 min-w-[140px] no-print">
                    <Plus className="mr-2 h-4 w-4" />새 실적 등록
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div id="achievements-table-container" className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className={`${col.className} text-center text-base cursor-pointer hover:bg-gray-50 group select-none`}
                        onClick={() => handleSort(col.key)}
                      >
                        <div className="flex items-center justify-center">
                          {col.label}
                          {renderSortIcon(col.key)}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="w-[80px] text-center text-base">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-muted-foreground">데이터를 불러오는 중...</p>
                      </TableCell>
                    </TableRow>
                  ) : finalSortedAchievements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="text-center py-8">
                        <p className="text-muted-foreground">조회된 실적이 없습니다.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    finalSortedAchievements.map((ach) => (
                      <TableRow key={ach.id}>
                        <TableCell className="w-[80px] text-center">
                          <Badge className={getStatusBadge(ach.status)}>{getStatusLabel(ach.status)}</Badge>
                        </TableCell>
                        <TableCell className="w-[100px] text-center">
                          <Badge className={getClientTypeBadge(ach.client_type)}>{ach.client_type === 'government' ? '관수' : '민수'}</Badge>
                        </TableCell>
                        <TableCell className="w-[200px] text-center truncate">{ach.project_name}</TableCell>
                        <TableCell className="w-[100px] text-center">{ach.manager}</TableCell>
                        <TableCell className="w-[120px] text-center">{formatDate(ach.achievement_date)}</TableCell>
                        <TableCell className="w-[100px] text-center">
                           <Badge className={getTransportTypeBadge(ach.transport_type)}>{getTransportTypeLabel(ach.transport_type)}</Badge>
                        </TableCell>
                        <TableCell className="w-[80px] text-center">{getAchievementUnitLabel(ach.unit)}</TableCell>
                        <TableCell className="w-[100px] text-center">{ach.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="w-[120px] text-center">{formatCurrency(ach.unit_price)}</TableCell>
                        <TableCell className="w-[120px] text-center">{formatCurrency(ach.amount)}</TableCell>
                        <TableCell className="w-[150px] text-center truncate" title={ach.remarks}>{ach.remarks}</TableCell>
                        <TableCell className="w-[80px] text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditAchievement(ach)}>
                                <Edit className="mr-2 h-4 w-4" />수정
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteConfirm(ach)}>
                                <Trash2 className="mr-2 h-4 w-4" />삭제
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

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="sm:max-w-[600px] lg:max-w-[700px]"> {/* 너비 조정 */}
            <DialogHeader>
              <DialogTitle>{formMode === 'create' ? '새 실적 등록' : '실적 수정'}</DialogTitle>
              <DialogDescription>실적 정보를 입력하거나 수정합니다.</DialogDescription>
            </DialogHeader>
            {/* TODO: AchievementForm 컴포넌트 렌더링 */}
            <AchievementForm
              onSubmit={handleFormSubmit}
              initialData={selectedAchievement}
              orders={allOrders} // 프로젝트명 선택용
              mode={formMode}
              isLoading={isLoading}
              onClose={() => setIsFormDialogOpen(false)}
            />
            {/* <div>실적 폼이 여기에 들어갈 예정입니다.</div> */}
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>선택한 실적을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAchievement}>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
} 