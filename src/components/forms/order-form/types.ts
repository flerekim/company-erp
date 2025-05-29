import * as z from "zod"

// 오염 항목 스키마
export const contaminationItemSchema = z.object({
  type: z.string().min(1, "오염항목을 선택하세요"),
  value: z.number().min(0, "농도를 입력하세요")
})

// 수주 폼 스키마
export const orderSchema = z.object({
  project_id: z.string().min(1, "프로젝트를 선택해주세요"),
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
  status: z.enum(['contracted', 'in_progress', 'completed', 'bidding']),
  progress_percentage: z.number().min(0).max(100),
  primary_manager: z.string().min(1, "주담당자를 선택해주세요"),
  secondary_manager: z.string().optional()
})

// 폼 기본값
export const getDefaultValues = (initialData: any) => ({
  project_id: initialData?.project_id || '',
  project_name: initialData?.project_name || '',
  company_name: initialData?.company_name || '',
  client_type: initialData?.client_type || 'private',
  contract_date: initialData?.contract_date || new Date().toISOString().split('T')[0],
  contract_amount: initialData?.contract_amount || 0,
  order_type: initialData?.order_type || 'new',
  transport_type: initialData?.transport_type || 'onsite',
  remediation_method: initialData?.remediation_method || '',
  contamination_info: Array.isArray(initialData?.contamination_info) ? initialData.contamination_info : [],
  verification_company: initialData?.verification_company || '',
  status: initialData?.status || 'contracted',
  progress_percentage: initialData?.progress_percentage || 0,
  primary_manager: initialData?.primary_manager || '',
  secondary_manager: initialData?.secondary_manager || ''
}) 