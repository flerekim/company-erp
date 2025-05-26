// src/components/forms/order-form.tsx
"use client"

import { useState } from "react"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X, Building, Users } from "lucide-react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { cn } from "@/lib/utils"

// 타입 정의 (컴포넌트 내부에서 정의)
type ClientType = 'government' | 'private'
type OrderType = 'new' | 'change1' | 'change2' | 'change3'
type TransportType = 'onsite' | 'transport'

interface FormData {
  company_id: string
  primary_manager_id: string
  secondary_manager_id: string
  project_name: string
  client_type: ClientType
  contract_number: string
  contract_date: string
  contract_amount: number
  order_type: OrderType
  original_order_id: string
  transport_type: TransportType
  remediation_method: string
  contamination_info: string
  verification_company: string
  start_date: string
  expected_end_date: string
  notes: string
}

interface OrderFormProps {
  onSubmit: (data: FormData) => void
  onCancel: () => void
  initialData?: any
  isEditing?: boolean
}

// 라벨 상수
const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  government: '관수',
  private: '민수'
}

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  new: '신규',
  change1: '1차 변경',
  change2: '2차 변경',
  change3: '3차 변경'
}

const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  onsite: '부지내',
  transport: '반출'
}

// 실제 엑셀 데이터 기반 옵션들
const SAMPLE_COMPANIES = [
  { id: "comp1", name: "제2218부대", type: "government" as ClientType },
  { id: "comp2", name: "육군5378부대", type: "government" as ClientType },
  { id: "comp3", name: "한국토지주택공사", type: "private" as ClientType },
  { id: "comp4", name: "인천광역시 종합건설본부", type: "government" as ClientType },
  { id: "comp5", name: "경기도 환경정화공단", type: "government" as ClientType },
]

const SAMPLE_MANAGERS = [
  { id: "emp1", name: "이대룡" },
  { id: "emp2", name: "백승호" },
  { id: "emp3", name: "박찬수" },
  { id: "emp4", name: "최진우" },
  { id: "emp5", name: "김판근" },
]

const REMEDIATION_METHODS = [
  "토양경작법",
  "토양세척법", 
  "열탈착법",
  "고형화/안정화법",
  "바이오파일법",
  "전기정화법",
  "토양경작법, 토양세척법",
  "토양세척법, 열탈착법"
]

const COMMON_CONTAMINANTS = [
  "TPH",
  "BTEX", 
  "TCE",
  "PCE",
  "납",
  "카드뮴",
  "6가크롬",
  "비소",
  "TPH(3,915mg/kg)",
  "BTEX(150mg/kg)"
]

const VERIFICATION_COMPANIES = [
  "울산과학대학교 산학협력단",
  "재단법인 경기환경과학연구원",
  "한국환경공단",
  "국립환경과학원",
  "서울시립대학교 산학협력단"
]

