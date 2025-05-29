"use client"

import { Button } from "@/components/ui/button"
import { CardTitle } from "@/components/ui/card"
import {
  Plus,
  Download,
  Printer,
} from "lucide-react"
import { OrdersFiltersComponent } from "./orders-filters"
import { OrdersFilters } from "@/hooks/use-orders-data"
import { DateRange } from "react-day-picker"

interface OrdersHeaderProps {
  tableViewMode: 'summary' | 'full'
  filters: OrdersFilters
  date?: DateRange
  currentFiltersCount: number
  onTableViewModeChange: (mode: 'summary' | 'full') => void
  onFilterChange: (filterName: keyof OrdersFilters, value: any) => void
  onDateRangeChange: (selectedDate: DateRange | undefined) => void
  onClearFilters: () => void
  onCreateOrder: () => void
  onExportExcel: () => void
  onPrint: () => void
}

export function OrdersHeader({
  tableViewMode,
  filters,
  date,
  currentFiltersCount,
  onTableViewModeChange,
  onFilterChange,
  onDateRangeChange,
  onClearFilters,
  onCreateOrder,
  onExportExcel,
  onPrint,
}: OrdersHeaderProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex-shrink-0 min-w-[220px] flex items-center gap-4">
        <CardTitle className="text-4xl font-bold">수주 관리</CardTitle>
        <div className="flex items-center rounded-md border bg-gray-100 dark:bg-gray-800 p-0.5 shadow-sm">
          <Button
            variant={tableViewMode === 'summary' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onTableViewModeChange('summary')}
            className={`px-3 py-1.5 h-auto text-sm rounded-sm ${tableViewMode === 'summary' ? 'bg-white dark:bg-background text-primary dark:text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700/[0.5] hover:text-accent-foreground'}`}
          >
            요약
          </Button>
          <Button
            variant={tableViewMode === 'full' ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onTableViewModeChange('full')}
            className={`px-3 py-1.5 h-auto text-sm rounded-sm ${tableViewMode === 'full' ? 'bg-white dark:bg-background text-primary dark:text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700/[0.5] hover:text-accent-foreground'}`}
          >
            전체
          </Button>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex flex-nowrap gap-2 items-end justify-end overflow-x-auto py-1">
          <OrdersFiltersComponent
            filters={filters}
            date={date}
            currentFiltersCount={currentFiltersCount}
            onFilterChange={onFilterChange}
            onDateRangeChange={onDateRangeChange}
            onClearFilters={onClearFilters}
          />
          <Button variant="outline" size="icon" className="border border-gray-300 no-print h-10 w-10" title="엑셀 내보내기" onClick={onExportExcel}>
            <Download className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" className="border border-gray-300 no-print h-10 w-10" title="화면 인쇄" onClick={onPrint}>
            <Printer className="h-5 w-5" />
          </Button>
          <Button onClick={onCreateOrder} className="h-10 min-w-[140px] no-print">
            <Plus className="mr-2 h-4 w-4" />새 수주 등록
          </Button>
        </div>
      </div>
    </div>
  );
} 