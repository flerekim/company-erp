"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Search,
  X,
  Calendar as CalendarIcon,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { OrderStatus, ClientType } from "@/types/order"
import { getStatusLabel, formatDate } from "@/lib/order-utils"
import { OrdersFilters } from "@/hooks/use-orders-data"

// 계약 상태 옵션 정의
const ORDER_STATUS_OPTIONS: OrderStatus[] = ['bidding', 'contracted', 'in_progress', 'completed'];

interface OrdersFiltersProps {
  filters: OrdersFilters
  date?: DateRange
  currentFiltersCount: number
  onFilterChange: (filterName: keyof OrdersFilters, value: any) => void
  onDateRangeChange: (selectedDate: DateRange | undefined) => void
  onClearFilters: () => void
}

export function OrdersFiltersComponent({
  filters,
  date,
  currentFiltersCount,
  onFilterChange,
  onDateRangeChange,
  onClearFilters,
}: OrdersFiltersProps) {
  return (
    <div className="flex flex-nowrap gap-2 items-end justify-end overflow-x-auto py-1">
      <div className="relative min-w-[250px] no-print">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="프로젝트명, 담당자, 비고 검색"
          value={filters.searchTerm}
          onChange={(e) => onFilterChange('searchTerm', e.target.value)}
          className="pl-8 h-10"
        />
      </div>
      <div className="no-print">
        <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value as OrderStatus | 'all')}>
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
        <Select value={filters.clientType} onValueChange={(value) => onFilterChange('clientType', value as ClientType | 'all')}>
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
          <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={onDateRangeChange} numberOfMonths={2} />
        </PopoverContent>
      </Popover>
      {currentFiltersCount > 0 && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-xs h-10 px-2.5 no-print">
          <X className="mr-1 h-3 w-3" />
          초기화
        </Button>
      )}
    </div>
  );
} 