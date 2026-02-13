/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface OrganizationsRow {
  id: string;
  name: string;
  plan: "free" | "starter" | "pro";
  metricool_user_token?: string | null;
  metricool_user_id?: string | null;
  metricool_blog_id?: number | null;
  heygen_api_key?: string | null;
  opusclip_api_key?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UsersRow {
  id: string;
  organization_id: string;
  email: string;
  full_name?: string | null;
  role: "owner" | "admin" | "member";
  created_at?: string | null;
  last_login?: string | null;
}

export interface VideosRow {
  id: string;
  organization_id: string;
  user_id: string;
  title: string;
  script?: string | null;
  video_raw_url?: string | null;
  video_processed_url?: string | null;
  thumbnail_url?: string | null;
  status: "draft" | "processing" | "ready" | "posted" | "failed";
  module_type?: "research" | "upload" | "avatar" | null;
  duration_seconds?: number | null;
  size_mb?: string | null;
  captions?: Json | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PostsRow {
  id: string;
  organization_id: string;
  video_id: string;
  platform: "instagram" | "tiktok" | "facebook" | "youtube";
  description: string;
  scheduled_at: string;
  metricool_post_id?: string | null;
  status: "scheduled" | "publishing" | "published" | "failed";
  error_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ApiLogsRow {
  id: string;
  organization_id?: string | null;
  service: string;
  endpoint: string;
  method: string;
  request_body?: Json | null;
  response_body?: Json | null;
  status_code?: number | null;
  duration_ms?: number | null;
  created_at?: string | null;
}

/**
 * Minimal Database type that the Supabase client expects.
 * This mirrors the public schema tables used in the app.
 */
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: OrganizationsRow;
        Insert: Partial<
          Omit<
            OrganizationsRow,
            "id" | "created_at" | "updated_at" | "plan"
          >
        > & { name: string; plan?: OrganizationsRow["plan"] };
        Update: Partial<OrganizationsRow>;
      };
      users: {
        Row: UsersRow;
        Insert: Partial<
          Omit<UsersRow, "created_at" | "last_login">
        > & { id: string; organization_id: string; email: string };
        Update: Partial<UsersRow>;
      };
      videos: {
        Row: VideosRow;
        Insert: Partial<
          Omit<VideosRow, "id" | "created_at" | "updated_at">
        > & { organization_id: string; user_id: string; title: string };
        Update: Partial<VideosRow>;
      };
      posts: {
        Row: PostsRow;
        Insert: Partial<
          Omit<PostsRow, "id" | "created_at" | "updated_at">
        > & { organization_id: string; video_id: string; platform: PostsRow["platform"]; description: string; scheduled_at: string };
        Update: Partial<PostsRow>;
      };
      api_logs: {
        Row: ApiLogsRow;
        Insert: Partial<
          Omit<ApiLogsRow, "id" | "created_at">
        > & { service: string; endpoint: string; method: string };
        Update: Partial<ApiLogsRow>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export type { OrganizationsRow as Organization, UsersRow as UserRow, VideosRow as VideoRow, PostsRow as PostRow, ApiLogsRow as ApiLogRow };