export function OrderForm({ onSubmit, onCancel, initialData, isEditing = false }: OrderFormProps) {
  const [formData, setFormData] = useState<FormData>({
    company_id: initialData?.company_id || "",
    primary_manager_id: initialData?.primary_manager_id || "",
    secondary_manager_id: initialData?.secondary_manager_id || "",
    project_name: initialData?.project_name || "",
    client_type: initialData?.client_type || "government",
    contract_number: initialData?.contract_number || "",
    contract_date: initialData?.contract_date || "",
    contract_amount: initialData?.contract_amount || 0,
    order_type: initialData?.order_type || "new",
    original_order_id: initialData?.original_order_id || "",
    transport_type: initialData?.transport_type || "transport",
    remediation_method: initialData?.remediation_method || "",
    contamination_info: initialData?.contamination_info || "",
    verification_company: initialData?.verification_company || "",
    start_date: initialData?.start_date || "",
    expected_end_date: initialData?.expected_end_date || "",
    notes: initialData?.notes || "",
  })

  const [contractDate, setContractDate] = useState<Date | undefined>(
    initialData?.contract_date ? new Date(initialData.contract_date) : undefined
  )
  const [startDate, setStartDate] = useState<Date | undefined>(
    initialData?.start_date ? new Date(initialData.start_date) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    initialData?.expected_end_date ? new Date(initialData.expected_end_date) : undefined
  )

  const [isSubmitting, setIsSubmitting] = useState(false)

  // 선택된 고객사에 따라 민관구분 자동 설정
  const selectedCompany = SAMPLE_COMPANIES.find(c => c.id === formData.company_id)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const submitData: FormData = {
        ...formData,
        contract_date: contractDate ? contractDate.toISOString().split('T')[0] : "",
        start_date: startDate ? startDate.toISOString().split('T')[0] : "",
        expected_end_date: endDate ? endDate.toISOString().split('T')[0] : "",
        client_type: selectedCompany?.type || formData.client_type
      }
      
      await onSubmit(submitData)
    } catch (error) {
      console.error("수주 저장 오류:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            기본 정보
          </CardTitle>
          <CardDescription>수주의 기본 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">계약업체 *</Label>
              <Select value={formData.company_id} onValueChange={(value) => updateFormData("company_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="계약업체를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_COMPANIES.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          company.type === 'government' ? 'bg-purple-500' : 'bg-cyan-500'
                        }`} />
                        {company.name} ({CLIENT_TYPE_LABELS[company.type]})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contract_number">계약번호</Label>
              <Input
                id="contract_number"
                placeholder="계약번호를 입력하세요"
                value={formData.contract_number}
                onChange={(e) => updateFormData("contract_number", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_name">공사명 *</Label>
            <Textarea
              id="project_name"
              placeholder="예: 24-A-OO부대 토양오염정화공사(1517)"
              value={formData.project_name}
              onChange={(e) => updateFormData("project_name", e.target.value)}
              required
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_type">구분 *</Label>
              <Select value={formData.order_type} onValueChange={(value) => updateFormData("order_type", value as OrderType)}>
                <SelectTrigger>
                  <SelectValue placeholder="구분을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contract_amount">계약금액 (원) *</Label>
              <Input
                id="contract_amount"
                type="number"
                placeholder="0"
                value={formData.contract_amount}
                onChange={(e) => updateFormData("contract_amount", parseInt(e.target.value) || 0)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>계약일자</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !contractDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {contractDate ? (
                      format(contractDate, "PPP", { locale: ko })
                    ) : (
                      "계약일자를 선택하세요"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={contractDate}
                    onSelect={(date) => {
                      setContractDate(date)
                      updateFormData("contract_date", date ? date.toISOString().split('T')[0] : "")
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 기술 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기술 정보</CardTitle>
          <CardDescription>토양정화 관련 기술적 세부사항을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transport_type">반출여부</Label>
              <Select value={formData.transport_type} onValueChange={(value) => updateFormData("transport_type", value as TransportType)}>
                <SelectTrigger>
                  <SelectValue placeholder="반출여부를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRANSPORT_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remediation_method">정화방법</Label>
              <Select value={formData.remediation_method} onValueChange={(value) => updateFormData("remediation_method", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="정화방법을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안함</SelectItem>
                  {REMEDIATION_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contamination_info">오염항목</Label>
              <Select value={formData.contamination_info} onValueChange={(value) => updateFormData("contamination_info", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="오염항목을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안함</SelectItem>
                  {COMMON_CONTAMINANTS.map((contaminant) => (
                    <SelectItem key={contaminant} value={contaminant}>
                      {contaminant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification_company">검증업체</Label>
              <Select value={formData.verification_company} onValueChange={(value) => updateFormData("verification_company", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="검증업체를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안함</SelectItem>
                  {VERIFICATION_COMPANIES.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 담당자 및 일정 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            담당자 및 일정 정보
          </CardTitle>
          <CardDescription>프로젝트 담당자와 일정을 설정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_manager_id">주담당자</Label>
              <Select value={formData.primary_manager_id} onValueChange={(value) => updateFormData("primary_manager_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="주담당자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안함</SelectItem>
                  {SAMPLE_MANAGERS.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary_manager_id">부담당자</Label>
              <Select value={formData.secondary_manager_id} onValueChange={(value) => updateFormData("secondary_manager_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="부담당자를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안함</SelectItem>
                  {SAMPLE_MANAGERS.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>착수일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP", { locale: ko })
                    ) : (
                      "착수일을 선택하세요"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date)
                      updateFormData("start_date", date ? date.toISOString().split('T')[0] : "")
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>완료예정일</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP", { locale: ko })
                    ) : (
                      "완료예정일을 선택하세요"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date)
                      updateFormData("expected_end_date", date ? date.toISOString().split('T')[0] : "")
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">비고</Label>
            <Textarea
              id="notes"
              placeholder="추가 사항이나 특이사항을 입력하세요"
              value={formData.notes}
              onChange={(e) => updateFormData("notes", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 변경 수주인 경우 원본 수주 선택 */}
      {formData.order_type !== 'new' && (
        <Card>
          <CardHeader>
            <CardTitle>변경 수주 정보</CardTitle>
            <CardDescription>원본 수주를 선택하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="original_order_id">원본 수주</Label>
              <Select value={formData.original_order_id} onValueChange={(value) => updateFormData("original_order_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="원본 수주를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안함</SelectItem>
                  <SelectItem value="4">ORD-2024-004 - 숭인지하차도 및 연결도로 건설공사</SelectItem>
                  <SelectItem value="3">ORD-2021-003 - 광명시흥 일반산업단지 정화용역</SelectItem>
                  {/* 실제로는 기존 수주 목록에서 가져와야 함 */}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 계약금액 요약 */}
      {formData.contract_amount > 0 && (
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700">계약금액 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">계약금액:</span>
                <div className="font-medium">
                  {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
                    .format(formData.contract_amount)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">부가세 (10%):</span>
                <div className="font-medium">
                  {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
                    .format(formData.contract_amount * 0.1)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">총액:</span>
                <div className="font-bold text-blue-700">
                  {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' })
                    .format(formData.contract_amount * 1.1)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "저장 중..." : isEditing ? "수정하기" : "등록하기"}
        </Button>
      </div>
    </form>
  )
}