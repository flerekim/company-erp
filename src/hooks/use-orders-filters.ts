import { useState } from "react";
import { DateRange } from "react-day-picker";
import { OrdersFilters } from "./use-orders-data";

const INITIAL_FILTERS: OrdersFilters = {
  searchTerm: "",
  clientType: "all",
  status: "all",
  dateRange: {
    startDate: "",
    endDate: ""
  }
};

export function useOrdersFilters() {
  const [filters, setFilters] = useState<OrdersFilters>(INITIAL_FILTERS);
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const handleFilterChange = (filterName: keyof OrdersFilters, value: any) => {
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

  return {
    filters,
    date,
    currentFiltersCount,
    handleFilterChange,
    handleDateRangeChange,
    clearFilters,
  };
} 