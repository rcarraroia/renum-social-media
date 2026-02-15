import * as React from "react";
import { startOfMonth, endOfMonth, format, addMonths, subMonths } from "date-fns";
import { getScheduledPosts } from "../services/posts";
import { useAuthStore } from "../stores/authStore";
import { api } from "@/lib/api";

export type Post = any;

export function useCalendar() {
  const user = useAuthStore((s) => s.user);
  const orgId = user?.organization_id ?? "";

  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<string[]>(["all"]);
  const [view, setView] = React.useState<"day" | "week" | "month">("month");

  const loadPosts = React.useCallback(async () => {
    if (!orgId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const startIso = start.toISOString();
      const endIso = end.toISOString();

      // Usar API client para carregar posts
      const response = await api.calendar.listPosts({
        start_date: startIso,
        end_date: endIso,
        status: "scheduled", // Apenas posts agendados
      });
      
      setPosts(response.posts ?? []);
    } catch (err) {
      console.error("Erro ao carregar posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [orgId, currentMonth]);

  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const filteredPosts = React.useMemo(() => {
    if (selectedPlatforms.includes("all")) return posts;
    return posts.filter((p) => selectedPlatforms.includes(p.platform));
  }, [posts, selectedPlatforms]);

  const postsByDay = React.useMemo(() => {
    const grouped: Record<string, Post[]> = {};
    (filteredPosts || []).forEach((post) => {
      const day = format(new Date(post.scheduled_at), "yyyy-MM-dd");
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(post);
    });
    return grouped;
  }, [filteredPosts]);

  const goToPreviousMonth = React.useCallback(() => {
    setCurrentMonth((m) => subMonths(m, 1));
  }, []);

  const goToNextMonth = React.useCallback(() => {
    setCurrentMonth((m) => addMonths(m, 1));
  }, []);

  const goToToday = React.useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  return {
    posts: filteredPosts,
    postsByDay,
    loading,
    currentMonth,
    view,
    setView,
    selectedPlatforms,
    setSelectedPlatforms,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    refreshPosts: loadPosts,
  };
}