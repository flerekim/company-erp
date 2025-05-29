"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { OrderFormData, OrderWithFileCount } from "@/types/order"
import { ProjectStatus, getProjectStatusLabel } from "@/types/project"
import { OrderForm } from "@/components/forms/order-form"
import { orderService } from "@/lib/supabase/database"
import { FileManagerDialog } from "@/components/file-manager/file-manager-dialog"
import { FileUploadService } from "@/lib/supabase/file-upload"
import { MainLayout } from "@/components/layout/main-layout"
import { useToast } from "@/components/ui/use-toast"
import { exportOrdersToExcel } from "@/lib/orders-export"

// 분리된 컴포넌트들과 훅들
import { useOrdersData } from "@/hooks/use-orders-data"
import { useOrdersFilters } from "@/hooks/use-orders-filters"
import { OrdersHeader } from "@/components/orders/orders-header"
import { OrdersTable } from "@/components/orders/orders-table"

// 프로젝트 상태 옵션 정의
const PROJECT_STATUS_OPTIONS: ProjectStatus[] = ['planning', 'active', 'completed', 'on_hold', 'canceled'];

export default function OrdersPage() {
  const { toast } = useToast();
  
  // 커스텀 훅들로 상태 관리 분리
  const {
    filters,
    date,
    currentFiltersCount,
    handleFilterChange,
    handleDateRangeChange,
    clearFilters,
  } = useOrdersFilters();

  const {
    ordersList,
    filteredOrders,
    summaryDisplayOrders,
    isLoading,
    sortColumn,
    sortDirection,
    fetchOrders,
    getSortedData,
    handleSort,
  } = useOrdersData({ filters, date });

  // 로컬 상태들
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithFileCount | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [showOrderGroupDialog, setShowOrderGroupDialog] = useState(false)
  const [orderGroupDetails, setOrderGroupDetails] = useState<OrderWithFileCount[] | null>(null)
  const [tableViewMode, setTableViewMode] = useState<'summary' | 'full'>('summary')

  // 이벤트 핸들러들
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
    let newOrderId: string | undefined;

    try {
      console.log("=== 폼 제출 시작 ===");
      console.log("받은 데이터:", data);
      console.log("formMode:", formMode);
      
      // 폼 유효성 최종 검사
      if (!data.project_id || data.project_id.trim() === '' || !data.company_name || !data.contract_amount || 
          !data.remediation_method || !data.verification_company || !data.primary_manager ||
          !data.contamination_info || data.contamination_info.length === 0) {
        console.log("유효성 검사 실패");
        console.log("체크된 필드들:", {
          project_id: data.project_id,
          project_id_trimmed: data.project_id?.trim(),
          company_name: data.company_name,
          contract_amount: data.contract_amount,
          remediation_method: data.remediation_method,
          verification_company: data.verification_company,
          primary_manager: data.primary_manager,
          contamination_info_length: data.contamination_info?.length
        });
        toast({
          title: "입력 오류",
          description: "모든 필수 항목을 입력해주세요.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // 오염 정보 유효성 검사
      const hasInvalidContamination = data.contamination_info.some(item => !item.type || !item.value || item.value <= 0);
      if (hasInvalidContamination) {
        console.log("오염 정보 유효성 검사 실패");
        console.log("오염 정보:", data.contamination_info);
        toast({
          title: "오염 정보 오류",
          description: "모든 오염 정보에 물질과 농도를 올바르게 입력해주세요.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      console.log("=== 유효성 검사 통과 ===");

      // 수주 생성/수정 (프로젝트는 이미 모드 선택 시점에서 생성됨)
      console.log("최종 수주 데이터:", data);

      if (formMode === 'edit' && selectedOrder?.id) {
        await orderService.update(selectedOrder.id, data);
        newOrderId = selectedOrder.id;
        toast({
          title: "수정 완료",
          description: `"${data.company_name}" 수주 정보가 성공적으로 수정되었습니다.`,
          variant: "success",
          duration: 2000,
        });
      } else {
        const createdOrder = await orderService.create(data);
        if (createdOrder && createdOrder.id) {
          newOrderId = createdOrder.id;
          toast({
            title: "등록 완료",
            description: `"${data.company_name}" 수주가 성공적으로 등록되었습니다.`,
            variant: "success",
            duration: 2000,
          });
        } else {
          throw new Error("수주 등록 후 ID를 가져오지 못했습니다.");
        }
      }

      // 파일 업로드 처리
      if (newOrderId && files.length > 0) {
        let successfulUploads = 0;
        let failedUploads = 0;
        const failedFiles: string[] = [];
        
        toast({
          title: "파일 업로드 중...",
          description: `${files.length}개의 파일을 업로드하고 있습니다.`,
          variant: "default",
          duration: 1000,
        });
        
        for (const file of files) {
          try {
            const uploadResult = await FileUploadService.uploadFile(file, newOrderId, 'other'); 
            if (uploadResult.success) {
              successfulUploads++;
            } else {
              failedUploads++;
              failedFiles.push(file.name);
              console.warn(`File upload failed for ${file.name}: ${uploadResult.error}`);
            }
          } catch (error: any) {
            failedUploads++;
            failedFiles.push(file.name);
            console.error(`File upload exception for ${file.name}:`, error);
              }
        }
        
        if (successfulUploads > 0 && failedUploads === 0) {
          toast({
            title: "파일 업로드 완료",
            description: `모든 파일(${successfulUploads}개)이 성공적으로 업로드되었습니다.`,
            variant: "success",
            duration: 2000,
          });
        } else if (successfulUploads > 0 && failedUploads > 0) {
          toast({
            title: "일부 파일 업로드 실패",
            description: `${successfulUploads}개 성공, ${failedUploads}개 실패. 실패한 파일: ${failedFiles.join(', ')}`,
            variant: "destructive",
            duration: 4000,
          });
        } else if (failedUploads > 0) {
          toast({
            title: "파일 업로드 실패",
            description: `모든 파일 업로드에 실패했습니다. 실패한 파일: ${failedFiles.join(', ')}`,
            variant: "destructive",
            duration: 4000,
          });
        }
      }
      
      setIsFormDialogOpen(false);
      fetchOrders(); // 목록 새로고침
    } catch (error: any) {
      console.error("Form submission error:", error);
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      
      toast({
        title: "저장 실패",
        description: error.message || "수주 정보 저장 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
        duration: 3000,
      });
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

  const handleExportExcel = () => {
    exportOrdersToExcel(getSortedData(tableViewMode));
    toast({
        title: "엑셀 다운로드",
        description: "수주 목록이 엑셀 파일로 저장되었습니다.",
        variant: "success",
        duration: 2000,
    });
  };

  const handleTableViewModeChange = (mode: 'summary' | 'full') => {
    setTableViewMode(mode);
  };

  const handleOrderGroupDetails = (orders: OrderWithFileCount[]) => {
    setOrderGroupDetails(orders);
    setShowOrderGroupDialog(true);
  };

  return (
    <MainLayout>
      <div className="py-6 px-10">
        <Card id="printable-orders-area">
          <CardHeader className="pb-1 overflow-x-hidden">
            <OrdersHeader
              tableViewMode={tableViewMode}
              filters={filters}
              date={date}
              currentFiltersCount={currentFiltersCount}
              onTableViewModeChange={handleTableViewModeChange}
              onFilterChange={handleFilterChange}
              onDateRangeChange={handleDateRangeChange}
              onClearFilters={clearFilters}
              onCreateOrder={handleCreateOrder}
              onExportExcel={handleExportExcel}
              onPrint={() => window.print()}
            />
          </CardHeader>
          <CardContent className="pt-0">
            <div id="orders-table-container" className="rounded-md border">
              <OrdersTable
                ordersToRender={getSortedData(tableViewMode)}
                tableViewMode={tableViewMode}
                isLoading={isLoading}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                showManagementColumn={tableViewMode === 'full'}
                onSort={handleSort}
                onFileManager={handleFileManager}
                onEditOrder={handleEditOrder}
                onDeleteConfirm={handleDeleteConfirm}
                onOrderGroupDetails={handleOrderGroupDetails}
              />
            </div>
          </CardContent>
        </Card>

        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
            <DialogTitle className="sr-only">
              {formMode === 'edit' ? '수주 정보 수정' : '새 수주 등록'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {formMode === 'edit' ? '수주 계약의 상세 정보를 수정합니다.' : '새로운 수주 계약 정보를 입력합니다.'}
              </DialogDescription>
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
              {orderGroupDetails && (
                <OrdersTable
                  ordersToRender={orderGroupDetails}
                  tableViewMode="full"
                  isLoading={false}
                  sortColumn={null}
                  sortDirection="asc"
                  showManagementColumn={false}
                  onSort={() => {}}
                  onFileManager={handleFileManager}
                  onEditOrder={handleEditOrder}
                  onDeleteConfirm={handleDeleteConfirm}
                  onOrderGroupDetails={handleOrderGroupDetails}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}