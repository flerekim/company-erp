import { useState, useEffect, useMemo } from "react";
import { OrderWithFileCount, ContaminationItem } from "@/types/order";
import { ProjectStatus, getProjectStatusLabel } from "@/types/project";
import { orderService } from "@/lib/supabase/database";
import { supabase } from "@/lib/supabase/client";
import { toContaminationArray, getContaminationDisplay, getTransportTypeLabel, getStatusLabel } from "@/lib/order-utils";
import { useToast } from "@/components/ui/use-toast";

export interface OrdersFilters {
  searchTerm: string;
  clientType: "all" | "government" | "private";
  status: "all" | "bidding" | "contracted" | "in_progress" | "completed";
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface UseOrdersDataProps {
  filters: OrdersFilters;
  date?: { from?: Date; to?: Date };
}

export function useOrdersData({ filters, date }: UseOrdersDataProps) {
  const { toast } = useToast();
  const [ordersList, setOrdersList] = useState<OrderWithFileCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>('contract_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await orderService.getAll();
      
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
              .eq('order_id', order.id);
            if (error) {
              console.warn(`파일 개수 조회 실패 for order ${order.id}:`, error.message);
              return { ...order, fileCount: 0 } as OrderWithFileCount;
            }
            return { ...order, fileCount: count || 0 } as OrderWithFileCount;
          } catch (error: any) {
            console.warn(`파일 개수 조회 예외 for order ${order.id}:`, error?.message || error);
            return { ...order, fileCount: 0 } as OrderWithFileCount;
          }
        })
      );
      setOrdersList(ordersWithFileCount);
    } catch (error: any) {
      console.error('수주 데이터 조회 실패:', error?.message || error);
      setOrdersList([]);
      toast({
        title: "데이터 조회 실패",
        description: "수주 목록을 가져오는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return ordersList.filter((order) => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearch = !filters.searchTerm ||
        order.project_name?.toLowerCase().includes(searchTermLower) ||
        order.company_name?.toLowerCase().includes(searchTermLower) ||
        order.order_number?.toLowerCase().includes(searchTermLower);

      const matchesClientType = filters.clientType === "all" || order.client_type === filters.clientType;
      const matchesOrderStatus = filters.status === "all" || order.status === filters.status;

      let matchesDateRange = true;
      if (date?.from && date?.to) {
        const orderDate = new Date(order.contract_date);
        orderDate.setHours(0,0,0,0);
        const fromDate = new Date(date.from);
        fromDate.setHours(0,0,0,0);
        const toDate = new Date(date.to);
        toDate.setHours(23,59,59,999);
        matchesDateRange = orderDate >= fromDate && orderDate <= toDate;
      } else if (date?.from) {
        const orderDate = new Date(order.contract_date);
        const fromDate = new Date(date.from);
        fromDate.setHours(0,0,0,0);
        matchesDateRange = orderDate >= fromDate;
      } else if (filters.dateRange.startDate || filters.dateRange.endDate) {
        const orderDate = new Date(order.contract_date);
        if (filters.dateRange.startDate && filters.dateRange.endDate) {
          const startDate = new Date(filters.dateRange.startDate);
          const endDate = new Date(filters.dateRange.endDate);
          matchesDateRange = orderDate >= startDate && orderDate <= endDate;
        } else if (filters.dateRange.startDate) {
          const startDate = new Date(filters.dateRange.startDate);
          matchesDateRange = orderDate >= startDate;
        } else if (filters.dateRange.endDate) {
          const endDate = new Date(filters.dateRange.endDate);
          matchesDateRange = orderDate <= endDate;
        }
      }

      return matchesSearch && matchesClientType && matchesOrderStatus && matchesDateRange;
    });
  }, [ordersList, filters, date]);

  const groupByProject = (orders: OrderWithFileCount[]): Record<string, OrderWithFileCount[]> => {
    return orders.reduce((groups, order) => {
      const key = order.project_name || 'Unknown';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
      return groups;
    }, {} as Record<string, OrderWithFileCount[]>);
  };

  const summaryDisplayOrders = useMemo(() => {
    const grouped = groupByProject(filteredOrders);
    return Object.values(grouped).map(projectOrders => {
      const primaryOrder = projectOrders[0];
      return {
        ...primaryOrder,
        all_orders: projectOrders,
        contract_amount: projectOrders.reduce((sum, order) => sum + (order.contract_amount || 0), 0),
        progress_percentage: Math.round(
          projectOrders.reduce((sum, order) => sum + (order.progress_percentage || 0), 0) / projectOrders.length
        )
      };
    });
  }, [filteredOrders]);

  const getSortedData = (tableViewMode: 'summary' | 'full') => {
    const dataToSort = tableViewMode === 'summary' ? summaryDisplayOrders : filteredOrders;
    
    if (!sortColumn) return dataToSort;

    return [...dataToSort].sort((a, b) => {
      let aValue = (a as any)[sortColumn];
      let bValue = (b as any)[sortColumn];

      if (sortColumn === 'contract_amount') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortColumn === 'progress_percentage') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortColumn === 'contract_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sortColumn === 'contamination_info') {
        aValue = getContaminationDisplay(aValue);
        bValue = getContaminationDisplay(bValue);
      } else if (sortColumn === 'transport_type') {
        aValue = getTransportTypeLabel(aValue);
        bValue = getTransportTypeLabel(bValue);
      } else if (sortColumn === 'status') {
        aValue = getStatusLabel(aValue);
        bValue = getStatusLabel(bValue);
      } else {
        aValue = String(aValue || '').toLowerCase();
        bValue = String(bValue || '').toLowerCase();
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
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return {
    ordersList,
    filteredOrders,
    summaryDisplayOrders,
    isLoading,
    sortColumn,
    sortDirection,
    fetchOrders,
    getSortedData,
    handleSort,
  };
} 