import { supabase } from "@/integrations/supabase/client";
import type { UsersRow, OrganizationsRow } from "@/types/database.types";
import type { AuthenticatedUser } from "@/types/auth";

/**
 * Signup helper
 */
export async function signUp(email: string, password: string, fullName: string) {
  // supabase-js typing may vary across versions; cast to any to satisfy TS while keeping runtime behavior
  const res = await (supabase.auth as any).signUp(
    { email, password },
    {
      data: { full_name: fullName },
    },
  );
  return res;
}

/**
 * Sign in helper
 */
export async function signIn(email: string, password: string) {
  const res = await supabase.auth.signInWithPassword({ email, password });
  return res;
}

/**
 * Sign out helper
 */
export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * getCurrentUser
 *
 * Returns the authenticated user along with the nested organization object (if present).
 * This enables the frontend to check user.organization.plan without extra queries.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  // Get auth user
  const { data: userData } = await supabase.auth.getUser();
  const authUser = userData?.user;
  if (!authUser) return null;

  /**
   * We select the user row and include the related organization using a foreign-table select.
   * The select string uses an alias 'organization' so the returned object will have:
   *  {
   *    ...user fields...,
   *    organization: { ...organization fields... }
   *  }
   *
   * This relies on the users.organization_id foreign key referencing public.organizations.id
   */
  // Use any-cast to avoid strict supabase client generic mismatch
  const res: any = await (supabase as any)
    .from("users")
    .select(`
      *,
      organization:organizations(*)
    `)
    .eq("id", authUser.id)
    .single();

  const profile = res?.data ?? null;
  const error = res?.error;

  // If the users row is missing it's acceptable; return basic auth info
  if (error) {
    // If the error is PGRST116 (no rows) we can return a minimal user object
    // Otherwise rethrow
    if ((error as any).code !== "PGRST116") {
      throw error;
    }
  }

  // Build the combined object
  const organization: OrganizationsRow | null = profile?.organization ?? null;

  const result: AuthenticatedUser = {
    id: authUser.id,
    email: authUser.email ?? "",
    full_name: profile?.full_name ?? (authUser.user_metadata?.full_name ?? null),
    role: profile?.role ?? (authUser.user_metadata?.role ?? undefined),
    organization_id: profile?.organization_id ?? null,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          plan: organization.plan ?? "free",
          metricool_user_token: organization.metricool_user_token ?? null,
          metricool_user_id: organization.metricool_user_id ?? null,
          metricool_blog_id: organization.metricool_blog_id ?? null,
          heygen_api_key: organization.heygen_api_key ?? null,
          onboarding_completed: organization.onboarding_completed ?? null,
          created_at: organization.created_at ?? null,
          updated_at: organization.updated_at ?? null,
        }
      : null,
    created_at: profile?.created_at ?? null,
    last_login: profile?.last_login ?? null,
  };

  return result;
}

/**
 * Update last login helper
 */
export async function updateLastLogin(userId: string) {
  if (!userId) return null;
  const payload: Partial<UsersRow> = { last_login: new Date().toISOString() };

  const res = await (supabase.from("users") as any)
    .update(payload)
    .eq("id", userId)
    .select()
    .single();

  const data = res?.data;
  const error = res?.error;

  if (error) throw error;
  return data;
}