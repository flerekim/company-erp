// src/components/forms/order-form.tsx
// 수주 등록/수정 폼 컴포넌트 - 토양정화 전문

"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { DollarSign, FileText } from "lucide-react"
import { Order, OrderFormData, ContaminationItem, OrderWithFileCount } from "@/types/order"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

// 분리된 컴포넌트들
import { BasicInfoTab } from "./order-form/basic-info-tab"
import { TechnicalInfoTab } from "./order-form/technical-info-tab"
import { ManagementInfoTab } from "./order-form/management-info-tab"
import { FilesTab } from "./order-form/files-tab"

// 분리된 유틸리티와 스키마
import { orderSchema, getDefaultValues } from "./order-form/types"
import { formatCurrency, formatNumberWithCommas, parseFormattedNumber, toContaminationArray } from "./order-form/utils"

interface OrderFormProps {
  initialData?: OrderWithFileCount | null
  onSubmit: (data: OrderFormData, files: File[]) => void
  onClose: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function OrderForm({ initialData, onSubmit, onClose, isLoading = false, mode }: OrderFormProps) {
  const { toast } = useToast()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contractAmountDisplay, setContractAmountDisplay] = useState<string>('')
  const [contaminationList, setContaminationList] = useState<ContaminationItem[]>(toContaminationArray(initialData?.contamination_info))
  const [formMode, setFormMode] = useState<'new' | 'change'>('new')

  // mode prop이 바뀔 때 formMode 초기화 (order_type 기본값 설정용)
  useEffect(() => {
    if (mode === 'create') {
      setFormMode('new');
      // form.reset(getDefaultValues(null)); // 이관 또는 제거 (아래 initialData useEffect에서 처리)
      // setContractAmountDisplay('');
      // setContaminationList([]); 
    } else if (mode === 'edit') {
      // 수정 모드일 때는 order_type을 initialData에서 가져오거나, 없으면 기본값 유지
      // form.reset은 initialData useEffect에서 처리
      setFormMode(initialData?.order_type?.startsWith('change') ? 'change' : 'new'); 
    }
  }, [mode, initialData]); // initialData도 의존성에 추가

  const form = useForm<OrderFormData>({
    resolver: zodResolver<OrderFormData, any, OrderFormData>(orderSchema),
    defaultValues: getDefaultValues(initialData),
    mode: 'onChange'
  })

  // 모든 필수 필드 감시
  const watchedFields = {
    project_name: form.watch('project_name'),
    company_name: form.watch('company_name'),
    contract_amount: form.watch('contract_amount'),
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

  // 필드 값 변경 핸들러
  const handleFieldChange = (field: keyof OrderFormData, value: any) => {
    form.setValue(field, value, { shouldValidate: true })
  }

  // 계약금액 변경 핸들러
  const handleContractAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const formattedValue = formatNumberWithCommas(inputValue)
    const numericValue = parseFormattedNumber(formattedValue)
    
    setContractAmountDisplay(formattedValue)
    form.setValue('contract_amount', numericValue, { shouldValidate: true })
  }

  // 오염 항목 관리 핸들러들
  const handleAddContamination = () => {
    setContaminationList([...contaminationList, { type: '', value: 0 }])
  }

  const handleRemoveContamination = (idx: number) => {
    setContaminationList(contaminationList.filter((_, i) => i !== idx))
  }

  const handleContaminationChange = (idx: number, field: 'type' | 'value', value: any) => {
    setContaminationList(contaminationList.map((item, i) =>
      i === idx ? { ...item, [field]: field === 'value' ? Number(value) : value } : item
    ))
  }

  // 파일 관리 핸들러들
  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 폼 제출 핸들러
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

  // initialData가 변경될 때 폼 전체를 리셋하고 관련 상태 업데이트
  useEffect(() => {
    if (initialData) {
      form.reset(getDefaultValues(initialData));
      setContractAmountDisplay(initialData.contract_amount ? formatNumberWithCommas(initialData.contract_amount.toString()) : '');
      setContaminationList(toContaminationArray(initialData.contamination_info));
      // 수정 모드일 때, initialData의 order_type을 보고 formMode (신규/변경 탭) 설정
      if (mode === 'edit') {
        setFormMode(initialData.order_type?.startsWith('change') ? 'change' : 'new');
      }
    } else {
      // 생성 모드 또는 initialData가 없는 경우
      form.reset(getDefaultValues(null)); 
      setContractAmountDisplay('');
      setContaminationList([]);
      if (mode === 'create') {
        setFormMode('new'); // 생성 모드면 항상 '신규' 탭
      }
    }
  }, [initialData, form, mode]); // mode를 의존성 배열에 추가

  return (
    <div className="space-y-6">
      {/* 헤더 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {formMode === 'new' ? '새 수주 등록' : '변경계약 등록'}
          </CardTitle>
          <CardDescription>
            토양오염정화공사 프로젝트의 상세 정보를 입력하세요.
          </CardDescription>
          {/* 신규/변경 토글 버튼 */}
          <div className="flex gap-2 mt-4">
            <Button variant={formMode === 'new' ? 'default' : 'outline'} onClick={() => setFormMode('new')}>신규</Button>
            <Button variant={formMode === 'change' ? 'default' : 'outline'} onClick={() => setFormMode('change')}>변경</Button>
          </div>
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
          <TabsContent value="basic" className="space-y-6">
            <BasicInfoTab
              form={form}
              formMode={formMode}
              contractAmountDisplay={contractAmountDisplay}
              onContractAmountChange={handleContractAmountChange}
              onFieldChange={handleFieldChange}
            />
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <TechnicalInfoTab
              form={form}
              contaminationList={contaminationList}
              onFieldChange={handleFieldChange}
              onAddContamination={handleAddContamination}
              onRemoveContamination={handleRemoveContamination}
              onContaminationChange={handleContaminationChange}
            />
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <ManagementInfoTab
              form={form}
              onFieldChange={handleFieldChange}
            />
          </TabsContent>

          <TabsContent value="files" className="space-y-6">
            <FilesTab
              uploadedFiles={uploadedFiles}
              onFileUpload={handleFileUpload}
              onRemoveFile={removeFile}
            />
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