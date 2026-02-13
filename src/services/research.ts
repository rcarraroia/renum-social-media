import { supabase } from "../integrations/supabase/client";

/**
 * Research service helpers
 * Use `any` for supabase responses to avoid strict typing friction at this stage.
 */
const sb: any = supabase;

export async function createResearchVideo(
  organizationId: string,
  userId: string,
  title: string,
  audience: string
): Promise<{ data: any; error: any }> {
  const res: any = await sb
    .from("videos")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      title,
      module_type: "research",
      status: "processing",
      metadata: {
        audience,
        created_via: "module_1",
      },
    })
    .select()
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}

export async function saveGeneratedScript(
  videoId: string,
  script: string,
  sources: any[]
): Promise<{ data: any; error: any }> {
  const res: any = await sb
    .from("videos")
    .update({
      script,
      status: "draft",
      metadata: {
        sources: sources ?? null,
        generated_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", videoId)
    .select()
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}

export async function getDraftResearchVideos(organizationId: string): Promise<{ data: any; error: any }> {
  const res: any = await sb
    .from("videos")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("module_type", "research")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  return { data: res?.data ?? null, error: res?.error ?? null };
}