import { supabase } from './client';
import { Achievement, AchievementFormData } from '@/types/achievement';

const ACHIEVEMENTS_TABLE = 'achievements'; // Supabase 테이블명

export const achievementService = {
  // 전체 실적 조회
  getAll: async (): Promise<Achievement[]> => {
    const { data, error } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .select('*')
      .order('achievement_date', { ascending: false }); // 최신순 정렬
    if (error) throw error;
    return data || [];
  },

  // ID로 특정 실적 조회
  getById: async (id: string): Promise<Achievement | null> => {
    const { data, error } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') { // PGRST116: row not found, 이 경우는 null 반환이 맞음
        throw error;
    }
    return data;
  },

  // 새 실적 생성
  create: async (formData: AchievementFormData): Promise<Achievement | null> => {
    const achievementData = {
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .insert(achievementData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 실적 수정
  update: async (id: string, formData: Partial<AchievementFormData>): Promise<Achievement | null> => {
    const achievementData = {
        ...formData,
        updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .update(achievementData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // 실적 삭제
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // 특정 수주(order_id)에 연결된 실적들 조회 (필요시 사용)
  getByOrderId: async (orderId: string): Promise<Achievement[]> => {
    const { data, error } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .select('*')
      .eq('order_id', orderId)
      .order('achievement_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // 특정 프로젝트(project_id)에 연결된 실적들 조회
  getAllByProjectId: async (projectId: string): Promise<Achievement[]> => {
    const { data, error } = await supabase
      .from(ACHIEVEMENTS_TABLE)
      .select('*')
      .eq('project_id', projectId)
      .order('achievement_date', { ascending: false }); // 최신순 정렬
    if (error) throw error;
    return data || [];
  },
}; 