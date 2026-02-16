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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          endpoint: string
          id: string
          method: string
          module: string | null
          organization_id: string | null
          request_body: Json | null
          response_body: Json | null
          service: string
          status_code: number | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint: string
          id?: string
          method: string
          module?: string | null
          organization_id?: string | null
          request_body?: Json | null
          response_body?: Json | null
          service: string
          status_code?: number | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          endpoint?: string
          id?: string
          method?: string
          module?: string | null
          organization_id?: string | null
          request_body?: Json | null
          response_body?: Json | null
          service?: string
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          activity: string
          app_name: string
          created_at: string | null
          email: string
          id: string
          name: string
          price: string
          price_with_commission: string
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          activity: string
          app_name: string
          created_at?: string | null
          email: string
          id?: string
          name: string
          price: string
          price_with_commission: string
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          activity?: string
          app_name?: string
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          price?: string
          price_with_commission?: string
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          connected_platforms: Json | null
          created_at: string | null
          heygen_api_key: string | null
          heygen_avatar_id: string | null
          heygen_credits_total: number | null
          heygen_credits_used: number | null
          heygen_voice_id: string | null
          id: string
          metricool_blog_id: number | null
          name: string
          plan: string | null
          updated_at: string | null
        }
        Insert: {
          connected_platforms?: Json | null
          created_at?: string | null
          heygen_api_key?: string | null
          heygen_avatar_id?: string | null
          heygen_credits_total?: number | null
          heygen_credits_used?: number | null
          heygen_voice_id?: string | null
          id?: string
          metricool_blog_id?: number | null
          name: string
          plan?: string | null
          updated_at?: string | null
        }
        Update: {
          connected_platforms?: Json | null
          created_at?: string | null
          heygen_api_key?: string | null
          heygen_avatar_id?: string | null
          heygen_credits_total?: number | null
          heygen_credits_used?: number | null
          heygen_voice_id?: string | null
          id?: string
          metricool_blog_id?: number | null
          name?: string
          plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments: number | null
          created_at: string | null
          description: string
          engagement_rate: number | null
          error_message: string | null
          hashtags: string[] | null
          id: string
          likes: number | null
          metricool_post_id: string | null
          organization_id: string
          platform: string
          published_at: string | null
          scheduled_at: string
          shares: number | null
          status: string | null
          updated_at: string | null
          video_id: string
          views: number | null
        }
        Insert: {
          comments?: number | null
          created_at?: string | null
          description: string
          engagement_rate?: number | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          metricool_post_id?: string | null
          organization_id: string
          platform: string
          published_at?: string | null
          scheduled_at: string
          shares?: number | null
          status?: string | null
          updated_at?: string | null
          video_id: string
          views?: number | null
        }
        Update: {
          comments?: number | null
          created_at?: string | null
          description?: string
          engagement_rate?: number | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          likes?: number | null
          metricool_post_id?: string | null
          organization_id?: string
          platform?: string
          published_at?: string | null
          scheduled_at?: string
          shares?: number | null
          status?: string | null
          updated_at?: string | null
          video_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          organization_id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          last_login?: string | null
          organization_id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          organization_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          audience: string | null
          captions: Json | null
          created_at: string | null
          duration_seconds: number | null
          heygen_error_message: string | null
          heygen_job_status: string | null
          heygen_video_id: string | null
          id: string
          metadata: Json | null
          module_type: string | null
          organization_id: string
          recording_source: string | null
          script: string | null
          size_mb: number | null
          status: string | null
          subtitle_style: Json | null
          thumbnail_url: string | null
          title: string
          transcription: string | null
          updated_at: string | null
          user_id: string
          video_processed_url: string | null
          video_raw_url: string | null
        }
        Insert: {
          audience?: string | null
          captions?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          heygen_error_message?: string | null
          heygen_job_status?: string | null
          heygen_video_id?: string | null
          id?: string
          metadata?: Json | null
          module_type?: string | null
          organization_id: string
          recording_source?: string | null
          script?: string | null
          size_mb?: number | null
          status?: string | null
          subtitle_style?: Json | null
          thumbnail_url?: string | null
          title: string
          transcription?: string | null
          updated_at?: string | null
          user_id: string
          video_processed_url?: string | null
          video_raw_url?: string | null
        }
        Update: {
          audience?: string | null
          captions?: Json | null
          created_at?: string | null
          duration_seconds?: number | null
          heygen_error_message?: string | null
          heygen_job_status?: string | null
          heygen_video_id?: string | null
          id?: string
          metadata?: Json | null
          module_type?: string | null
          organization_id?: string
          recording_source?: string | null
          script?: string | null
          size_mb?: number | null
          status?: string | null
          subtitle_style?: Json | null
          thumbnail_url?: string | null
          title?: string
          transcription?: string | null
          updated_at?: string | null
          user_id?: string
          video_processed_url?: string | null
          video_raw_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
