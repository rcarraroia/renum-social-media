import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { startOfMonth, subMonths } from "date-fns";

export type DashboardStats = {
  videosCount: number;
  videosGrowth: number; // percent vs previous month
  postsScheduled: number;
  nextPost: { date: string; platform: string } | null;
  plan: "free" | "starter" | "pro";
  videosQuota: { used: number; total: number };
};

export type RecentActivity = {
  id: string;
  type: "video_created" | "post_scheduled" | "post_published";
  title: string;
  timestamp: string;
  metadata?: any;
};

const PLAN_QUOTAS: Record<string, number> = {
  free: 3,
  starter: 10,
  pro: 30,
};

export function useDashboard() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organization_id;

  const fetchDashboard = async (): Promise<{ stats: DashboardStats | null; activities: RecentActivity[] }> => {
    if (!orgId) {
      return { stats: null, activities: [] };
    }

    const now = new Date();
    const startThisMonth = startOfMonth(now);
    const startPrevMonth = startOfMonth(subMonths(now, 1));

    // Videos this month
    const videosRes: any = await supabase
      .from("videos")
      .select("id", { count: "exact" })
      .gte("created_at", startThisMonth.toISOString())
      .eq("organization_id", orgId);

    if (videosRes.error) throw videosRes.error;

    const videosCount = videosRes.count ?? (videosRes.data?.length ?? 0);

    // Videos previous month
    const prevRes: any = await supabase
      .from("videos")
      .select("id", { count: "exact" })
      .gte("created_at", startPrevMonth.toISOString())
      .lt("created_at", startThisMonth.toISOString())
      .eq("organization_id", orgId);

    if (prevRes.error) throw prevRes.error;
    const prevCount = prevRes.count ?? (prevRes.data?.length ?? 0);

    const videosGrowth = prevCount > 0 ? Math.round(((videosCount - prevCount) / prevCount) * 100) : (videosCount > 0 ? 100 : 0);

    // Posts scheduled
    const postsRes: any = await supabase
      .from("posts")
      .select("id", { count: "exact" })
      .eq("organization_id", orgId)
      .eq("status", "scheduled");

    if (postsRes.error) throw postsRes.error;
    const postsScheduled = postsRes.count ?? (postsRes.data?.length ?? 0);

    // Next scheduled post
    const nextPostRes: any = await supabase
      .from("posts")
      .select("scheduled_at,platform")
      .eq("organization_id", orgId)
      .eq("status", "scheduled")
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextPostRes.error) throw nextPostRes.error;
    const nextPost = nextPostRes?.data
      ? {
          date: nextPostRes.data.scheduled_at,
          platform: nextPostRes.data.platform,
        }
      : null;

    // Organization (plan + quotas)
    const orgRes: any = await supabase.from("organizations").select("plan").eq("id", orgId).single();
    if (orgRes.error) throw orgRes.error;
    const plan = (orgRes.data?.plan as "free" | "starter" | "pro") ?? "free";
    const totalQuota = PLAN_QUOTAS[plan] ?? 3;

    const stats: DashboardStats = {
      videosCount,
      videosGrowth,
      postsScheduled,
      nextPost,
      plan,
      videosQuota: { used: videosCount, total: totalQuota },
    };

    // Recent activities: join videos + posts (fetch recent videos and their posts)
    const activitiesRes: any = await supabase
      .from("videos")
      .select("id,title,created_at,posts(id,platform,scheduled_at,status)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (activitiesRes.error) throw activitiesRes.error;

    const activities: RecentActivity[] = [];

    (activitiesRes.data ?? []).forEach((v: any) => {
      activities.push({
        id: v.id,
        type: "video_created",
        title: v.title,
        timestamp: v.created_at,
        metadata: { videoId: v.id },
      });

      if (Array.isArray(v.posts)) {
        v.posts.forEach((p: any) => {
          if (p.status === "scheduled") {
            activities.push({
              id: `${v.id}-${p.id}`,
              type: "post_scheduled",
              title: v.title,
              timestamp: p.scheduled_at,
              metadata: { platform: p.platform, postId: p.id, videoId: v.id },
            });
          } else if (p.status === "published") {
            activities.push({
              id: `${v.id}-${p.id}-pub`,
              type: "post_published",
              title: v.title,
              timestamp: p.scheduled_at,
              metadata: { platform: p.platform, postId: p.id },
            });
          }
        });
      }
    });

    // Sort activities by timestamp desc and limit 5
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { stats, activities: activities.slice(0, 5) };
  };

  // Provide explicit generics: TQueryFnData, TError, TData
  const query = useQuery<{ stats: DashboardStats | null; activities: RecentActivity[] }, unknown, { stats: DashboardStats | null; activities: RecentActivity[] }>({
    queryKey: ["dashboard", orgId],
    queryFn: fetchDashboard,
    enabled: !!orgId,
    staleTime: 30000,
    refetchInterval: 30000,
  });

  return {
    stats: query.data?.stats ?? null,
    activities: query.data?.activities ?? [],
    loading: query.isLoading,
    error: query.error,
    refresh: () => query.refetch(),
  };
}