import { supabase } from "../integrations/supabase/client";

/**
 * Avatar service helpers (use any typing to avoid strict typing friction)
 */
const sb: any = supabase;

export async function updateVideoWithAvatar(videoId: string, avatarId: string, voiceId: string, settings: any) {
  const res: any = await sb
    .from("videos")
    .update({
      status: "processing",
      metadata: {
        ...(settings ?? {}),
        avatar_id: avatarId,
        voice_id: voiceId,
        module: "avatar",
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", videoId)
    .select()
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}

export async function saveGeneratedVideo(videoId: string, videoUrl: string) {
  const res: any = await sb
    .from("videos")
    .update({
      video_processed_url: videoUrl,
      status: "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", videoId)
    .select()
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}

export async function incrementCreditsUsed(organizationId: string) {
  // For now call an RPC if exists; otherwise do a safe update increment
  try {
    // Prefer RPC if present
    const rpcRes: any = await sb.rpc("increment_heygen_credits", { org_id: organizationId });
    return { data: rpcRes?.data ?? null, error: rpcRes?.error ?? null };
  } catch (e) {
    // Fallback: try to update counters directly (best-effort, mock)
    const orgRes: any = await sb.from("organizations").select("heygen_credits_used").eq("id", organizationId).single();
    if (orgRes?.error) return { data: null, error: orgRes.error };
    const used = (orgRes?.data?.heygen_credits_used ?? 0) + 1;
    const upRes: any = await sb.from("organizations").update({ heygen_credits_used: used }).eq("id", organizationId).select().single();
    return { data: upRes?.data ?? null, error: upRes?.error ?? null };
  }
}