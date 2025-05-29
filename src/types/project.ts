// src/types/project.ts

// 프로젝트 대표 상태 타입
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold' | 'canceled';

// 프로젝트 인터페이스
export interface Project {
  id: string;                   // 프로젝트 고유 ID (PK)
  project_name: string;         // 프로젝트명 (UNIQUE)
  status: ProjectStatus;        // 프로젝트 대표 상태
  client_company_name?: string; // 대표 고객사명 (첫 계약의 고객사 또는 직접 입력) - 논의 필요
  total_contract_amount?: number; // 해당 프로젝트의 총 계약금액 (계산된 값 또는 직접 관리) - 논의 필요
  start_date?: string;          // 프로젝트 시작일 (첫 계약일 또는 직접 입력)
  end_date?: string;            // 프로젝트 종료일 (마지막 계약 마감일 또는 직접 입력)
  created_at: string;
  updated_at: string;
}

// 프로젝트 폼 데이터 인터페이스 (필요시)
export interface ProjectFormData {
  project_name: string;
  status: ProjectStatus;
  client_company_name?: string;
  // ... 기타 프로젝트 생성/수정에 필요한 필드
}

// 프로젝트 상태 레이블 반환 함수
export const getProjectStatusLabel = (status: ProjectStatus | null | undefined): string => {
  if (!status) return "정보 없음";
  const labels: Record<ProjectStatus, string> = {
    planning: '계약전',
    active: '진행중',
    completed: '완료',
    on_hold: '보류',
    canceled: '취소',
  };
  return labels[status] || "알 수 없음";
}; 