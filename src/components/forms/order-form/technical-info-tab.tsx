"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransportType, REMEDIATION_METHODS, VERIFICATION_COMPANIES, ContaminationItem } from "@/types/order"
import { UseFormReturn } from "react-hook-form"
import { OrderFormData } from "@/types/order"
import { ContaminationSection } from "./contamination-section"

interface TechnicalInfoTabProps {
  form: UseFormReturn<OrderFormData>
  contaminationList: ContaminationItem[]
  onFieldChange: (field: keyof OrderFormData, value: any) => void
  onAddContamination: () => void
  onRemoveContamination: (index: number) => void
  onContaminationChange: (index: number, field: 'type' | 'value', value: any) => void
}

export function TechnicalInfoTab({ 
  form, 
  contaminationList, 
  onFieldChange,
  onAddContamination,
  onRemoveContamination,
  onContaminationChange
}: TechnicalInfoTabProps) {
  return (
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
              onValueChange={(value) => onFieldChange('transport_type', value as TransportType)}
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
              onValueChange={(value) => onFieldChange('remediation_method', value)}
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

        <ContaminationSection
          contaminationList={contaminationList}
          onAdd={onAddContamination}
          onRemove={onRemoveContamination}
          onChange={onContaminationChange}
          error={form.formState.errors.contamination_info?.message}
        />

        <div className="space-y-2">
          <Label>검증 업체 *</Label>
          <Select
            value={form.watch('verification_company')}
            onValueChange={(value) => onFieldChange('verification_company', value)}
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
  )
} 