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

// 분리된 컴포넌트들
import { BasicInfoTab } from "./order-form/basic-info-tab"
import { TechnicalInfoTab } from "./order-form/technical-info-tab"
import { ManagementInfoTab } from "./order-form/management-info-tab"
import { FilesTab } from "./order-form/files-tab"
import { ProjectCreationDialog } from "./order-form/project-creation-dialog"

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
  const [contractAmountDisplay, setContractAmountDisplay] = useState('')
  const [contaminationList, setContaminationList] = useState<ContaminationItem[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMode, setFormMode] = useState<'new' | 'change' | null>(null)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [createdProjectName, setCreatedProjectName] = useState<string>('')
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const form = useForm<OrderFormData>({
    resolver: zodResolver<OrderFormData, any, OrderFormData>(orderSchema),
    defaultValues: getDefaultValues(initialData),
    mode: 'onChange'
  })

  // 모든 필수 필드 감시
  const watchedFields = {
    project_id: form.watch('project_id'),
    company_name: form.watch('company_name'),
    contract_amount: form.watch('contract_amount'),
    remediation_method: form.watch('remediation_method'),
    verification_company: form.watch('verification_company'),
    primary_manager: form.watch('primary_manager')
  }

  // 폼 유효성 검사 상태 확인 (오염 정보 포함)
  const isFormValid = 
    watchedFields.project_id && 
    watchedFields.company_name && 
    watchedFields.contract_amount > 0 &&
    watchedFields.remediation_method &&
    watchedFields.verification_company &&
    watchedFields.primary_manager &&
    contaminationList.length > 0 &&
    contaminationList.every(item => item.type && item.value > 0) &&
    !Object.keys(form.formState.errors).length

  // formMode 변경 시 order_type 동기화
  useEffect(() => {
    if (formMode === 'new') {
      form.setValue('order_type', 'new', { shouldValidate: true })
    } else {
      // 변경 모드일 때는 기존 값이 있으면 유지, 없으면 change1로 설정
      const currentOrderType = form.getValues('order_type')
      if (currentOrderType === 'new') {
        form.setValue('order_type', 'change1', { shouldValidate: true })
      }
    }
  }, [formMode, form])

  // 초기값 설정
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // 편집 모드에서는 기존 데이터로 초기화
      setFormMode('change');
      setContractAmountDisplay(formatCurrency(initialData.contract_amount));
      setContaminationList(toContaminationArray(initialData.contamination_info));
      
      // 폼 필드들 설정
      const defaults = getDefaultValues(initialData);
      form.reset(defaults);
    } else {
      // 생성 모드에서는 초기값으로 리셋 (모드는 null로 시작)
      setFormMode(null);
      setContractAmountDisplay('');
      setContaminationList([]);
      setCreatedProjectId(null);
      setCreatedProjectName('');
      
      const defaults = getDefaultValues(null);
      form.reset(defaults);
    }
  }, [mode, initialData, form]);

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

  // formMode 변경 핸들러
  const handleFormModeChange = async (newMode: 'new' | 'change') => {
    if (newMode === 'new') {
      // 신규 선택 시 프로젝트 생성 다이얼로그 표시
      setIsProjectDialogOpen(true)
    } else {
      // 변경 모드는 바로 설정
      setFormMode(newMode);
    }
  }

  // 프로젝트 생성 핸들러
  const handleProjectCreate = async (projectName: string) => {
    console.log("=== 프로젝트 생성 시작 ===", projectName);
    setIsCreatingProject(true)
    try {
      console.log("ProjectService import 시작...");
      const { ProjectService } = await import('@/lib/supabase/project-service');
      const { supabase } = await import('@/lib/supabase/client');
      console.log("Import 완료, ProjectService 인스턴스 생성...");
      
      const projectService = new ProjectService(supabase);
      console.log("프로젝트 데이터:", {
        project_name: projectName.trim(),
        status: 'planning',
        client_company_name: '',
      });
      
      console.log("프로젝트 생성 API 호출...");
      const { data: newProject, error: projectError } = await projectService.createProject({
        project_name: projectName.trim(),
        status: 'planning',
        client_company_name: '', // 빈 문자열로 설정
      });

      console.log("API 응답:", { data: newProject, error: projectError });

      if (projectError || !newProject) {
        console.error("프로젝트 생성 실패:", projectError);
        throw new Error(projectError?.message || "프로젝트 생성 실패");
      }

      console.log("프로젝트 생성 성공:", newProject);
      // 프로젝트 생성 성공
      setCreatedProjectId(newProject.id);
      setCreatedProjectName(projectName.trim());
      form.setValue('project_id', newProject.id, { shouldValidate: true });
      // 거래처명은 자동 입력하지 않음 (사용자가 직접 입력해야 함)
      setFormMode('new');
      setIsProjectDialogOpen(false);
      
      console.log("프로젝트 생성 완료 처리 완료");
      // 성공 알림은 토스트로 처리 (상위 컴포넌트에서)
    } catch (error: any) {
      // 에러 처리
      console.error('프로젝트 생성 에러:', error);
      console.error('에러 상세:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error; // 다이얼로그에서 처리하도록
    } finally {
      console.log("프로젝트 생성 finally 실행");
      setIsCreatingProject(false);
    }
  }

  // 폼 제출 핸들러 - 중복 토스트 제거
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    
    if (!isFormValid) {
      return
    }

    setIsSubmitting(true)
    try {
      const data = form.getValues()
      await onSubmit({ ...data, contamination_info: contaminationList }, uploadedFiles)
      // 토스트는 상위 컴포넌트에서 처리하므로 여기서는 제거
    } catch (error) {
      console.error('Form submission error:', error)
      // 에러도 상위 컴포넌트에서 처리
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <Button 
              type="button"
              variant={formMode === 'new' ? 'default' : 'outline'} 
              onClick={() => handleFormModeChange('new')}
              disabled={isSubmitting || isCreatingProject}
            >
              {isCreatingProject ? '처리 중...' : '신규'}
            </Button>
            <Button 
              type="button"
              variant={formMode === 'change' ? 'default' : 'outline'} 
              onClick={() => handleFormModeChange('change')}
              disabled={isSubmitting || isCreatingProject || formMode === 'new'}
            >
              변경
            </Button>
          </div>

          {/* 신규 모드 선택 후 안내 메시지 */}
          {formMode === 'new' && (
            <div className="text-center p-4 bg-green-50 rounded-lg text-green-800">
              <p className="text-sm">
                ✓ '{createdProjectName}' 프로젝트가 생성되었습니다. 이제 수주 정보를 입력하세요.
              </p>
            </div>
          )}

          {/* 모드가 선택되지 않았을 때 안내 메시지 */}
          {formMode === null && (
            <div className="text-center p-8 text-gray-500">
              <p className="text-lg mb-2">수주 유형을 선택해주세요</p>
              <p className="text-sm">신규: 새 프로젝트를 생성하고 수주를 등록합니다</p>
              <p className="text-sm">변경: 기존 프로젝트에 변경계약을 등록합니다</p>
            </div>
          )}
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

      {/* 탭 폼 - 모드가 선택되었을 때만 표시 */}
      {formMode !== null && (
      <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
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
                createdProjectId={createdProjectId}
                createdProjectName={createdProjectName}
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
                className={!isFormValid ? "opacity-50 cursor-not-allowed" : ""}
            >
              {isSubmitting ? '저장 중...' : mode === 'edit' ? '수정 완료' : '등록 완료'}
            </Button>
          </div>
        </form>
      </Tabs>
      )}
      
      {/* 프로젝트 생성 다이얼로그 */}
      <ProjectCreationDialog
        isOpen={isProjectDialogOpen}
        onClose={() => setIsProjectDialogOpen(false)}
        onSubmit={handleProjectCreate}
        isLoading={isCreatingProject}
      />
    </div>
  )
}