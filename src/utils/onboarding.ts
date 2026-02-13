import { supabase } from "@/integrations/supabase/client";

/**
 * Checks whether onboarding is completed for the given user id.
 * First it looks at localStorage then checks if organization has metricool_user_token configured.
 */
export async function hasCompletedOnboarding(userId?: string, organizationId?: string) {
  if (!userId) return false;
  const localFlag = localStorage.getItem(`onboarding_completed_${userId}`);
  if (localFlag === "true") return true;

  if (!organizationId) return false;

  // cast response to any to avoid strict typing mismatch from supabase client generics
  const res: any = await supabase
    .from("organizations")
    .select("metricool_user_token")
    .eq("id", organizationId)
    .maybeSingle();

  if (res?.error) {
    // If query fails, consider onboarding incomplete so user sees wizard
    return false;
  }

  const data = res?.data ?? null;
  return Boolean(data?.metricool_user_token);
}

export function markOnboardingComplete(userId: string, preferredModule?: string) {
  localStorage.setItem(`onboarding_completed_${userId}`, "true");
  localStorage.setItem(`onboarding_completed_at`, new Date().toISOString());
  if (preferredModule) {
    localStorage.setItem(`preferred_module_${userId}`, preferredModule);
  }
}

/**
 * Save metricool tokens to organizations table
 */
export async function saveMetricoolTokens(organizationId: string, payload: { userToken: string; userId: string; blogId?: number }) {
  // cast supabase.from to any to avoid narrow typing issues when calling update
  const res: any = await (supabase.from("organizations") as any)
    .update({
      metricool_user_token: payload.userToken,
      metricool_user_id: payload.userId,
      metricool_blog_id: payload.blogId ?? null,
    })
    .eq("id", organizationId)
    .select()
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}