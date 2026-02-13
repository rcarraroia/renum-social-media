import { supabase } from "../integrations/supabase/client";
import { format } from "date-fns";

const sb: any = supabase;

/**
 * Fetch published posts in a date range (optionally by platform)
 */
export async function getPublishedPosts(
  organizationId: string,
  startDate: string,
  endDate: string,
  platform?: string,
) {
  if (!organizationId) return { data: null, error: "missing orgId" };

  let query: any = sb
    .from("posts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "published")
    .gte("published_at", startDate)
    .lte("published_at", endDate);

  if (platform && platform !== "all") {
    query = query.eq("platform", platform);
  }

  const res: any = await query.order("published_at", { ascending: false });
  return { data: res?.data ?? null, error: res?.error ?? null };
}

/**
 * Calculate aggregated metrics from posts array
 */
export function calculateMetrics(posts: any[]) {
  const totalViews = (posts || []).reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = (posts || []).reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalComments = (posts || []).reduce((sum, p) => sum + (p.comments || 0), 0);
  const totalShares = (posts || []).reduce((sum, p) => sum + (p.shares || 0), 0);

  const avgEngagement =
    posts && posts.length > 0 ? posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / posts.length : 0;

  return {
    reach: totalViews,
    likes: totalLikes,
    comments: totalComments,
    shares: totalShares,
    posts: posts?.length ?? 0,
    engagement: avgEngagement,
  };
}

/**
 * Build engagement trend grouped by day
 */
export function getEngagementTrend(posts: any[]) {
  const grouped: Record<string, any[]> = {};
  (posts || []).forEach((post) => {
    const day = format(new Date(post.published_at), "dd/MM");
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(post);
  });

  return Object.entries(grouped).map(([date, dayPosts]) => ({
    date,
    engagement: (dayPosts.reduce((s, p) => s + (p.engagement_rate || 0), 0) / dayPosts.length) * 100,
    reach: dayPosts.reduce((s, p) => s + (p.views || 0), 0),
    posts: dayPosts.length,
  }));
}

/**
 * Top posts by engagement rate
 */
export function getTopPosts(posts: any[], limit = 5) {
  return (posts || [])
    .slice()
    .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
    .slice(0, limit);
}

/**
 * Network performance aggregated
 */
export function getNetworkPerformance(posts: any[]) {
  const byNetwork: Record<string, any[]> = {};
  (posts || []).forEach((post) => {
    if (!byNetwork[post.platform]) byNetwork[post.platform] = [];
    byNetwork[post.platform].push(post);
  });

  const result = Object.entries(byNetwork).map(([platform, platformPosts]) => {
    const metrics = calculateMetrics(platformPosts);
    return {
      platform,
      posts: metrics.posts,
      reach: metrics.reach,
      likes: metrics.likes,
      comments: metrics.comments,
      engagement: (metrics.engagement ?? 0) * 100, // make percent
    };
  });

  return result;
}

/**
 * Mocked data helpers (used when no published posts exist)
 */
export const MOCK_METRICS = {
  reach: 125400,
  engagement: 0.082,
  posts: 12,
  followers: 2400,
  likes: 8300,
  comments: 456,
  growth: {
    reach: 0.125,
    engagement: 0.013,
    posts: -0.02,
    followers: 0.058,
    likes: 0.081,
    comments: 0.12,
  },
};

export const MOCK_TREND = [
  { date: "01/02", engagement: 5.2, reach: 12000 },
  { date: "02/02", engagement: 6.1, reach: 15000 },
  { date: "03/02", engagement: 5.8, reach: 13500 },
  { date: "04/02", engagement: 7.3, reach: 18000 },
  { date: "05/02", engagement: 6.9, reach: 16500 },
  { date: "06/02", engagement: 8.1, reach: 21000 },
  { date: "07/02", engagement: 8.2, reach: 22000 },
];

export const MOCK_TOP_POSTS = [
  {
    id: "mock-1",
    rank: 1,
    platform: "instagram",
    publishedAt: "2025-01-15T18:30:00Z",
    thumbnailUrl: "https://via.placeholder.com/240x135.png?text=Thumb+1",
    description: "Você sabia? 80% das brasileiras têm deficiência de vitamina D...",
    metrics: {
      views: 45200,
      likes: 3800,
      comments: 1200,
      shares: 890,
      engagementRate: 0.124,
    },
    postUrl: "https://instagram.com/p/mock1",
  },
  {
    id: "mock-2",
    rank: 2,
    platform: "tiktok",
    publishedAt: "2025-01-12T11:00:00Z",
    thumbnailUrl: "https://via.placeholder.com/240x135.png?text=Thumb+2",
    description: "Gente, esse truque mudou minha pele...",
    metrics: {
      views: 38700,
      likes: 2900,
      comments: 890,
      shares: 320,
      engagementRate: 0.118,
    },
    postUrl: "https://tiktok.com/@mock2",
  },
];

export const MOCK_BEST_TIMES = [
  { day: "Terça-feira", timeRange: "18h - 20h", engagement: 8.9, rank: 1 },
  { day: "Quinta-feira", timeRange: "18h - 20h", engagement: 8.5, rank: 2 },
  { day: "Quarta-feira", timeRange: "11h - 13h", engagement: 7.8, rank: 3 },
];