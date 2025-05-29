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
import { ClientType, OrderType } from "@/types/order"
import { UseFormReturn } from "react-hook-form"
import { OrderFormData } from "@/types/order"
import { supabase } from '@/lib/supabase/client'
import { useState, useEffect } from "react"

interface BasicInfoTabProps {
  form: UseFormReturn<OrderFormData>
  formMode: 'new' | 'change'
  contractAmountDisplay: string
  onContractAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFieldChange: (field: keyof OrderFormData, value: any) => void
}

export function BasicInfoTab({ 
  form, 
  formMode, 
  contractAmountDisplay, 
  onContractAmountChange,
  onFieldChange 
}: BasicInfoTabProps) {
  const initialProjectName = form.getValues('project_name');
  const [projectOptions, setProjectOptions] = useState<{project_name: string, company_name: string, client_type: ClientType}[]>([])
  const [projectSearch, setProjectSearch] = useState(initialProjectName || '')
  const [filteredProjects, setFilteredProjects] = useState<typeof projectOptions>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // formMode나 form의 project_name이 변경될 때 projectSearch 동기화
  useEffect(() => {
    if (formMode === 'change') {
      const currentProjectNameInForm = form.getValues('project_name');
      setProjectSearch(currentProjectNameInForm || '');
    }
  }, [formMode, form.watch('project_name'), form]);

  // 변경계약일 때 기존 프로젝트 목록 fetch
  useEffect(() => {
    if (formMode === 'change') {
      supabase
        .from('orders')
        .select('project_name, company_name, client_type')
        .eq('order_type', 'new')
        .then(({ data }) => {
          const unique = Array.from(new Map((data ?? []).map(item => [item.project_name, item])).values())
          setProjectOptions(unique)
          setFilteredProjects(unique)
        })
    }
  }, [formMode])

  // 프로젝트명 자동완성 필터링
  useEffect(() => {
    if (formMode === 'change') {
      setFilteredProjects(
        projectOptions.filter(opt => opt.project_name.toLowerCase().includes(projectSearch.toLowerCase()))
      )
    }
  }, [projectSearch, projectOptions, formMode])

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
            <Label htmlFor="project_name">프로젝트명 *</Label>
            {formMode === 'new' ? (
              <Input
                id="project_name"
                placeholder="예: 24-A-OO부대 토양오염정화공사"
                {...form.register('project_name')}
              />
            ) : (
              <div>
                <Input
                  id="project_name"
                  placeholder="기존 프로젝트명 검색"
                  value={projectSearch}
                  onChange={e => {
                    setProjectSearch(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  autoComplete="off"
                />
                {showDropdown && projectSearch && filteredProjects.length > 0 && (
                  <div className="border rounded bg-white shadow absolute z-10 w-full max-h-40 overflow-auto">
                    {filteredProjects.map(opt => (
                      <div
                        key={opt.project_name}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                        onClick={async () => {
                          setShowDropdown(false)
                          setProjectSearch(opt.project_name)
                          const { data } = await supabase
                            .from('orders')
                            .select('*')
                            .eq('project_name', opt.project_name)
                            .order('created_at', { ascending: true })
                            .limit(1)
                            .single()
                          if (data) {
                            form.setValue('project_name', data.project_name)
                            form.setValue('company_name', data.company_name)
                            form.setValue('client_type', data.client_type)
                            form.setValue('remediation_method', data.remediation_method)
                            form.setValue('contamination_info', data.contamination_info)
                            form.setValue('verification_company', data.verification_company)
                            form.setValue('status', data.status)
                            form.setValue('progress_percentage', data.progress_percentage)
                            form.setValue('contract_date', data.contract_date)
                            form.setValue('primary_manager', data.primary_manager)
                            form.setValue('secondary_manager', data.secondary_manager)
                          }
                        }}
                      >
                        {opt.project_name} <span className="text-xs text-gray-400">({opt.company_name})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              onValueChange={(value) => form.setValue('order_type', value as OrderType)}
              disabled={formMode === 'new'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formMode === 'new' ? (
                  <SelectItem value="new">신규</SelectItem>
                ) : (
                  <>
                    <SelectItem value="change1">1차 변경</SelectItem>
                    <SelectItem value="change2">2차 변경</SelectItem>
                    <SelectItem value="change3">3차 변경</SelectItem>
                    <SelectItem value="change4">4차 변경</SelectItem>
                    <SelectItem value="change5">5차 변경</SelectItem>
                  </>
                )}
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