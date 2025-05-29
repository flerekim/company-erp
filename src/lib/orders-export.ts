import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import { OrderWithFileCount, OrderType } from "@/types/order";
import { ProjectStatus, getProjectStatusLabel } from "@/types/project";
import { 
  formatDate, 
  formatCurrency, 
  getStatusLabel, 
  getTransportTypeLabel, 
  getOrderTypeLabel, 
  getContaminationDisplay 
} from "@/lib/order-utils";

export function exportOrdersToExcel(orders: OrderWithFileCount[]) {
  const dataToExport = orders.map(order => ({
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
  const colWidths = Object.keys(dataToExport[0] || {}).map(key => ({ 
    wch: Math.max(20, key.length, ...dataToExport.map(row => String(row[key as keyof typeof row]).length)) 
  }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSXUtils.book_new();
  XLSXUtils.book_append_sheet(workbook, worksheet, "수주목록");
  const simpleDate = new Date().toISOString().slice(0,10).replace(/-/g,"");
  XLSXWriteFile(workbook, `수주목록_${simpleDate}.xlsx`);
} 