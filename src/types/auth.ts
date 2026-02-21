/* Types for frontend auth objects returned from services/auth.getCurrentUser */

export type Plan = "free" | "starter" | "pro";

export interface Organization {
  id: string;
  name: string;
  plan: Plan;
  metricool_user_token?: string | null;
  metricool_user_id?: string | null;
  metricool_blog_id?: number | null;
  heygen_api_key?: string | null;
  onboarding_completed?: boolean | null;
  professional_profiles?: string[] | null; // array of profile ids
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name?: string | null;
  role?: "owner" | "admin" | "member";
  organization_id?: string | null;
  organization?: Organization | null;
  created_at?: string | null;
  last_login?: string | null;
}