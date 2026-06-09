export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_techs: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      budget_plan_item_monthly: {
        Row: {
          id: string
          item_id: string
          plan_amount: number
          year_month: string
        }
        Insert: {
          id?: string
          item_id: string
          plan_amount?: number
          year_month: string
        }
        Update: {
          id?: string
          item_id?: string
          plan_amount?: number
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_plan_item_monthly_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "budget_plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_plan_item_projects: {
        Row: {
          item_id: string
          project_id: string
        }
        Insert: {
          item_id: string
          project_id: string
        }
        Update: {
          item_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_plan_item_projects_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "budget_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_plan_item_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_plan_items: {
        Row: {
          created_at: string
          fiscal_year: number
          headquarter_id: string | null
          id: string
          investment_type: Database["public"]["Enums"]["investment_type"] | null
          mprs: Database["public"]["Enums"]["mprs_category"] | null
          name: string
          plan_amount: number
          sort: number
        }
        Insert: {
          created_at?: string
          fiscal_year: number
          headquarter_id?: string | null
          id?: string
          investment_type?:
            | Database["public"]["Enums"]["investment_type"]
            | null
          mprs?: Database["public"]["Enums"]["mprs_category"] | null
          name: string
          plan_amount?: number
          sort?: number
        }
        Update: {
          created_at?: string
          fiscal_year?: number
          headquarter_id?: string | null
          id?: string
          investment_type?:
            | Database["public"]["Enums"]["investment_type"]
            | null
          mprs?: Database["public"]["Enums"]["mprs_category"] | null
          name?: string
          plan_amount?: number
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_plan_items_headquarter_id_fkey"
            columns: ["headquarter_id"]
            isOneToOne: false
            referencedRelation: "headquarters"
            referencedColumns: ["id"]
          },
        ]
      }
      confluence_classification_rules: {
        Row: {
          assigned_role: Database["public"]["Enums"]["confluence_page_role"]
          created_at: string
          created_by: string | null
          department_id: string | null
          id: string
          pattern: string
          priority: number
          project_id: string | null
          target_field: Database["public"]["Enums"]["rule_target_field"]
        }
        Insert: {
          assigned_role: Database["public"]["Enums"]["confluence_page_role"]
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          pattern: string
          priority?: number
          project_id?: string | null
          target_field: Database["public"]["Enums"]["rule_target_field"]
        }
        Update: {
          assigned_role?: Database["public"]["Enums"]["confluence_page_role"]
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          id?: string
          pattern?: string
          priority?: number
          project_id?: string | null
          target_field?: Database["public"]["Enums"]["rule_target_field"]
        }
        Relationships: [
          {
            foreignKeyName: "confluence_classification_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confluence_classification_rules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confluence_classification_rules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          headquarter_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          headquarter_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          headquarter_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_headquarter_id_fkey"
            columns: ["headquarter_id"]
            isOneToOne: false
            referencedRelation: "headquarters"
            referencedColumns: ["id"]
          },
        ]
      }
      headquarters: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          created_at: string
          department_id: string | null
          email: string | null
          id: string
          name: string
          position: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          id?: string
          name: string
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string | null
          id?: string
          name?: string
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "people_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ai_techs: {
        Row: {
          ai_tech_id: string
          project_id: string
        }
        Insert: {
          ai_tech_id: string
          project_id: string
        }
        Update: {
          ai_tech_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_ai_techs_ai_tech_id_fkey"
            columns: ["ai_tech_id"]
            isOneToOne: false
            referencedRelation: "ai_techs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ai_techs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budget_monthly: {
        Row: {
          amount: number
          id: string
          project_id: string
          year_month: string
        }
        Insert: {
          amount?: number
          id?: string
          project_id: string
          year_month: string
        }
        Update: {
          amount?: number
          id?: string
          project_id?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budget_monthly_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_confluence_pages: {
        Row: {
          classification_confidence: number | null
          classification_method: Database["public"]["Enums"]["classification_method"]
          confluence_page_id: string
          created_at: string
          id: string
          is_active: boolean
          last_classified_at: string | null
          last_modified_at: string | null
          last_synced_at: string | null
          last_version: number | null
          needs_human_review: boolean
          page_role: Database["public"]["Enums"]["confluence_page_role"]
          parent_page_id: string | null
          project_id: string
          title: string | null
        }
        Insert: {
          classification_confidence?: number | null
          classification_method?: Database["public"]["Enums"]["classification_method"]
          confluence_page_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_classified_at?: string | null
          last_modified_at?: string | null
          last_synced_at?: string | null
          last_version?: number | null
          needs_human_review?: boolean
          page_role?: Database["public"]["Enums"]["confluence_page_role"]
          parent_page_id?: string | null
          project_id: string
          title?: string | null
        }
        Update: {
          classification_confidence?: number | null
          classification_method?: Database["public"]["Enums"]["classification_method"]
          confluence_page_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_classified_at?: string | null
          last_modified_at?: string | null
          last_synced_at?: string | null
          last_version?: number | null
          needs_human_review?: boolean
          page_role?: Database["public"]["Enums"]["confluence_page_role"]
          parent_page_id?: string | null
          project_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_confluence_pages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_effect_metrics: {
        Row: {
          effect_id: string
          id: string
          kind: string
          label: string
          sort: number
          value: string
        }
        Insert: {
          effect_id: string
          id?: string
          kind: string
          label: string
          sort?: number
          value: string
        }
        Update: {
          effect_id?: string
          id?: string
          kind?: string
          label?: string
          sort?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_effect_metrics_effect_id_fkey"
            columns: ["effect_id"]
            isOneToOne: false
            referencedRelation: "project_effects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_effects: {
        Row: {
          applied_ym: string | null
          created_at: string
          id: string
          is_pilot: boolean
          note: string | null
          project_id: string
          save_cost_won: number
          save_hours_month: number
        }
        Insert: {
          applied_ym?: string | null
          created_at?: string
          id?: string
          is_pilot?: boolean
          note?: string | null
          project_id: string
          save_cost_won?: number
          save_hours_month?: number
        }
        Update: {
          applied_ym?: string | null
          created_at?: string
          id?: string
          is_pilot?: boolean
          note?: string | null
          project_id?: string
          save_cost_won?: number
          save_hours_month?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_effects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_pms: {
        Row: {
          person_id: string
          project_id: string
        }
        Insert: {
          person_id: string
          project_id: string
        }
        Update: {
          person_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_pms_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_pms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stakeholders: {
        Row: {
          created_at: string
          department_id: string
          id: string
          person_id: string | null
          project_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          person_id?: string | null
          project_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          person_id?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stakeholders_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stakeholders_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          project_id: string
          source: Database["public"]["Enums"]["update_source"]
          source_page_id: string | null
          source_url: string | null
          update_date: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          project_id: string
          source?: Database["public"]["Enums"]["update_source"]
          source_page_id?: string | null
          source_url?: string | null
          update_date?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          source?: Database["public"]["Enums"]["update_source"]
          source_page_id?: string | null
          source_url?: string | null
          update_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_source_page_id_fkey"
            columns: ["source_page_id"]
            isOneToOne: false
            referencedRelation: "project_confluence_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          headquarter_id: string
          health: Database["public"]["Enums"]["project_health"]
          id: string
          investment_type: Database["public"]["Enums"]["investment_type"]
          is_archived: boolean
          last_synced_at: string | null
          lifecycle: Database["public"]["Enums"]["project_lifecycle"]
          mprs: Database["public"]["Enums"]["mprs_category"]
          name: string
          progress_pct: number
          start_date: string | null
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          headquarter_id: string
          health?: Database["public"]["Enums"]["project_health"]
          id?: string
          investment_type: Database["public"]["Enums"]["investment_type"]
          is_archived?: boolean
          last_synced_at?: string | null
          lifecycle?: Database["public"]["Enums"]["project_lifecycle"]
          mprs: Database["public"]["Enums"]["mprs_category"]
          name: string
          progress_pct?: number
          start_date?: string | null
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          headquarter_id?: string
          health?: Database["public"]["Enums"]["project_health"]
          id?: string
          investment_type?: Database["public"]["Enums"]["investment_type"]
          is_archived?: boolean
          last_synced_at?: string | null
          lifecycle?: Database["public"]["Enums"]["project_lifecycle"]
          mprs?: Database["public"]["Enums"]["mprs_category"]
          name?: string
          progress_pct?: number
          start_date?: string | null
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_headquarter_id_fkey"
            columns: ["headquarter_id"]
            isOneToOne: false
            referencedRelation: "headquarters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      classification_method: "manual" | "rule" | "llm" | "unclassified"
      confluence_page_role:
        | "root"
        | "weekly_report"
        | "issue"
        | "meeting_note"
        | "other"
      investment_type: "ai" | "dt" | "it" | "security" | "infra"
      mprs_category: "marketing" | "production" | "research" | "support"
      project_health: "green" | "yellow" | "red"
      project_lifecycle:
        | "not_started"
        | "under_review"
        | "in_progress"
        | "completed"
      rule_target_field: "title" | "parent_title" | "space_key"
      update_source: "manual" | "atlassian_sync"
      user_role: "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      classification_method: ["manual", "rule", "llm", "unclassified"],
      confluence_page_role: [
        "root",
        "weekly_report",
        "issue",
        "meeting_note",
        "other",
      ],
      investment_type: ["ai", "dt", "it", "security", "infra"],
      mprs_category: ["marketing", "production", "research", "support"],
      project_health: ["green", "yellow", "red"],
      project_lifecycle: [
        "not_started",
        "under_review",
        "in_progress",
        "completed",
      ],
      rule_target_field: ["title", "parent_title", "space_key"],
      update_source: ["manual", "atlassian_sync"],
      user_role: ["user"],
    },
  },
} as const
