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
import { Users } from "lucide-react"
import { OrderStatus, MANAGERS } from "@/types/order"
import { UseFormReturn } from "react-hook-form"
import { OrderFormData } from "@/types/order"

interface ManagementInfoTabProps {
  form: UseFormReturn<OrderFormData>
  onFieldChange: (field: keyof OrderFormData, value: any) => void
}

export function ManagementInfoTab({ form, onFieldChange }: ManagementInfoTabProps) {
  return (
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
                <SelectItem value="bidding">입찰예정</SelectItem>
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
              onValueChange={(value) => onFieldChange('primary_manager', value)}
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
  )
} 