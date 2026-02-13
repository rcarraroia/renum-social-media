import { supabase } from "@/integrations/supabase/client";

/**
 * NOTE:
 * Supabase client generic typing can cause strict errors when the table schemas
 * are not perfectly in sync with the TypeScript types. To keep things concise
 * and avoid compile-time overload errors, we cast the client to `any` for these
 * helper functions and return `any` typed data/error. This is pragmatic for
 * frontend integration code and can be tightened later if desired.
 */
const sb: any = supabase;

/**
 * Create a videos table record (draft)
 */
export async function createVideoRecord(organizationId: string, userId: string): Promise<{ data: any; error: any }> {
  const res: any = await sb
    .from("videos")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      title: "Sem título",
      status: "draft",
      module_type: "upload",
    })
    .select()
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}

/**
 * Upload file to storage and return public URL
 */
export async function uploadVideoToStorage(file: File, organizationId: string, videoId: string): Promise<{ data: string | null; error: any }> {
  const ext = file.name.split(".").pop() ?? "mp4";
  const filePath = `${organizationId}/${videoId}/raw.${ext}`;

  const uploadRes: any = await sb.storage
    .from("videos-raw")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadRes?.error) {
    return { data: null, error: uploadRes.error };
  }

  const urlRes: any = sb.storage.from("videos-raw").getPublicUrl(filePath);
  return { data: urlRes?.data?.publicUrl ?? null, error: null };
}

/**
 * Update video record with arbitrary payload
 */
export async function updateVideoStatus(videoId: string, payload: Partial<any>): Promise<{ data: any; error: any }> {
  const res: any = await sb
    .from("videos")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", videoId)
    .select()
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}

/**
 * Get video by id
 */
export async function getVideoById(videoId: string): Promise<{ data: any; error: any }> {
  const res: any = await sb
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}

/**
 * Save descriptions JSON and mark ready
 */
export async function updateVideoDescriptions(videoId: string, descriptions: Record<string, string>): Promise<{ data: any; error: any }> {
  const res: any = await sb
    .from("videos")
    .update({
      descriptions,
      status: "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", videoId)
    .select()
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}