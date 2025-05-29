import { SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderFormData, OrderWithFileCount, ContaminationItem, OrderStatus, ClientType } from '@/types/order';
import { Database } from '@/types_db'; // types_db.ts 파일 경로 확인 필요
import { ProjectService } from './project-service';

type TypedSupabaseClient = SupabaseClient<Database>;

export class OrderService {
  private supabase: TypedSupabaseClient;
  private projectService: ProjectService;

  constructor(supabaseClient: TypedSupabaseClient) {
    this.supabase = supabaseClient;
    this.projectService = new ProjectService(supabaseClient);
  }

  // 수주 생성
  async createOrder(orderData: OrderFormData): Promise<{ data: Order | null; error: any }> {
    let projectId = orderData.project_id;

    if (!projectId && orderData.project_name) {
      const { data: existingProject } = await this.projectService.getProjectByName(orderData.project_name);
      if (existingProject) {
        projectId = existingProject.id;
      } else {
        const { data: newProject, error: newProjectError } = await this.projectService.createProject({
          project_name: orderData.project_name,
          status: 'active', // 신규 프로젝트 기본 상태
          client_company_name: orderData.company_name, // 첫 계약의 고객사를 대표 고객사로 설정 (예시)
        });
        if (newProjectError || !newProject) {
          return { data: null, error: newProjectError || { message: '프로젝트 생성 실패' } };
        }
        projectId = newProject.id;
      }
    } else if (!projectId && !orderData.project_name) {
        return { data: null, error: { message: '프로젝트 정보(ID 또는 이름)가 필요합니다.' } };
    }

    const orderToInsert = {
      ...orderData,
      project_id: projectId, // 여기서 project_id를 확실히 설정
      contamination_info: JSON.stringify(orderData.contamination_info),
    };
    
    // OrderFormData에 project_id 필드가 있으므로, DB에 project_id 컬럼이 있다면 별도 delete 불필요

    const { data, error } = await this.supabase
      .from('orders')
      .insert(orderToInsert as any) // DB 스키마에 따른 타입캐스팅 필요 시 주의
      .select()
      .single();
    
    if (error) {
        console.error("Error creating order:", error);
        return { data: null, error };
    }
    // 반환 시 contamination_info를 다시 객체로 변환
    return { data: { ...data, contamination_info: orderData.contamination_info } as Order, error: null };
  }

  // 수주 업데이트
  async updateOrder(id: string, orderData: Partial<OrderFormData>): Promise<{ data: Order | null; error: any }> {
    const updatePayload: any = { ...orderData };

    if (orderData.contamination_info && Array.isArray(orderData.contamination_info)) {
      updatePayload.contamination_info = JSON.stringify(orderData.contamination_info);
    }
    
    // project_name 또는 project_id 변경 관련 로직 (필요시)
    // 만약 orderData에 project_name이 있고 이것이 project_id와 동기화되어야 한다면,
    // 또는 project_id 자체가 변경되는 시나리오라면 해당 로직을 여기에 추가합니다.
    // 현재는 project_id는 create 시점에 결정되고, update 시에는 직접 변경하지 않는다고 가정합니다.
    // 만약 OrderForm에서 project_id 필드를 직접 수정할 수 있다면, 해당 값이 updatePayload에 포함됩니다.

    const { data, error } = await this.supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
        console.error("Error updating order:", error);
        return { data: null, error };
    }

    // 반환 시 contamination_info를 다시 객체로 변환
    const updatedOrder = {
        ...data,
        contamination_info: data.contamination_info ? JSON.parse(data.contamination_info as string) : []
    } as Order;
    
