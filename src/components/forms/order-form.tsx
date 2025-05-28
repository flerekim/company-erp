// src/components/forms/order-form.tsx
// 수주 등록/수정 폼 컴포넌트 - 토양정화 전문

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building, 
  FileText, 
  Calendar, 
  DollarSign, 
  Users, 
  Upload,
  Trash2,
  Plus,
  AlertCircle
} from "lucide-react"
import { 
  Order, 
  OrderFormData, 
  ClientType, 
  OrderType, 
  TransportType, 
  OrderStatus,
  REMEDIATION_METHODS,
  CONTAMINATION_TYPES,
  VERIFICATION_COMPANIES,
  MANAGERS,
  ContaminationItem
} from "@/types/order"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

// 폼 검증 스키마
const contaminationItemSchema = z.object({
  type: z.string().min(1, "오염항목을 선택하세요"),
  value: z.number().min(0, "농도를 입력하세요")
})

const orderSchema = z.object({
  project_name: z.string().min(1, "프로젝트명을 입력해주세요"),
  company_name: z.string().min(1, "고객사명을 입력해주세요"),
  client_type: z.enum(['government', 'private'], {
    required_error: "고객사 유형을 선택해주세요"
  }),
  contract_date: z.string().min(1, "계약일을 선택해주세요"),
  contract_amount: z.number().min(1, "계약금액을 입력해주세요"),
  order_type: z.enum(['new', 'change1', 'change2', 'change3', 'change4', 'change5']),
  transport_type: z.enum(['onsite', 'transport'], {
    required_error: "처리방식을 선택해주세요"
  }),
  remediation_method: z.string().min(1, "정화방법을 선택해주세요"),
  contamination_info: z.array(contaminationItemSchema).min(1, "오염 정보를 1개 이상 입력하세요"),
  verification_company: z.string().min(1, "검증업체를 선택해주세요"),
  status: z.enum(['contracted', 'in_progress', 'completed', 'cancelled']),
  progress_percentage: z.number().min(0).max(100),
  primary_manager: z.string().min(1, "주담당자를 선택해주세요"),
  secondary_manager: z.string().optional()
})

interface OrderFormProps {
  initialData?: Order | null;
  onSubmit: (data: OrderFormData, files: File[]) => void
  onClose: () => void // onCancel 대신 onClose 사용 (다이얼로그 prop과 일치)
  isLoading?: boolean
  mode: 'create' | 'edit' // mode 속성 추가 (OrderForm에서 직접 사용)
}

// contamination_info 초기값 안전 변환 함수
function toContaminationArray(val: any): ContaminationItem[] {
  if (Array.isArray(val)) return val
  return []
}

