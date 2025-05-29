import { ClientType, OrderStatus, TransportType } from "./order"; // 기존 order 타입 활용

// 실적 단위 타입
export type AchievementUnit = 'ton' | 'm3' | 'unit' | 'none'; // Ton, ㎥, 대, -

// 실적 데이터 인터페이스
export interface Achievement {
  id: string;                   // 고유 ID (PK)
  project_id: string;           // <<<< 프로젝트 ID (FK) - NEW
  order_id: string;             // 수주 ID (FK)
  project_name: string;         // 프로젝트명 (UI 표시용)
  client_type: ClientType;      // 고객사 유형 (수주 정보에서 가져옴)
  status: OrderStatus;          // 현재 수주 상태 (수주 정보에서 가져옴)
  manager: string;              // 담당자 (수주 정보에서 가져옴)
  achievement_date: string;     // 실적 일자
  transport_type: TransportType;// 정화 장소 (수주 정보에서 가져옴)
  unit: AchievementUnit;        // 단위
  quantity: number;             // 수량 (소수점 둘째 자리까지)
  unit_price: number;           // 단가
  amount: number;               // 금액 (수량 * 단가 또는 직접 입력)
  remarks?: string;              // 비고 (선택 사항)
  created_at: string;           // 생성일
  updated_at: string;           // 수정일
}

// 실적 폼 데이터 인터페이스
export interface AchievementFormData {
  project_id: string;           // 선택된 프로젝트 ID (필수)
  order_id: string;             // 연결된 수주 ID (필수)
  project_name: string;         // <<<< 프로젝트명 (UI에서 project_id와 함께 설정) - NEW
  achievement_date: string;     // 실적 일자 (필수)
  unit: AchievementUnit;        // 단위 (필수)
  quantity: number;             // 수량 (필수, 0보다 커야 함)
  unit_price: number;           // 단가 (필수, 0보다 커야 함)
  amount: number;               // 금액 (필수, 0보다 커야 함)
  remarks?: string;              // 비고
  // 아래 필드들은 order_id 또는 project_id 선택 시 자동으로 채워질 수 있음
  client_type?: ClientType;
  status?: OrderStatus;
  manager?: string;
  transport_type?: TransportType;
}

// 실적 목록 표시에 사용될 수 있는 확장 인터페이스 (필요시)
export interface AchievementWithDetails extends Achievement {
  // 추가적인 정보가 필요하다면 여기에 정의
}

export const ACHIEVEMENT_UNITS: { value: AchievementUnit; label: string }[] = [
  { value: 'ton', label: 'Ton' },
  { value: 'm3', label: '㎥' },
  { value: 'unit', label: '대' },
  { value: 'none', label: '-' },
];

export function getAchievementUnitLabel(unit: AchievementUnit | undefined): string {
  if (!unit) return '';
  const found = ACHIEVEMENT_UNITS.find(u => u.value === unit);
  return found ? found.label : '';
} 