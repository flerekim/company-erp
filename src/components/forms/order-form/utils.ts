import { OrderType } from "@/types/order"

// 통화 포맷팅
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(amount)
}

// 숫자를 천단위 콤마 형식으로 포맷팅
export const formatNumberWithCommas = (value: string) => {
  const numbersOnly = value.replace(/[^0-9]/g, '')
  return numbersOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 콤마가 포함된 문자열을 숫자로 변환
export const parseFormattedNumber = (value: string) => {
  return parseInt(value.replace(/,/g, '')) || 0
}

// 수주 유형 라벨 가져오기
export const getOrderTypeLabel = (type: OrderType) => {
  const labels = {
    new: '신규',
    change1: '1차 변경',
    change2: '2차 변경',
    change3: '3차 변경',
    change4: '4차 변경',
    change5: '5차 변경'
  }
  return labels[type]
}

// contamination_info 안전 변환 함수
export const toContaminationArray = (val: any) => {
  if (Array.isArray(val)) return val
  return []
} 