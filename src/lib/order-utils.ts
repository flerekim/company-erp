import { ClientType, OrderStatus, OrderType, Order, ContaminationItem } from "@/types/order";

// contamination_info를 항상 배열로 변환하는 함수
export function toContaminationArray(val: any): ContaminationItem[] {
  if (Array.isArray(val)) {
    // 모든 요소가 ContaminationItem 형태인지 확인
    if (val.every(item => 
      typeof item === 'object' && 
      item !== null && 
      typeof item.type === 'string' && 
      typeof item.value === 'number'
    )) {
      return val as ContaminationItem[];
    }
    return []; 
  }
  if (typeof val === 'string') {
    try {
      const arr = JSON.parse(val);
      if (Array.isArray(arr) && arr.every(item => 
        typeof item === 'object' && 
        item !== null && 
        typeof item.type === 'string' && 
        typeof item.value === 'number'
      )) {
        return arr as ContaminationItem[];
      }
    } catch (e) {
      // console.warn("Failed to parse contamination_info string:", e); // 프로덕션에서는 로깅 시스템 사용 고려
    }
  }
  return [];
}

export const formatCurrency = (amount: number | null | undefined): string => {
  if (typeof amount !== 'number') return ""; // 0도 유효한 금액이므로 명시적으로 숫자 타입 확인
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    // ISO 8601 형식의 날짜 문자열인지 간단히 확인 (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        // console.warn("Invalid date format for formatDate:", dateString);
        // return "날짜 형식 오류"; 
    }
    const date = new Date(dateString);
    // 유효한 날짜 객체인지 확인
    if (isNaN(date.getTime())) {
        // console.warn("Invalid date value for formatDate:", dateString);
        return "유효하지 않은 날짜";
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    // console.error("Error formatting date:", dateString, error);
    return "날짜 변환 오류";
  }
};

export const getClientTypeBadge = (type: ClientType | null | undefined): string => {
  if (!type) return 'bg-gray-100 text-gray-800';
  return type === 'government' 
    ? 'bg-purple-100 text-purple-800'
    : 'bg-cyan-100 text-cyan-800';
};

export const getStatusBadge = (status: OrderStatus | null | undefined): string => {
  if (!status) return 'bg-gray-200 text-gray-700';
  const statusColors: Record<OrderStatus, string> = {
    contracted: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    bidding: 'bg-gray-200 text-gray-700',
  };
  return statusColors[status] ?? 'bg-gray-200 text-gray-700';
};

export const getTransportTypeBadge = (type: string | null | undefined): string => {
  if (!type) return 'bg-gray-100 text-gray-800';
  return type === 'onsite'
    ? 'bg-green-50 text-green-700'
    : 'bg-amber-50 text-amber-700';
};

export const getTransportTypeLabel = (type: string | null | undefined): string => {
  if (!type) return "정보 없음";
  return type === 'onsite' ? '부지내' : '반출';
};

export const getOrderTypeLabel = (type: OrderType | null | undefined): string => {
  if (!type) return "정보 없음";
  const labels: Record<OrderType, string> = {
    new: '신규',
    change1: '1차 변경',
    change2: '2차 변경',
    change3: '3차 변경',
    change4: '4차 변경',
    change5: '5차 변경'
  };
  return labels[type] || "알 수 없음";
};

export const getStatusLabel = (status: OrderStatus | null | undefined): string => {
  if (!status) return "정보 없음";
  const labels: Record<OrderStatus, string> = {
    contracted: '계약',
    in_progress: '진행중',
    completed: '완료',
    bidding: '입찰예정',
  };
  return labels[status] ?? status;
};

interface ContaminationGroupResult {
  foundGroups: string[];
  detectedSubstances: string[];
  originalInfo: string;
}

const CONTAMINATION_SUBSTANCE_GROUPS: Record<string, string[]> = {
  중금속류: ['카드뮴', '구리', '비소', '수은', '납', '6가크롬', '아연', '니켈'],
  유류: ['TPH', '벤젠', '톨루엔', '에틸벤젠', '크실렌', '벤조(a)피렌'],
  염소계용매: ['TCE', 'PCE', '1,2-디클로로에탄'],
  유기염소화합물: ['폴리클로리네이티드비페닐', 'PCB', '다이옥신'],
  기타유기물: ['유기인화합물', '페놀'],
  기타무기물: ['불소', '시안']
};

export const getContaminationGroups = (contaminationInfoInput: ContaminationItem[] | string | null | undefined): ContaminationGroupResult => {
  let infoStr = '';
  const contaminationItems = toContaminationArray(contaminationInfoInput); 

  if (contaminationItems.length > 0) {
    infoStr = contaminationItems.map(item => item.type).join(', ');
  } else if (typeof contaminationInfoInput === 'string') {
    // 문자열이지만 ContaminationItem[]으로 파싱되지 않은 경우, 원본 문자열을 사용하되, 사용에 주의
    infoStr = contaminationInfoInput;
  }

  const foundGroups: string[] = [];
  const detectedSubstances: string[] = [];

  if (infoStr) {
    const lowerInfoStr = infoStr.toLowerCase();
    Object.entries(CONTAMINATION_SUBSTANCE_GROUPS).forEach(([groupName, substances]) => {
      const foundInGroup = substances.filter(substance =>
        lowerInfoStr.includes(substance.toLowerCase())
      );
      if (foundInGroup.length > 0) {
        foundGroups.push(groupName);
        // detectedSubstances는 실제 ContaminationItem의 type에서 가져오는 것이 더 정확할 수 있음
        // 여기서는 그룹 매칭에 사용된 물질명으로 유지
        detectedSubstances.push(...foundInGroup);
      }
    });
  }
  
  return { foundGroups, detectedSubstances, originalInfo: infoStr };
};

export const getContaminationDisplay = (contaminationInfoInput: ContaminationItem[] | string | null | undefined): string => {
  const items = toContaminationArray(contaminationInfoInput);
  if (items.length === 0 && typeof contaminationInfoInput !== 'string') {
      return "정보 없음";
  }
  if (items.length === 0 && typeof contaminationInfoInput === 'string' && contaminationInfoInput.trim() === '') {
      return "정보 없음";
  }

  const { foundGroups } = getContaminationGroups(items.length > 0 ? items : contaminationInfoInput);
  
  if (foundGroups.length === 0) {
    return items.length > 0 || (typeof contaminationInfoInput === 'string' && contaminationInfoInput.trim() !== '') ? "기타오염" : "정보 없음";
  }
  if (foundGroups.length === 1) {
    return foundGroups[0];
  }
  if (foundGroups.length <= 2) {
    return foundGroups.join(", ");
  }
  return `${foundGroups.length}종 복합`;
};

// OrderWithFileCount 인터페이스는 src/types/order.ts에서 Order를 확장하여 정의하는 것이 좋습니다.
// 예시: export interface OrderWithFileCount extends Order { ... }
// 여기서는 일단 제거하고, page.tsx에서 직접 사용하거나 src/types/order.ts에 정의합니다. 