    return { data: updatedOrder, error: null };
  }

  // 수주 목록 조회 (페이지네이션, 검색, 필터링, 정렬 포함)
  async getOrders(options: {
    searchTerm?: string;
    statusFilter?: OrderStatus[]; 
    clientTypeFilter?: ClientType[];
    managerFilter?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    projectId?: string; // 프로젝트 ID 필터 추가
    isAllView?: boolean; 
  }): Promise<{ data: OrderWithFileCount[] | null; error: any; count: number | null }> {
    const {
      searchTerm,
      statusFilter,
      clientTypeFilter,
      managerFilter,
      page = 1,
      pageSize = 10,
      sortBy = 'contract_date', // 기본 정렬 필드
      sortDirection = 'desc', // 기본 정렬 방향
      projectId,
      // isAllView = false, // isAllView 사용 여부에 따라 로직 추가
    } = options;

    let query = this.supabase
      .from('orders')
      .select('*, files(id)', { count: 'exact' });

    if (searchTerm) {
      query = query.or(
        `project_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,order_number.ilike.%${searchTerm}%`
      );
    }
    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter);
    }
    if (clientTypeFilter && clientTypeFilter.length > 0) {
      query = query.in('client_type', clientTypeFilter);
    }
    if (managerFilter) {
      query = query.or(`primary_manager.eq.${managerFilter},secondary_manager.eq.${managerFilter}`);
    }
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // 정렬 로직
    const sortOptions = { ascending: sortDirection === 'asc' };
    // text 컬럼 외 정렬은 별도 처리 없이 가능. text는 DB collation 설정에 따라 동작.
    query = query.order(sortBy, sortOptions);
        
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return { data: null, error, count: 0 };
    }

    const ordersWithDetails = data?.map(order => {
      let parsedContaminationInfo: ContaminationItem[] | string;
      try {
        parsedContaminationInfo = (typeof order.contamination_info === 'string' && order.contamination_info) 
                                    ? JSON.parse(order.contamination_info) 
                                    : order.contamination_info || [];
      } catch (e) {
        console.error('Failed to parse contamination_info for order id:', order.id, e);
        parsedContaminationInfo = []; 
      }
      return {
        ...order,
        contamination_info: parsedContaminationInfo,
        fileCount: Array.isArray(order.files) ? order.files.length : 0,
      };
    }) || [];
    
    return { data: ordersWithDetails as OrderWithFileCount[], error: null, count };
  }

  // ID로 수주 조회
  async getOrderById(id: string): Promise<{ data: Order | null; error: any }> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*, files(id)') // 파일 정보도 함께 가져오도록 유지
      .eq('id', id)
      .single();

    if (error) {
        console.error(`Error fetching order by id ${id}:`, error);
        return { data: null, error };
    }
    if (!data) return { data: null, error: { message: 'Order not found' } };

    let parsedContaminationInfo: ContaminationItem[] | string;
    try {
        parsedContaminationInfo = (typeof data.contamination_info === 'string' && data.contamination_info) 
                                    ? JSON.parse(data.contamination_info) 
                                    : data.contamination_info || [];
    } catch (e) {
        console.error('Failed to parse contamination_info for order id (getOrderById):', data.id, e);
        parsedContaminationInfo = []; // 파싱 실패 시 빈 배열
    }

    return { 
        data: { 
            ...data, 
            contamination_info: parsedContaminationInfo,
            // files는 relation으로 가져오므로 fileCount는 OrderWithFileCount에서 주로 사용. Order 타입에는 fileCount가 없음.
            // 필요하다면 Order 타입에도 fileCount를 추가하거나, 반환 타입을 조정해야 합니다.
            // attachments: data.files, // 만약 files relation 결과를 attachments에 매핑하고 싶다면
        } as Order, 
        error: null 
    };
  }
  
  // 프로젝트 ID로 모든 수주 계약 목록 조회 (변경 계약 포함)
  async getOrdersByProjectId(projectId: string): Promise<{ data: Order[] | null; error: any; project_name?: string }> {
    const { data: projectData, error: projectError } = await this.projectService.getProjectById(projectId);
    // projectError 처리 로직은 필요에 따라 추가

    const { data, error } = await this.supabase
        .from('orders')
        .select('*') // 여기서는 file count는 필요 없을 수 있음. 필요하면 추가
        .eq('project_id', projectId)
        .order('order_type', { ascending: true }) 
        .order('contract_date', { ascending: true });

    if (error) {
        console.error(`Error fetching orders by project_id ${projectId}:`, error);
        return { data: null, error };
    }
    
    const ordersWithParsedContamination = data?.map(order => {
        let parsedContaminationInfo: ContaminationItem[] | string;
        try {
            parsedContaminationInfo = (typeof order.contamination_info === 'string' && order.contamination_info) 
                                        ? JSON.parse(order.contamination_info) 
                                        : order.contamination_info || [];
        } catch (e) {
            console.error('Failed to parse contamination_info for order id (getOrdersByProjectId):', order.id, e);
            parsedContaminationInfo = [];
        }
        return {
            ...order,
            contamination_info: parsedContaminationInfo,
        };
    }) || [];

    return { data: ordersWithParsedContamination as Order[], error: null, project_name: projectData?.project_name };
  }

  // 수주 삭제
  async deleteOrder(id: string): Promise<{ error: any }> {
    // 하위 데이터(첨부파일, 실적 등) 처리 정책 결정 필요
    const { error } = await this.supabase.from('orders').delete().eq('id', id);
    if (error) {
        console.error(`Error deleting order ${id}:`, error);
    }
    return { error };
  }

  // 파일 관련 함수들은 여기에 추가하거나 별도 file-service.ts로 분리 가능
  // async getFilesByOrderId(orderId: string) { ... }
  // async uploadFile(orderId: string, file: File, fileType: string, userId: string) { ... }
  // async deleteFile(fileId: string) { ... }
} 