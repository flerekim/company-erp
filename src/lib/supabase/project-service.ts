import { SupabaseClient } from '@supabase/supabase-js';
import { Project, ProjectFormData, ProjectStatus } from '@/types/project';
import { Database } from '@/types_db';

type TypedSupabaseClient = SupabaseClient<Database>;

export class ProjectService {
  private supabase: TypedSupabaseClient;

  constructor(supabaseClient: TypedSupabaseClient) {
    this.supabase = supabaseClient;
  }

  async getProjects(options?: {
    searchTerm?: string;
    statusFilter?: ProjectStatus[];
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Project[] | null; error: any; count: number | null }> {
    let query = this.supabase.from('projects').select('*', { count: 'exact' });

    if (options?.searchTerm) {
      query = query.ilike('project_name', `%${options.searchTerm}%`);
    }
    if (options?.statusFilter && options.statusFilter.length > 0) {
      query = query.in('status', options.statusFilter);
    }
    if (options?.page && options?.pageSize) {
      const from = (options.page - 1) * options.pageSize;
      const to = from + options.pageSize - 1;
      query = query.range(from, to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;
    return { data: data as Project[] | null, error, count };
  }

  async getProjectById(id: string): Promise<{ data: Project | null; error: any }> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    return { data: data as Project | null, error };
  }

  async getProjectByName(projectName: string): Promise<{ data: Project | null; error: any }> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('project_name', projectName)
      .maybeSingle();
    return { data: data as Project | null, error };
  }

  async createProject(projectData: ProjectFormData): Promise<{ data: Project | null; error: any }> {
    console.log("=== ProjectService.createProject 시작 ===");
    console.log("입력 데이터:", projectData);
    
    try {
      console.log("기존 프로젝트 이름 중복 체크 시작...");
      const existingProject = await this.getProjectByName(projectData.project_name);
      console.log("중복 체크 결과:", existingProject);
      
      if (existingProject.data) {
        console.log("이미 존재하는 프로젝트명");
        return { data: null, error: { message: '이미 존재하는 프로젝트명입니다.' } };
      }

      console.log("프로젝트 데이터베이스 삽입 시작...");
      const { data, error } = await this.supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();
        
      console.log("데이터베이스 삽입 결과:", { data, error });
      return { data: data as Project | null, error };
    } catch (exception) {
      console.error("ProjectService.createProject 예외:", exception);
      return { data: null, error: exception };
    }
  }

  async updateProject(id: string, projectData: Partial<ProjectFormData>): Promise<{ data: Project | null; error: any }> {
    if (projectData.project_name) {
        const { data: existingProject, error: fetchError } = await this.supabase
            .from('projects')
            .select('id')
            .eq('project_name', projectData.project_name)
            .not('id', 'eq', id)
            .maybeSingle();

        if (fetchError) return { data: null, error: fetchError };
        if (existingProject) {
            return { data: null, error: { message: '이미 존재하는 프로젝트명입니다.' } };
        }
    }

    const { data, error } = await this.supabase
      .from('projects')
      .update(projectData)
      .eq('id', id)
      .select()
      .single();
    return { data: data as Project | null, error };
  }

  async deleteProject(id: string): Promise<{ error: any }> {
    const { error } = await this.supabase.from('projects').delete().eq('id', id);
    return { error };
  }
} 