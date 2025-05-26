"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PaymentMethod } from "@/types/receivables"

const paymentFormSchema = z.object({
  payment_amount: z.number().min(1, "입금액을 입력하세요"),
  payment_date: z.string().min(1, "입금일을 선택하세요"),
  payment_method: z.enum(["bank_transfer", "check", "cash", "card"] as const, {
    required_error: "입금 방법을 선택하세요",
  }),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  notes: z.string().optional(),
})

type PaymentFormValues = z.infer<typeof paymentFormSchema>

interface PaymentFormProps {
  receivable: {
    id: string
    receivable_number: string
    project_name: string
    company_name: string
    remaining_amount: number
  }
  onSubmit: (data: PaymentFormValues) => void
  onCancel: () => void
}

export function PaymentForm({ receivable, onSubmit, onCancel }: PaymentFormProps) {
  const [showBankFields, setShowBankFields] = useState(false)

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      payment_amount: receivable.remaining_amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: "bank_transfer",
      bank_name: "",
      account_number: "",
      notes: "",
    },
  })

  const handlePaymentMethodChange = (value: PaymentMethod) => {
    setShowBankFields(value === "bank_transfer")
    form.setValue("payment_method", value)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">채권번호</div>
              <div className="text-sm text-gray-500">{receivable.receivable_number}</div>
            </div>
            <div>
              <div className="text-sm font-medium">프로젝트명</div>
              <div className="text-sm text-gray-500">{receivable.project_name}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">고객사</div>
              <div className="text-sm text-gray-500">{receivable.company_name}</div>
            </div>
            <div>
              <div className="text-sm font-medium">미수금액</div>
              <div className="text-sm text-gray-500">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                  maximumFractionDigits: 0
                }).format(receivable.remaining_amount)}
              </div>
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="payment_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>입금액</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>입금일</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>입금 방법</FormLabel>
              <Select
                onValueChange={handlePaymentMethodChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="입금 방법 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="bank_transfer">계좌이체</SelectItem>
                  <SelectItem value="check">어음</SelectItem>
                  <SelectItem value="cash">현금</SelectItem>
                  <SelectItem value="card">카드</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showBankFields && (
          <>
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>은행명</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>계좌번호</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비고</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
          <Button type="submit">입금 처리</Button>
        </div>
      </form>
    </Form>
  )
} 