export function OrderForm({ initialData, onSubmit, onClose, isLoading = false, mode }: OrderFormProps) {
  const { toast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [contractAmountDisplay, setContractAmountDisplay] = useState<string>('')
  const [contaminationList, setContaminationList] = useState<ContaminationItem[]>(toContaminationArray(initialData?.contamination_info))

  const form = useForm<OrderFormData>({
    resolver: zodResolver<OrderFormData, any, OrderFormData>(orderSchema),
    defaultValues: {
      project_name: initialData?.project_name || '',
      company_name: initialData?.company_name || '',
      client_type: initialData?.client_type || 'private',
      contract_date: initialData?.contract_date || new Date().toISOString().split('T')[0],
      contract_amount: initialData?.contract_amount || 0,
      order_type: initialData?.order_type || 'new',
      transport_type: initialData?.transport_type || 'onsite',
      remediation_method: initialData?.remediation_method || '',
      contamination_info: toContaminationArray(initialData?.contamination_info),
      verification_company: initialData?.verification_company || '',
      status: initialData?.status || 'contracted',
      progress_percentage: initialData?.progress_percentage || 0,
      primary_manager: initialData?.primary_manager || '',
      secondary_manager: initialData?.secondary_manager || ''
    },
    mode: 'onChange'
  })

  // 모든 필수 필드 감시
  const watchedFields = {
    project_name: form.watch('project_name'),
    company_name: form.watch('company_name'),
    client_type: form.watch('client_type'),
    contract_date: form.watch('contract_date'),
    contract_amount: form.watch('contract_amount'),
    transport_type: form.watch('transport_type'),
    remediation_method: form.watch('remediation_method'),
    contamination_info: form.watch('contamination_info'),
    verification_company: form.watch('verification_company'),
    primary_manager: form.watch('primary_manager')
  }

  // 폼 유효성 검사 상태 확인
  const isFormValid = 
    watchedFields.project_name && 
    watchedFields.company_name && 
    watchedFields.contract_amount > 0 &&
    watchedFields.remediation_method &&
    watchedFields.contamination_info &&
    watchedFields.verification_company &&
    watchedFields.primary_manager &&
    !Object.keys(form.formState.errors).length

  // 필드 값이 변경될 때마다 유효성 검사 실행
  const handleFieldChange = (field: keyof OrderFormData, value: any) => {
    form.setValue(field, value, { shouldValidate: true })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // 숫자를 천단위 콤마 형식으로 포맷팅
  const formatNumberWithCommas = (value: string) => {
    // 숫자가 아닌 문자 제거
    const numbersOnly = value.replace(/[^0-9]/g, '')
    // 천단위 콤마 추가
    return numbersOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  // 콤마가 포함된 문자열을 숫자로 변환
  const parseFormattedNumber = (value: string) => {
    return parseInt(value.replace(/,/g, '')) || 0
  }

  // 계약금액 변경 핸들러
  const handleContractAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formattedValue = formatNumberWithCommas(inputValue)
    const numericValue = parseFormattedNumber(formattedValue)
    
    setContractAmountDisplay(formattedValue)
    form.setValue('contract_amount', numericValue, { shouldValidate: true })
  }

  // initialData가 있을 때 계약금액 표시값 초기화
  useEffect(() => {
    if (initialData?.contract_amount) {
      setContractAmountDisplay(formatNumberWithCommas(initialData.contract_amount.toString()))
    }
  }, [initialData])

  // contaminationList 초기값 동기화
  useEffect(() => {
    setContaminationList(toContaminationArray(initialData?.contamination_info))
  }, [initialData])

  // 오염 항목 추가
  const handleAddContamination = () => {
    setContaminationList([...contaminationList, { type: '', value: 0 }])
  }
  // 오염 항목 삭제
  const handleRemoveContamination = (idx: number) => {
    setContaminationList(contaminationList.filter((_, i) => i !== idx))
  }
  // 오염 항목 변경
  const handleContaminationChange = (idx: number, field: 'type' | 'value', value: any) => {
    setContaminationList(contaminationList.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'value' ? Number(value) : value } : item
    ))
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const data = form.getValues()
      await onSubmit({ ...data, contamination_info: contaminationList }, uploadedFiles)
      toast({
        title: mode === 'edit' ? "수주 정보가 수정되었습니다." : "새 수주가 등록되었습니다.",
        description: "수주 목록에서 확인하실 수 있습니다.",
        variant: "success",
        action: (
          <ToastAction altText="확인" className="text-white hover:bg-blue-700">
            확인
          </ToastAction>
        ),
        duration: 2000
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류가 발생했습니다.",
        description: "다시 시도해주세요.",
        action: (
          <ToastAction altText="다시 시도">다시 시도</ToastAction>
        ),
        duration: 2000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 드래그앤드롭 이벤트 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files])
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getOrderTypeLabel = (type: OrderType) => {
    const labels = {
      new: '신규',
      change1: '1차 변경',
      change2: '2차 변경',
      change3: '3차 변경',
      change4: '4차 변경',
      change5: '5차 변경'
    }
    return labels[type]
  }

  return (
    <div className="space-y-6">
      {/* 헤더 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'create' ? '새 수주 등록' : '수주 정보 수정'}
          </CardTitle>
          <CardDescription>
            토양오염정화공사 프로젝트의 상세 정보를 입력하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialData && (
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-4">
              <div>
                <Label className="text-gray-500">수주번호</Label>
                <div className="font-mono text-lg">{initialData.order_number}</div>
              </div>
              <div>
                <Label className="text-gray-500">등록일</Label>
                <div>{new Date(initialData.created_at).toLocaleDateString('ko-KR')}</div>
              </div>
              <div>
                <Label className="text-gray-500">수정일</Label>
                <div>{new Date(initialData.updated_at).toLocaleDateString('ko-KR')}</div>
              </div>
            </div>
          )}
          
          {watchedFields.contract_amount > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">계약금액 미리보기</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">계약금액:</span>
                  <div className="font-semibold">{formatCurrency(watchedFields.contract_amount)}</div>
                </div>
                <div>
                  <span className="text-gray-600">부가세 (10%):</span>
                  <div className="font-semibold">{formatCurrency(watchedFields.contract_amount * 0.1)}</div>
                </div>
                <div>
                  <span className="text-gray-600">총액:</span>
                  <div className="font-semibold text-blue-600">{formatCurrency(watchedFields.contract_amount * 1.1)}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 탭 폼 */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">기본 정보</TabsTrigger>
          <TabsTrigger value="technical">기술 정보</TabsTrigger>
          <TabsTrigger value="management">관리 정보</TabsTrigger>
          <TabsTrigger value="files">첨부 파일</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 기본 정보 탭 */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  프로젝트 기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project_name">프로젝트명 *</Label>
                    <Input
                      id="project_name"
                      placeholder="예: 24-A-OO부대 토양오염정화공사"
                      {...form.register('project_name')}
                    />
                    {form.formState.errors.project_name && (
                      <p className="text-sm text-red-500">{form.formState.errors.project_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_name">고객사명 *</Label>
                    <Input
                      id="company_name"
                      placeholder="예: 제2218부대"
                      {...form.register('company_name')}
                    />
                    {form.formState.errors.company_name && (
                      <p className="text-sm text-red-500">{form.formState.errors.company_name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>고객사 유형 *</Label>
                    <Select
                      value={form.watch('client_type')}
                      onValueChange={(value) => handleFieldChange('client_type', value as ClientType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="government">관수 (정부/공공기관)</SelectItem>
                        <SelectItem value="private">민수 (민간기업)</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.client_type && (
                      <p className="text-sm text-red-500">{form.formState.errors.client_type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_date">계약일 *</Label>
                    <Input
                      id="contract_date"
                      type="date"
                      {...form.register('contract_date')}
                    />
                    {form.formState.errors.contract_date && (
                      <p className="text-sm text-red-500">{form.formState.errors.contract_date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>수주 유형</Label>
                    <Select
                      value={form.watch('order_type')}
                      onValueChange={(value) => form.setValue('order_type', value as OrderType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">신규</SelectItem>
                        <SelectItem value="change1">1차 변경</SelectItem>
                        <SelectItem value="change2">2차 변경</SelectItem>
                        <SelectItem value="change3">3차 변경</SelectItem>
                        <SelectItem value="change4">4차 변경</SelectItem>
                        <SelectItem value="change5">5차 변경</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contract_amount">계약금액 (원) *</Label>
                  <Input
                    id="contract_amount"
                    type="text"
                    placeholder="0"
                    value={contractAmountDisplay}
                    onChange={handleContractAmountChange}
                  />
                  {form.formState.errors.contract_amount && (
                    <p className="text-sm text-red-500">{form.formState.errors.contract_amount.message}</p>
                  )}
                  {contractAmountDisplay && (
                    <p className="text-sm text-gray-500">
                      입력된 금액: {formatCurrency(parseFormattedNumber(contractAmountDisplay))}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 기술 정보 탭 */}
          <TabsContent value="technical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>토양정화 기술 정보</CardTitle>
                <CardDescription>
                  토양오염정화에 특화된 기술적 정보를 입력하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>정화 장소 *</Label>
                    <Select
                      value={form.watch('transport_type')}
                      onValueChange={(value) => handleFieldChange('transport_type', value as TransportType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onsite">부지내</SelectItem>
                        <SelectItem value="transport">반출</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.transport_type && (
                      <p className="text-sm text-red-500">{form.formState.errors.transport_type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>정화 방법 *</Label>
                    <Select
                      value={form.watch('remediation_method')}
                      onValueChange={(value) => handleFieldChange('remediation_method', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {REMEDIATION_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.remediation_method && (
                      <p className="text-sm text-red-500">{form.formState.errors.remediation_method.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>오염 정보 *</Label>
                  {contaminationList.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center mb-2">
                      <Select
                        value={item.type}
                        onValueChange={val => handleContaminationChange(idx, 'type', val)}
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="오염항목 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTAMINATION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={0}
                        className="w-32"
                        value={item.value || ''}
                        onChange={e => handleContaminationChange(idx, 'value', e.target.value)}
                        placeholder="농도"
                      />
                      <span className="text-sm text-gray-500">mg/kg</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveContamination(idx)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddContamination}>
                    <Plus className="w-4 h-4 mr-1" /> 오염 항목 추가
                  </Button>
                  {form.formState.errors.contamination_info && (
                    <p className="text-sm text-red-500">오염 정보를 1개 이상 입력하세요.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>검증 업체 *</Label>
                  <Select
                    value={form.watch('verification_company')}
                    onValueChange={(value) => handleFieldChange('verification_company', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_COMPANIES.map((company) => (
                        <SelectItem key={company} value={company}>{company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.verification_company && (
                    <p className="text-sm text-red-500">{form.formState.errors.verification_company.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 관리 정보 탭 */}
          <TabsContent value="management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  프로젝트 관리 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>프로젝트 상태</Label>
                    <Select
                      value={form.watch('status')}
                      onValueChange={(value) => form.setValue('status', value as OrderStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contracted">계약 체결</SelectItem>
                        <SelectItem value="in_progress">진행 중</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                        <SelectItem value="cancelled">취소</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="progress_percentage">진행률 (%)</Label>
                    <Input
                      id="progress_percentage"
                      type="number"
                      min="0"
                      max="100"
                      {...form.register('progress_percentage', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>주담당자 *</Label>
                    <Select
                      value={form.watch('primary_manager')}
                      onValueChange={(value) => handleFieldChange('primary_manager', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {MANAGERS.map((manager) => (
                          <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.primary_manager && (
                      <p className="text-sm text-red-500">{form.formState.errors.primary_manager.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>부담당자</Label>
                    <Select
                      value={form.watch('secondary_manager') || 'none'}
                      onValueChange={(value) => form.setValue('secondary_manager', value === 'none' ? undefined : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">선택 안함</SelectItem>
                        {MANAGERS.map((manager) => (
                          <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 첨부 파일 탭 */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  첨부 파일
                </CardTitle>
                <CardDescription>
                  계약서, 도면, 보고서 등 관련 문서를 첨부하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <Upload className={`h-8 w-8 mx-auto mb-4 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                    <div className={`text-sm mb-4 ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`}>
                      {isDragOver ? '파일을 여기에 놓으세요' : '파일을 드래그하여 놓거나 클릭하여 선택하세요'}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xlsx,.jpg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      파일 선택
                    </Button>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>업로드된 파일</Label>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isLoading}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading || !isFormValid}
            >
              {isSubmitting ? '저장 중...' : mode === 'edit' ? '수정 완료' : '등록 완료'}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  )
}