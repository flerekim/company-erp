"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building } from "lucide-react"
import { ClientType, OrderType, OrderFormData, Order } from "@/types/order"
import { Project } from "@/types/project"
import { UseFormReturn } from "react-hook-form"
import { supabase } from '@/lib/supabase/client'
import { ProjectService } from '@/lib/supabase/project-service'
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"

interface BasicInfoTabProps {
  form: UseFormReturn<OrderFormData>
  formMode: 'new' | 'change' | null
  contractAmountDisplay: string
  onContractAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFieldChange: (field: keyof OrderFormData, value: any) => void
  createdProjectId?: string | null
  createdProjectName?: string
}

export function BasicInfoTab({ 
  form, 
  formMode, 
  contractAmountDisplay, 
  onContractAmountChange,
  onFieldChange,
  createdProjectId,
  createdProjectName
}: BasicInfoTabProps) {
  const { toast } = useToast()
  const projectService = useMemo(() => new ProjectService(supabase), [])

  const [projectOptions, setProjectOptions] = useState<Project[]>([])
  const [projectSearch, setProjectSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const projectSearchRef = useRef(projectSearch);

  // 현재 선택된 프로젝트 ID
  const currentProjectId = form.watch('project_id')

  // 프로젝트 목록 로드
  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true)
    try {
      const { data, error } = await projectService.getProjects()
      if (data) {
        setProjectOptions(data)
      } else {
        console.error("Error fetching projects:", error)
        setProjectOptions([])
      }
    } catch (error) {
      console.error("Exception fetching projects:", error)
      setProjectOptions([])
    } finally {
      setIsLoadingProjects(false)
    }
  }, [projectService])

  // 컴포넌트 마운트 시 프로젝트 목록 로드
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 현재 프로젝트 ID가 변경될 때 검색어 업데이트
  useEffect(() => {
    if (currentProjectId && projectOptions.length > 0) {
      const selectedProject = projectOptions.find(p => p.id === currentProjectId)
      if (selectedProject) {
        setProjectSearch(selectedProject.project_name)
      }
    } else if (!currentProjectId) {
      setProjectSearch('')
    }
  }, [currentProjectId, projectOptions])

  // 신규 모드에서 프로젝트가 생성된 경우 검색어 업데이트
  useEffect(() => {
    if (formMode === 'new' && createdProjectName) {
      setProjectSearch(createdProjectName);
    }
  }, [formMode, createdProjectName]);

  // 필터된 프로젝트 목록
  const filteredProjects = useMemo(() => {
    if (!projectSearch) return projectOptions.slice(0, 10)
    return projectOptions.filter(project =>
      project.project_name.toLowerCase().includes(projectSearch.toLowerCase())
    )
  }, [projectSearch, projectOptions])

  useEffect(() => {
    projectSearchRef.current = projectSearch;
  }, [projectSearch]);

  // 프로젝트 선택 핸들러 (필드 채우기 강화)
  const handleProjectSelect = useCallback(async (project: Project) => {
    console.log("=== 프로젝트 선택 ===", project);
    setShowDropdown(false)
    setProjectSearch(project.project_name)
    form.setValue('project_id', project.id, { shouldValidate: true })
    form.setValue('project_name', project.project_name, { shouldValidate: true }) // project_name도 폼에 설정

    let companyName = project.client_company_name?.trim();
    let firstOrder: Order | null = null; // Order 타입으로 명시

    try {
      console.log("프로젝트의 수주 정보 조회 시작...");
      const { OrderService } = await import('@/lib/supabase/order-service');
      const orderService = new OrderService(supabase);
      const { data: orders } = await orderService.getOrdersByProjectId(project.id);
      
      if (orders && orders.length > 0) {
        firstOrder = orders[0] as Order; // 타입 단언
        console.log("첫 번째 수주 정보:", firstOrder);
        
        if (!companyName && firstOrder.company_name) {
          companyName = firstOrder.company_name.trim();
          console.log("수주 정보에서 고객사명 조회:", companyName);
          if (companyName) {
            try {
              await projectService.updateProject(project.id, { client_company_name: companyName });
              console.log("프로젝트 고객사명 업데이트 완료");
            } catch (updateError) {
              console.warn("프로젝트 고객사명 업데이트 실패:", updateError);
            }
          }
        }
      }
    } catch (error) {
      console.error("수주 정보 조회 중 오류:", error);
    }
    
    if (companyName) {
      console.log("고객사명 자동 입력:", companyName);
      onFieldChange('company_name', companyName)
    }

    if (firstOrder) {
      console.log("수주 정보를 기반으로 다른 필드들 자동 입력...");
      if (firstOrder.client_type) onFieldChange('client_type', firstOrder.client_type);
      if (firstOrder.transport_type) onFieldChange('transport_type', firstOrder.transport_type);
      if (firstOrder.remediation_method) onFieldChange('remediation_method', firstOrder.remediation_method);
      if (firstOrder.verification_company) onFieldChange('verification_company', firstOrder.verification_company);
      if (firstOrder.primary_manager) onFieldChange('primary_manager', firstOrder.primary_manager);
      if (firstOrder.secondary_manager) onFieldChange('secondary_manager', firstOrder.secondary_manager);
      // 오염 정보(contamination_info)는 일반적으로 변경 계약 시 새로 입력하므로 자동 채우기에서 제외
      console.log("필드 자동 입력 완료");
    }

    if (project.start_date) {
      onFieldChange('contract_date', project.start_date);
    } else if (firstOrder?.contract_date) {
      onFieldChange('contract_date', firstOrder.contract_date);
    }
  }, [form, onFieldChange, supabase, projectService]); // setProjectSearch 의존성 제거

  // 프로젝트 입력 포커스 핸들러
  const handleProjectFocus = useCallback(() => {
    // 신규 모드가 아닐 때만 드롭다운 표시 (null일 때도 표시 안함)
    if (formMode === 'change') {
      setShowDropdown(true)
    }
  }, [formMode])

  // 프로젝트 입력 블러 핸들러 (stale closure 문제 해결)
  const handleProjectBlur = useCallback(() => {
    setTimeout(() => {
      if (formMode === 'change') {
        const currentSearchTerm = projectSearchRef.current; // 최신 검색어 사용
        const matchingProjectByName = projectOptions.find(p => p.project_name === currentSearchTerm);
        const currentFormProjectId = form.getValues('project_id');
        const matchingProjectById = currentFormProjectId ? projectOptions.find(p => p.id === currentFormProjectId) : null;

        // 검색어와 일치하는 프로젝트가 없거나, 선택된 ID가 있는데 이름이 검색어와 다를 경우 ID 초기화
        if (currentSearchTerm && (!matchingProjectByName || (matchingProjectById && matchingProjectById.project_name !== currentSearchTerm)) ) {
           // 사용자가 드롭다운에서 선택하지 않고, 현재 입력된 텍스트가 어떤 프로젝트와도 정확히 일치하지 않는 경우
           // 그리고 현재 form에 project_id가 세팅되어있지만, 그 프로젝트의 이름과 현재 검색창의 내용이 다른 경우
           // (예: "A프로젝트" 선택 후, 검색창 내용을 "B"로 바꾼 뒤 blur)
           if(!matchingProjectByName && currentFormProjectId && matchingProjectById && matchingProjectById.project_name !== currentSearchTerm) {
            form.setValue('project_id', '', { shouldValidate: true });
           } else if (!matchingProjectByName && !currentFormProjectId) {
            // 텍스트는 있는데, 선택된 프로젝트 ID도 없고, 이름도 일치하는게 없는 경우 -> 그냥 둔다 (사용자가 새로 입력중일수도)
           }
        }
      }
      // 드롭다운은 selection 혹은 timeout 후 항상 닫힘
      setShowDropdown(false);
    }, 200);
  }, [projectOptions, form, formMode]); // projectSearch 의존성 제거, projectSearchRef 사용

  // 현재 프로젝트 ID가 변경될 때 검색어 업데이트 (더 안정적으로)
  useEffect(() => {
    if (formMode === 'change') {
      const currentFormProjectId = form.getValues('project_id');
      const currentFormProjectName = form.getValues('project_name'); // 폼에서 project_name 가져오기

      if (currentFormProjectId && projectOptions.length > 0) {
        const selectedProject = projectOptions.find(p => p.id === currentFormProjectId);
        if (selectedProject) {
          // 폼에 저장된 project_name을 사용하거나, selectedProject.project_name 사용
          const nameToSet = currentFormProjectName || selectedProject.project_name;
          if (projectSearchRef.current !== nameToSet) {
            setProjectSearch(nameToSet);
          }
        } else {
           setProjectSearch('');
        }
      } else if (!currentFormProjectId) {
        setProjectSearch('');
      }
    }
  }, [form.watch('project_id'), form.watch('project_name'), projectOptions, formMode, setProjectSearch]);

  // 프로젝트 검색어 변경 핸들러 - 개선됨
  const handleProjectSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setProjectSearch(newValue)
    
    if (formMode === 'change') {
      // 변경 모드에서만 드롭다운 표시
      setShowDropdown(newValue.length > 0) // 입력이 있을 때만 드롭다운 표시
      
      // 입력값으로 실시간 필터링만 하고, project_id는 실제 선택할 때만 변경
      // 기존의 project_id 초기화 로직 제거
    }
  }, [formMode])

  // 새 프로젝트 생성 핸들러 (제거됨 - 변경 모드에서는 사용하지 않음)
  const handleCreateNewProject = useCallback(async () => {
    // 변경 모드에서는 새 프로젝트 생성 기능을 사용하지 않음
    return;
  }, [])

  return (
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
            <Label htmlFor="project_id">프로젝트 *</Label>
            <div className="relative">
              {(() => {
                // UUID 형식인지 확인
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                const currentProjectId = form.getValues('project_id');
                const isProjectCreated = formMode === 'new' && uuidRegex.test(currentProjectId || '');
                
                return (
                  <Input
                    id="project_id"
                    placeholder={
                      isLoadingProjects 
                        ? "프로젝트 목록 로딩 중..." 
                        : formMode === 'new' 
                          ? (isProjectCreated ? "프로젝트 생성 완료" : "새 프로젝트명을 입력하세요")
                          : "기존 프로젝트 검색"
                    }
                    value={projectSearch}
                    onChange={handleProjectSearchChange}
                    onFocus={handleProjectFocus}
                    onBlur={handleProjectBlur}
                    autoComplete="off"
                    disabled={isProjectCreated}
                    readOnly={isProjectCreated}
                    className={isProjectCreated ? "bg-gray-100 cursor-not-allowed" : ""}
                  />
                );
              })()}
              {formMode !== 'new' && showDropdown && (
                <div className="border rounded bg-white shadow-lg absolute z-10 w-full max-h-60 overflow-auto mt-1">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                      <div
                        key={project.id}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        onClick={() => handleProjectSelect(project)}
                      >
                        {project.project_name}
                        {project.client_company_name && (
                          <span className="text-xs text-gray-500 ml-2">({project.client_company_name})</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">검색 결과 없음</div>
                  )}
                </div>
              )}
            </div>
            {form.formState.errors.project_id && (
              <p className="text-sm text-red-500">{form.formState.errors.project_id.message}</p>
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
              onValueChange={(value) => onFieldChange('client_type', value as ClientType)}
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
              onValueChange={(value) => onFieldChange('order_type', value as OrderType)}
              disabled={formMode === 'new'}
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
            onChange={onContractAmountChange}
          />
          {form.formState.errors.contract_amount && (
            <p className="text-sm text-red-500">{form.formState.errors.contract_amount.message}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 