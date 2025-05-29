"use client"

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';

import { Order } from "@/types/order";
import { Achievement, AchievementFormData, AchievementUnit, ACHIEVEMENT_UNITS, getAchievementUnitLabel } from "@/types/achievement";
import { Project } from "@/types/project";
import { useToast } from "@/components/ui/use-toast";
import { getClientTypeLabel, getStatusLabel, getTransportTypeLabel } from "@/lib/order-utils";
import { supabase } from "@/lib/supabase/client";

// Zod 스키마 정의
const achievementFormSchema = z.object({
  project_id: z.string().min(1, "프로젝트를 선택해주세요."),
  order_id: z.string().min(1, "수주 계약을 선택해주세요."),
  project_name: z.string(), 
  achievement_date: z.string().min(1, "실적 일자를 선택해주세요.").refine(date => !isNaN(parseISO(date).valueOf()), {message: "유효한 날짜를 입력해주세요."}),
  unit: z.enum(['ton', 'm3', 'unit', 'none'], { required_error: "단위를 선택해주세요." }),
  quantity: z.number().positive({ message: "수량은 0보다 커야 합니다." }),
  unit_price: z.number().positive({ message: "단가는 0보다 커야 합니다." }),
  amount: z.number().positive({ message: "금액은 0보다 커야 합니다." }),
  remarks: z.string().optional(),
  // 자동 완성 필드 타입 구체화
  client_type: z.enum(['government', 'private']).optional(),
  status: z.enum(['contracted', 'in_progress', 'completed', 'bidding']).optional(),
  manager: z.string().optional(),
  transport_type: z.enum(['onsite', 'transport']).optional(),
});

interface AchievementFormProps {
  initialData?: Achievement | null;
  projects: Project[];
  onSubmit: (data: AchievementFormData) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const formatNumberWithCommasAndDecimal = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return '';
  const numStr = String(value).replace(/[^0-9.]/g, '');
  const parts = numStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts[1]) {
    parts[1] = parts[1].substring(0, 2);
  }
  return parts.join('.');
};

const parseFormattedNumber = (value: string): number => {
  if (value === '' || value === null || value === undefined) return 0;
  const num = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(num) ? 0 : num;
};

