export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_date: string
          amount: number
          client_type: string | null
          created_at: string
          id: string
          manager: string | null
          order_id: string
          project_name: string
          quantity: number
          remarks: string | null
          status: string | null
          transport_type: string | null
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          achievement_date: string
          amount: number
          client_type?: string | null
          created_at?: string
          id?: string
          manager?: string | null
          order_id: string
          project_name: string
          quantity: number
          remarks?: string | null
          status?: string | null
          transport_type?: string | null
          unit: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          achievement_date?: string
          amount?: number
          client_type?: string | null
          created_at?: string
          id?: string
          manager?: string | null
          order_id?: string
          project_name?: string
          quantity?: number
          remarks?: string | null
          status?: string | null
          transport_type?: string | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_file_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_files: {
        Row: {
          file_name: string
          file_path: string | null
          file_size: number
          file_type: string | null
          file_url: string
          id: string
          order_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path?: string | null
          file_size: number
          file_type?: string | null
          file_url: string
          id?: string
          order_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string | null
          file_size?: number
          file_type?: string | null
          file_url?: string
          id?: string
          order_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_file_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          attachments: Json | null
          client_type: string
          company_name: string
          contamination_info: string
          contract_amount: number
          contract_date: string
          created_at: string
          id: string
          order_number: string
          order_type: string | null
          primary_manager: string
          progress_percentage: number | null
          project_id: string | null
          project_name: string
          remediation_method: string
          secondary_manager: string | null
          status: string | null
          transport_type: string
          updated_at: string
          verification_company: string | null
        }
        Insert: {
          attachments?: Json | null
          client_type: string
          company_name: string
          contamination_info: string
          contract_amount: number
          contract_date: string
          created_at?: string
          id?: string
          order_number: string
          order_type?: string | null
          primary_manager: string
          progress_percentage?: number | null
          project_id?: string | null
          project_name: string
          remediation_method: string
          secondary_manager?: string | null
          status?: string | null
          transport_type: string
          updated_at?: string
          verification_company?: string | null
        }
        Update: {
          attachments?: Json | null
          client_type?: string
          company_name?: string
          contamination_info?: string
          contract_amount?: number
          contract_date?: string
          created_at?: string
          id?: string
          order_number?: string
          order_type?: string | null
          primary_manager?: string
          progress_percentage?: number | null
          project_id?: string | null
          project_name?: string
          remediation_method?: string
          secondary_manager?: string | null
          status?: string | null
          transport_type?: string
          updated_at?: string
          verification_company?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      overdue_history: {
        Row: {
          action_date: string
          action_description: string
          action_type: string
          created_at: string
          created_by: string
          id: string
          memo: string | null
          next_action_date: string | null
          receivable_id: string
          result: string
        }
        Insert: {
          action_date: string
          action_description: string
          action_type: string
          created_at?: string
          created_by: string
          id?: string
          memo?: string | null
          next_action_date?: string | null
          receivable_id: string
          result: string
        }
        Update: {
          action_date?: string
          action_description?: string
          action_type?: string
          created_at?: string
          created_by?: string
          id?: string
          memo?: string | null
          next_action_date?: string | null
          receivable_id?: string
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "overdue_history_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          account_number: string | null
          bank_name: string | null
          created_at: string
          created_by: string
          depositor_name: string | null
          id: string
          memo: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          payment_number: string
          receivable_id: string
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          created_by: string
          depositor_name?: string | null
          id?: string
          memo?: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          payment_number: string
          receivable_id: string
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          created_by?: string
          depositor_name?: string | null
          id?: string
          memo?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          payment_number?: string
          receivable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_receivable_id_fkey"
            columns: ["receivable_id"]
            isOneToOne: false
            referencedRelation: "receivables"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_company_name: string | null
          created_at: string
          end_date: string | null
          id: string
          project_name: string
          start_date: string | null
          status: string
          total_contract_amount: number | null
          updated_at: string
        }
        Insert: {
          client_company_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          project_name: string
          start_date?: string | null
          status?: string
          total_contract_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_company_name?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          project_name?: string
          start_date?: string | null
          status?: string
          total_contract_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      receivables: {
        Row: {
          client_type: string
          company_name: string
          contract_amount: number
          created_at: string
          due_date: string
          id: string
          order_id: string
          order_number: string
          overdue_days: number | null
          overdue_level: string | null
          paid_amount: number | null
          payment_due_days: number
          payment_status: string | null
          payment_terms: string | null
          primary_manager: string
          project_name: string
          receivable_number: string
          remaining_amount: number
          secondary_manager: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_type: string
          company_name: string
          contract_amount: number
          created_at?: string
          due_date: string
          id?: string
          order_id: string
          order_number: string
          overdue_days?: number | null
          overdue_level?: string | null
          paid_amount?: number | null
          payment_due_days: number
          payment_status?: string | null
          payment_terms?: string | null
          primary_manager: string
          project_name: string
          receivable_number: string
          remaining_amount: number
          secondary_manager?: string | null
          tax_amount: number
          total_amount: number
          updated_at?: string
        }
        Update: {
          client_type?: string
          company_name?: string
          contract_amount?: number
          created_at?: string
          due_date?: string
          id?: string
          order_id?: string
          order_number?: string
          overdue_days?: number | null
          overdue_level?: string | null
          paid_amount?: number | null
          payment_due_days?: number
          payment_status?: string | null
          payment_terms?: string | null
          primary_manager?: string
          project_name?: string
          receivable_number?: string
          remaining_amount?: number
          secondary_manager?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivables_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_file_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivables_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          created_by: string | null
          department: string | null
          email: string
          employee_id: string
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          position: string | null
          role: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email: string
          employee_id: string
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string
          employee_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          position?: string | null
          role?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      order_file_stats: {
        Row: {
          certificate_files: number | null
          company_name: string | null
          contract_files: number | null
          drawing_files: number | null
          file_count: number | null
          id: string | null
          last_upload_date: string | null
          order_number: string | null
          other_files: number | null
          project_name: string | null
          report_files: number | null
          total_file_size: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_file_type_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          file_type: string
          file_count: number
          total_size: number
          avg_size: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
