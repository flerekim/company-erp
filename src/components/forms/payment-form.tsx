// src/components/forms/payment-form.tsx
// 입금 처리 폼 컴포넌트

"use client"

import { useState } from "react"
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
import { Calendar, DollarSign } from "lucide-react"
import { Receivable, PaymentFormData } from "@/types/receivables"

// 폼 검증 스키마
const paymentSchema = z.object({
  payment_date: z.string().min(1, "입금일을 선택해주세요"),
  payment_amount: z.number().min(1, "입금액을 입력해주세요"),
  payment_method: z.enum(['bank_transfer', 'check', 'cash', 'other'], {
    required_error: "입금 방법을 선택해주세요"
  }),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  depositor_name: z.string().optional(),
  memo: z.string().optional()
})

interface PaymentFormProps {
  receivable: Receivable
  onSubmit: (data: PaymentFormData) => void
  onCancel: () => void
}

export function PaymentForm({ receivable, onSubmit, onCancel }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      payment_amount: receivable.remaining_amount,
      payment_method: 'bank_transfer',
      bank_name: '',
      account_number: '',
      depositor_name: receivable.company_name,
      memo: ''
    }
  })

  const paymentMethodLabels = {
    bank_transfer: '계좌이체',
    check: '수표',
    cash: '현금',
    other: '기타'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchedPaymentAmount = form.watch('payment_amount')
  const watchedPaymentMethod = form.watch('payment_method')

  return (
    <div className="space-y-6">
      {/* 채권 정보 요약 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">채권 정보</CardTitle>
          <CardDescription>입금 처리할 채권의 기본 정보</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-500">채권번호</Label>
              <div className="font-mono">{receivable.receivable_number}</div>
            </div>
            <div>
              <Label className="text-gray-500">고객사</Label>
              <div className="flex items-center gap-2">
                <Badge className={
                  receivable.client_type === 'government' 
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-cyan-100 text-cyan-800'
                }>
                  {receivable.client_type === 'government' ? '관수' : '민수'}
                </Badge>
                <span>{receivable.company_name}</span>
              </div>
            </div>
            <div>
              <Label className="text-gray-500">프로젝트명</Label>
              <div className="truncate" title={receivable.project_name}>
                {receivable.project_name}
              </div>
            </div>
            <div>
              <Label className="text-gray-500">담당자</Label>
              <div>{receivable.primary_manager}</div>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-gray-500">총 계약금액</Label>
              <div className="font-semibold">{formatCurrency(receivable.total_amount)}</div>
            </div>
            <div>
              <Label className="text-gray-500">기입금액</Label>
              <div className="font-semibold text-green-600">{formatCurrency(receivable.paid_amount)}</div>
            </div>
            <div>
              <Label className="text-gray-500">미수금액</Label>
              <div className="font-semibold text-blue-600">{formatCurrency(receivable.remaining_amount)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 입금 정보 입력 폼 */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              입금 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_date">입금일 *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  {...form.register('payment_date')}
                />
                {form.formState.errors.payment_date && (
                  <p className="text-sm text-red-500">{form.formState.errors.payment_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_amount">입금액 *</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  placeholder="입금액을 입력하세요"
                  {...form.register('payment_amount', { valueAsNumber: true })}
                />
                {form.formState.errors.payment_amount && (
                  <p className="text-sm text-red-500">{form.formState.errors.payment_amount.message}</p>
                )}
                {watchedPaymentAmount && (
                  <p className="text-sm text-gray-500">
                    입금액: {formatCurrency(watchedPaymentAmount)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">입금 방법 *</Label>
              <Select
                value={form.watch('payment_method')}
                onValueChange={(value) => form.setValue('payment_method', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="입금 방법을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.payment_method && (
                <p className="text-sm text-red-500">{form.formState.errors.payment_method.message}</p>
              )}
            </div>

            {/* 계좌이체일 때 추가 필드 */}
            {watchedPaymentMethod === 'bank_transfer' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">입금 은행</Label>
                  <Input
                    id="bank_name"
                    placeholder="예: 국민은행"
                    {...form.register('bank_name')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_number">계좌번호</Label>
                  <Input
                    id="account_number"
                    placeholder="계좌번호를 입력하세요"
                    {...form.register('account_number')}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="depositor_name">입금자명</Label>
              <Input
                id="depositor_name"
                placeholder="입금자명을 입력하세요"
                {...form.register('depositor_name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <Textarea
                id="memo"
                placeholder="특이사항이나 메모를 입력하세요"
                rows={3}
                {...form.register('memo')}
              />
            </div>
          </CardContent>
        </Card>

        {/* 입금 후 예상 상태 */}
        {watchedPaymentAmount > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">입금 후 예상 상태</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">입금 후 수금액</Label>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(receivable.paid_amount + watchedPaymentAmount)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">입금 후 미수금액</Label>
                  <div className="font-semibold text-blue-600">
                    {formatCurrency(receivable.remaining_amount - watchedPaymentAmount)}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">수금률</Label>
                  <div className="font-semibold">
                    {Math.round(((receivable.paid_amount + watchedPaymentAmount) / receivable.total_amount) * 100)}%
                  </div>
                </div>
              </div>

              {watchedPaymentAmount >= receivable.remaining_amount && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    ✅ 이 입금으로 해당 채권이 완전히 정산됩니다.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? '처리 중...' : '입금 처리'}
          </Button>
        </div>
      </form>
    </div>
  )
}