export function AchievementForm({
  initialData,
  projects,
  onSubmit,
  onClose,
  isLoading = false,
  mode,
}: AchievementFormProps) {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialData?.project_id || null);
  const [projectOrders, setProjectOrders] = useState<Order[]>([]);
  const [isLoadingProjectOrders, setIsLoadingProjectOrders] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const [quantityDisplay, setQuantityDisplay] = useState('');
  const [unitPriceDisplay, setUnitPriceDisplay] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');

  const form = useForm<AchievementFormData>({
    resolver: zodResolver(achievementFormSchema),
    defaultValues: {
      project_id: initialData?.project_id || "",
      order_id: initialData?.order_id || "",
      project_name: initialData?.project_name || "", 
      achievement_date: initialData?.achievement_date ? format(parseISO(initialData.achievement_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      unit: initialData?.unit || 'ton',
      quantity: initialData?.quantity || 0,
      unit_price: initialData?.unit_price || 0,
      amount: initialData?.amount || 0,
      remarks: initialData?.remarks || "",
      client_type: initialData?.client_type || undefined,
      status: initialData?.status || undefined,
      manager: initialData?.manager || undefined,
      transport_type: initialData?.transport_type || undefined,
    },
  });

  useEffect(() => {
    if (selectedProjectId) {
      setIsLoadingProjectOrders(true);
      const fetchProjectOrders = async () => {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('project_id', selectedProjectId)
          .order('contract_date', { ascending: false });

        if (error) {
          console.error("Error fetching orders for project:", error);
          setProjectOrders([]);
          toast({ title: "수주 목록 조회 실패", description: "선택된 프로젝트의 수주 목록을 가져오지 못했습니다.", variant: "destructive" });
        } else {
          setProjectOrders(data || []);
          // 수정 모드이고, 초기 order_id가 있으며, 현재 선택된 프로젝트와 일치하는 경우, 해당 order를 찾아 selectedOrderDetails 설정
          if (mode === 'edit' && initialData && initialData.order_id && selectedProjectId === initialData.project_id) {
            const orderForEdit = (data || []).find(o => o.id === initialData.order_id);
            setSelectedOrderDetails(orderForEdit || null);
            // 자동완성 필드 설정
            form.setValue('client_type', orderForEdit?.client_type);
            form.setValue('status', orderForEdit?.status);
            form.setValue('manager', orderForEdit?.primary_manager);
            form.setValue('transport_type', orderForEdit?.transport_type);
          }
        }
        setIsLoadingProjectOrders(false);
      };
      fetchProjectOrders();
      
      if (mode === 'create' || (mode === 'edit' && initialData?.project_id !== selectedProjectId)) {
         form.setValue('order_id', '');
         setSelectedOrderDetails(null);
         form.setValue('client_type', undefined);
         form.setValue('status', undefined);
         form.setValue('manager', undefined);
         form.setValue('transport_type', undefined);
      }
    } else {
      setProjectOrders([]);
      form.setValue('order_id', '');
      setSelectedOrderDetails(null);
    }
  }, [selectedProjectId, mode, initialData, form, toast]);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setSelectedProjectId(initialData.project_id);
      form.reset({
        project_id: initialData.project_id,
        order_id: initialData.order_id,
        project_name: initialData.project_name,
        achievement_date: format(parseISO(initialData.achievement_date), 'yyyy-MM-dd'),
        unit: initialData.unit,
        quantity: initialData.quantity,
        unit_price: initialData.unit_price,
        amount: initialData.amount,
        remarks: initialData.remarks || "",
        client_type: initialData.client_type,
        status: initialData.status,
        manager: initialData.manager,
        transport_type: initialData.transport_type,
      });
      setQuantityDisplay(formatNumberWithCommasAndDecimal(initialData.quantity));
      setUnitPriceDisplay(formatNumberWithCommasAndDecimal(initialData.unit_price));
      setAmountDisplay(formatNumberWithCommasAndDecimal(initialData.amount));
    } else if (mode === 'create') {
      form.reset({ 
        project_id: "", order_id: "", project_name: "",
        achievement_date: format(new Date(), 'yyyy-MM-dd'),
        unit: 'ton', quantity: 0, unit_price: 0, amount: 0, remarks: "",
        client_type: undefined, status: undefined, manager: undefined, transport_type: undefined,
      });
      setSelectedProjectId(null); setProjectOrders([]); setSelectedOrderDetails(null);
      setQuantityDisplay(''); setUnitPriceDisplay(''); setAmountDisplay('');
    }
  }, [initialData, mode, form]); 

  useEffect(() => {
    const qty = parseFormattedNumber(quantityDisplay);
    const price = parseFormattedNumber(unitPriceDisplay);
    const currentAmount = parseFormattedNumber(amountDisplay);
    const calculatedAmount = qty * price;

    // 수량이나 단가가 변경되었을 때만 금액을 자동 계산 (사용자가 금액을 직접 수정한 경우는 제외)
    // 사용자가 직접 금액을 수정했는지 여부를 판단하기 위해, 이전 amount 값과 비교하는 로직이 필요할 수 있으나,
    // 여기서는 quantity나 unit_price의 변경에 의해 amount가 업데이트 되어야 하는 경우만 고려.
    if (qty > 0 && price > 0) {
        // 이전에 계산된 값과 현재 입력된 amountDisplay가 다르면 사용자가 직접 수정한 것으로 간주하지 않음.
        // 좀 더 정교하게 하려면, form.formState.dirtyFields.amount 등을 활용할 수 있음.
        if (Math.abs(calculatedAmount - currentAmount) > 0.001 || currentAmount === 0) { // 부동소수점 비교 및 초기값 0일 때
            setAmountDisplay(formatNumberWithCommasAndDecimal(calculatedAmount));
            form.setValue('amount', calculatedAmount, { shouldValidate: true });
        }
    }
  }, [quantityDisplay, unitPriceDisplay, form, amountDisplay]);

  const handleFormSubmitWrapped = async (data: AchievementFormData) => {
    // project_name은 form.watch로 가져오거나, selectedProjectId로 projects에서 찾아서 넣기
    const selectedProj = projects.find(p => p.id === data.project_id);
    const submissionData: AchievementFormData = {
      ...data,
      project_name: selectedProj?.project_name || data.project_name, // project_name 확인
      quantity: parseFormattedNumber(quantityDisplay),
      unit_price: parseFormattedNumber(unitPriceDisplay),
      amount: parseFormattedNumber(amountDisplay),
      client_type: selectedOrderDetails?.client_type,
      status: selectedOrderDetails?.status,
      manager: selectedOrderDetails?.primary_manager, 
      transport_type: selectedOrderDetails?.transport_type,
    };
    await onSubmit(submissionData);
  };

  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProjectId(project.id);
      form.setValue("project_id", project.id, { shouldValidate: true });
      form.setValue("project_name", project.project_name);
    } else {
      setSelectedProjectId(null);
      form.setValue("project_id", "", { shouldValidate: true });
      form.setValue("project_name", "");
    }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = projectOrders.find(o => o.id === orderId);
    setSelectedOrderDetails(order || null);
    if (order) {
      form.setValue("order_id", order.id, { shouldValidate: true });
      form.setValue('client_type', order.client_type);
      form.setValue('status', order.status);
      form.setValue('manager', order.primary_manager);
      form.setValue('transport_type', order.transport_type);
    } else {
      form.setValue("order_id", "", { shouldValidate: true });
      form.setValue('client_type', undefined);
      form.setValue('status', undefined);
      form.setValue('manager', undefined);
      form.setValue('transport_type', undefined);
    }
  };
  
  const handleNumericInputChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    fieldName: keyof AchievementFormData
  ) => {
    const formatted = formatNumberWithCommasAndDecimal(value);
    setter(formatted);
    const parsed = parseFormattedNumber(value);
    form.setValue(fieldName as any, parsed, { shouldValidate: true });
  };

  return (
    <form onSubmit={form.handleSubmit(handleFormSubmitWrapped)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 프로젝트 선택 */}
        <div className="space-y-2">
          <Label htmlFor="project_id">프로젝트</Label>
          <Controller
            name="project_id"
            control={form.control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value
                      ? projects.find((p) => p.id === field.value)?.project_name
                      : "프로젝트 선택..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto p-0">
                  <Command>
                    <CommandInput placeholder="프로젝트 검색..." />
                    <CommandList>
                      <CommandEmpty>검색 결과 없음.</CommandEmpty>
                      <CommandGroup>
                        {projects.map((p) => (
                          <CommandItem
                            key={p.id}
                            value={p.project_name} // 검색을 위해 project_name 사용
                            onSelect={() => handleProjectSelect(p.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                p.id === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {p.project_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
          {form.formState.errors.project_id && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.project_id.message}</p>
          )}
        </div>

        {/* 수주 계약 선택 */}
        <div className="space-y-2">
          <Label htmlFor="order_id">수주 계약 (Order)</Label>
          <Controller
            name="order_id"
            control={form.control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild disabled={!selectedProjectId || isLoadingProjectOrders}>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {isLoadingProjectOrders ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {field.value
                      ? projectOrders.find((o) => o.id === field.value)?.order_number || projectOrders.find((o) => o.id === field.value)?.project_name 
                      : "수주 계약 선택..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto p-0">
                  <Command>
                    <CommandInput placeholder="수주 계약 검색 (번호 또는 이름)..." />
                    <CommandList>
                      <CommandEmpty>{isLoadingProjectOrders ? "로딩 중..." : (selectedProjectId ? "해당 프로젝트에 계약 없음." : "프로젝트를 먼저 선택하세요.")}</CommandEmpty>
                      <CommandGroup>
                        {projectOrders.map((o) => (
                          <CommandItem
                            key={o.id}
                            value={o.order_number + " " + o.project_name} // 검색용
                            onSelect={() => handleOrderSelect(o.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                o.id === field.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {o.order_number} ({o.project_name.substring(0,20)}...)
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          />
          {form.formState.errors.order_id && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.order_id.message}</p>
          )}
        </div>
      </div>

      {/* 자동 완성 정보 표시 */}
      {selectedOrderDetails && (
        <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm">
          <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase">선택된 계약 정보</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><span className="font-medium">고객사:</span> {selectedOrderDetails.company_name}</div>
            <div><span className="font-medium">상태:</span> {getStatusLabel(selectedOrderDetails.status)}</div>
            <div><span className="font-medium">담당자:</span> {selectedOrderDetails.primary_manager || '-'}</div>
            <div><span className="font-medium">정화장소:</span> {getTransportTypeLabel(selectedOrderDetails.transport_type)}</div>
          </div>
        </div>
      )}

      {/* 실적 상세 정보 입력 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <Label htmlFor="achievement_date">실적 일자</Label>
          <Controller
            name="achievement_date"
            control={form.control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(parseISO(field.value), "PPP") : <span>날짜 선택</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value ? parseISO(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {form.formState.errors.achievement_date && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.achievement_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">단위</Label>
          <Controller
            name="unit"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="단위 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {ACHIEVEMENT_UNITS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
           {form.formState.errors.unit && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.unit.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">수량</Label>
          <Input 
            id="quantity"
            value={quantityDisplay}
            onChange={(e) => handleNumericInputChange(e.target.value, setQuantityDisplay, 'quantity')}
            placeholder="0.00"
          />
          {form.formState.errors.quantity && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.quantity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_price">단가</Label>
          <Input 
            id="unit_price"
            value={unitPriceDisplay}
            onChange={(e) => handleNumericInputChange(e.target.value, setUnitPriceDisplay, 'unit_price')}
            placeholder="0"
          />
          {form.formState.errors.unit_price && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.unit_price.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="amount">금액 (자동계산)</Label>
          <Input 
            id="amount"
            value={amountDisplay}
            onChange={(e) => handleNumericInputChange(e.target.value, setAmountDisplay, 'amount')}
            placeholder="0"
            readOnly // 사용자가 수량/단가 입력시 자동계산되도록 하고, 직접 수정은 막을 수 있음. 또는 위의 useEffect 로직으로 관리.
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-red-500 mt-1">{form.formState.errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="remarks">비고</Label>
          <Input id="remarks" {...form.register("remarks")} placeholder="기타 참고사항 입력" />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading || !form.formState.isValid || !selectedProjectId || !form.getValues('order_id') }>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === 'edit' ? '실적 수정' : '실적 등록'}
        </Button>
      </div>
    </form>
  );
} 