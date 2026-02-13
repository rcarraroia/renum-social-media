import * as React from "react";
import { subDays, format } from "date-fns";
import { getPublishedPosts, calculateMetrics, getEngagementTrend, getTopPosts, getNetworkPerformance, MOCK_METRICS, MOCK_TREND, MOCK_TOP_POSTS, MOCK_BEST_TIMES } from "../services/analytics";
import { useAuthStore } from "../stores/authStore";

export function useAnalytics() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organization_id ?? "";

  const [metrics, setMetrics] = React.useState<any>(null);
  const [trend, setTrend] = React.useState<any[]>([]);
  const [topPosts, setTopPosts] = React.useState<any[]>([]);
  const [networkPerformance, setNetworkPerformance] = React.useState<any[]>([]);
  const [bestTimes, setBestTimes] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const [platform, setPlatform] = React.useState<string>("all");
  const [period, setPeriod] = React.useState<string>("7d"); // 7d | 30d | 90d

  const loadAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = subDays(endDate, days);
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      const { data: posts, error } = await getPublishedPosts(orgId, startIso, endIso, platform);

      if (!posts || posts.length === 0) {
        // use mocks for development
        setMetrics(MOCK_METRICS);
        setTrend(MOCK_TREND);
        setTopPosts(MOCK_TOP_POSTS);
        setNetworkPerformance([]);
        setBestTimes(MOCK_BEST_TIMES);
        setLoading(false);
        return;
      }

      setMetrics(calculateMetrics(posts));
      setTrend(getEngagementTrend(posts));
      setTopPosts(getTopPosts(posts, 5));
      setNetworkPerformance(getNetworkPerformance(posts));
      setBestTimes(MOCK_BEST_TIMES);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("analytics load error", err);
      setMetrics(MOCK_METRICS);
      setTrend(MOCK_TREND);
      setTopPosts(MOCK_TOP_POSTS);
      setNetworkPerformance([]);
      setBestTimes(MOCK_BEST_TIMES);
    } finally {
      setLoading(false);
    }
  }, [orgId, platform, period]);

  React.useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    metrics,
    trend,
    topPosts,
    networkPerformance,
    bestTimes,
    loading,
    platform,
    setPlatform,
    period,
    setPeriod,
    refresh: loadAnalytics,
  };
}