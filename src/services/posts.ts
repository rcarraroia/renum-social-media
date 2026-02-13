import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight supabase wrapper using any-cast to avoid strict typing friction.
 */
const sb: any = supabase;

export async function getScheduledPosts(
  organizationId: string,
  startDate: string,
  endDate: string,
) {
  const res: any = await sb
    .from("posts")
    .select(`
      *,
      videos (
        id,
        title,
        video_processed_url,
        thumbnail_url,
        duration_seconds,
        created_at,
        descriptions
      )
    `)
    .eq("organization_id", organizationId)
    .eq("status", "scheduled")
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate)
    .order("scheduled_at", { ascending: true });

  return { data: res?.data ?? null, error: res?.error ?? null };
}

export async function getPostsByDate(organizationId: string, date: string) {
  const startOfDay = `${date}T00:00:00Z`;
  const endOfDay = `${date}T23:59:59Z`;
  return getScheduledPosts(organizationId, startOfDay, endOfDay);
}

export async function createScheduledPost(postData: {
  organization_id: string;
  video_id: string;
  platform: string;
  description: string;
  scheduled_at: string;
  hashtags?: string[];
}) {
  const res: any = await sb
    .from("posts")
    .insert({
      ...postData,
      status: "scheduled",
    })
    .select()
    .single();

  return { data: res?.data ?? null, error: res?.error ?? null };
}

export async function updateScheduledPost(
  postId: string,
  updates: {
    description?: string;
    scheduled_at?: string;
    platform?: string;
  },
) {
  const res: any = await sb
    .from("posts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .select();

  return { data: res?.data ?? null, error: res?.error ?? null };
}

export async function deleteScheduledPost(postId: string) {
  // Soft delete: change status to 'cancelled'
  const res: any = await sb
    .from("posts")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  return { data: res?.data ?? null, error: res?.error ?? null };
}

export async function getAvailableVideos(organizationId: string) {
  const res: any = await sb
    .from("videos")
    .select("id,title,video_processed_url,thumbnail_url,duration_seconds,created_at,descriptions")
    .eq("organization_id", organizationId)
    .eq("status", "ready")
    .order("created_at", { ascending: false });

  return { data: res?.data ?? null, error: res?.error ?? null };
}