import React from "react";
import MainLayout from "../components/layout/MainLayout";
import { useCalendar } from "../hooks/useCalendar";
import CalendarGrid from "../components/calendar/CalendarGrid";
import PostCard from "../components/calendar/PostCard";
import PlatformBadge from "../components/calendar/PlatformBadge";
import { format } from "date-fns";
import { getAvailableVideos, createScheduledPost, deleteScheduledPost, updateScheduledPost } from "../services/posts";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";

const ALL_PLATFORMS = ["linkedin", "x", "instagram", "tiktok", "facebook", "youtube"];

const CalendarPage: React.FC = () => {
  const {
    posts,
    postsByDay,
    loading,
    currentMonth,
    selectedPlatforms,
    setSelectedPlatforms,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    refreshPosts,
  } = useCalendar();

  const [showNewModal, setShowNewModal] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState<any | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [availableVideos, setAvailableVideos] = React.useState<any[]>([]);
  const [selectedVideoId, setSelectedVideoId] = React.useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = React.useState<string>("");
  const [platforms, setPlatforms] = React.useState<string[]>(["instagram"]);
  const [descriptions, setDescriptions] = React.useState<any>({ instagram: "", tiktok: "", facebook: "" });

  const [connectedPlatforms, setConnectedPlatforms] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    async function loadVideos() {
      const orgId = (window as any).__DYAD__USER_ORG_ID__ ?? undefined;
      const { data } = await getAvailableVideos((orgId as string) ?? "");
      setAvailableVideos(data ?? []);
    }
    loadVideos();

    // load connected platforms
    (async () => {
      try {
        const res = await fetch("/api/integrations/social-accounts");
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, boolean> = {};
          (data ?? []).forEach((d: any) => {
            map[d.platform] = !!d.connected;
          });
          // ensure all platforms keys exist
          ALL_PLATFORMS.forEach((p) => {
            if (map[p] === undefined) map[p] = false;
          });
          setConnectedPlatforms(map);
        } else {
          const map: Record<string, boolean> = {};
          ALL_PLATFORMS.forEach((p) => (map[p] = false));
          setConnectedPlatforms(map);
        }
      } catch {
        const map: Record<string, boolean> = {};
        ALL_PLATFORMS.forEach((p) => (map[p] = false));
        setConnectedPlatforms(map);
      }
    })();
  }, []);

  const onDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowNewModal(true);
    const iso = new Date(date);
    iso.setHours(18, 0, 0, 0);
    setScheduledAt(iso.toISOString());
  };

  const onPostClick = (post: any) => {
    setShowDetails(post);
  };

  const handleCreate = async () => {
    if (!selectedVideoId) {
      showError("Selecione um vídeo");
      return;
    }
    if (!scheduledAt || platforms.length === 0) {
      showError("Data/hora ou plataformas inválidas");
      return;
    }

    const toastId = showLoading("Agendando post...");
    try {
      for (const p of platforms) {
        await createScheduledPost({
          organization_id: (window as any).__DYAD__USER_ORG_ID__ ?? "",
          video_id: selectedVideoId,
          platform: p,
          description: descriptions[p] ?? "",
          scheduled_at: scheduledAt,
        });
      }
      dismissToast(toastId);
      showSuccess("✅ Post agendado com sucesso!");
      setShowNewModal(false);
      refreshPosts();
    } catch (err: any) {
      dismissToast(toastId);
      console.error("Erro ao agendar", err);
      showError("Erro ao agendar post");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;
    const toastId = showLoading("Excluindo post...");
    try {
      await deleteScheduledPost(postId);
      dismissToast(toastId);
      showSuccess("✅ Post excluído com sucesso");
      setShowDetails(null);
      refreshPosts();
    } catch (err: any) {
      dismissToast(toastId);
      showError("Erro ao excluir post");
    }
  };

  function togglePlatformLocal(p: string) {
    setPlatforms((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      return [...prev, p];
    });
  }

  function platformFilterToggle(p: string) {
    setSelectedPlatforms((prev: string[]) => {
      if (prev.includes("all")) {
        if (p === "all") return ["all"];
        return [p];
      }
      if (p === "all") return ["all"];
      if (prev.includes(p)) {
        const next = prev.filter((x) => x !== p);
        if (next.length === 0) return ["all"];
        return next;
      }
      return [...prev, p];
    });
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📅 Calendário de Publicações</h1>
            <p className="text-sm text-slate-500">Visualize e gerencie seus posts agendados</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => goToPreviousMonth()} className="px-3 py-1 rounded bg-gray-100">◄</button>
            <button onClick={() => goToToday()} className="px-3 py-1 rounded bg-gray-100">Hoje</button>
            <button onClick={() => goToNextMonth()} className="px-3 py-1 rounded bg-gray-100">►</button>
            <button onClick={() => setShowNewModal(true)} className="px-4 py-2 rounded bg-indigo-600 text-white">+ Novo Post</button>
          </div>
        </div>

        {/* Filters: dynamic based on connected platforms */}
        <div className="flex items-center gap-2 overflow-auto pb-2">
          <button
            onClick={() => platformFilterToggle("all")}
            className={`px-3 py-1 rounded ${selectedPlatforms.includes("all") ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
          >
            Todas
          </button>

          {ALL_PLATFORMS.map((p) => {
            const connected = connectedPlatforms[p] ?? false;
            return (
              <button
                key={p}
                onClick={() => connected && platformFilterToggle(p)}
                title={connected ? p : "Conecte esta rede em Configurações"}
                disabled={!connected}
                className={`px-3 py-1 rounded flex items-center gap-2 text-sm ${selectedPlatforms.includes(p) ? "bg-indigo-600 text-white" : connected ? "bg-white border" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              >
                <PlatformBadge platform={p} size="sm" />
                <span className="capitalize">{p === "x" ? "X" : p}</span>
              </button>
            );
          })}
        </div>

        <div>
          <div className="mb-4 text-sm text-slate-600">{format(currentMonth, "MMMM yyyy")}</div>

          <div className="bg-slate-50 p-4 rounded">
            <CalendarGrid month={currentMonth} postsByDay={postsByDay} onDateClick={onDateClick} onPostClick={onPostClick} />
          </div>
        </div>

        <div className="text-sm text-slate-500">Posts agendados este mês: {posts.length}</div>

        {/* New Post Modal */}
        {showNewModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowNewModal(false)} />
            <div className="relative z-50 w-full max-w-2xl bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">📅 Agendar Novo Post</h2>
                <button onClick={() => setShowNewModal(false)} className="text-slate-400">Fechar</button>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium">1. Selecionar Vídeo</h3>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-auto">
                    {(availableVideos.length === 0) && <div className="text-sm text-slate-500">Nenhum vídeo pronto. Crie um no módulo Upload.</div>}
                    {availableVideos.map((v: any) => (
                      <label key={v.id} className={`p-2 border rounded flex items-center gap-2 ${selectedVideoId === v.id ? "bg-indigo-50 border-indigo-200" : "bg-white"}`}>
                        <input type="radio" name="video" value={v.id} checked={selectedVideoId === v.id} onChange={() => {
                          setSelectedVideoId(v.id);
                          setDescriptions({
                            instagram: v.descriptions?.instagram ?? "",
                            tiktok: v.descriptions?.tiktok ?? "",
                            facebook: v.descriptions?.facebook ?? "",
                          });
                        }} />
                        <div>
                          <div className="font-medium">{v.title}</div>
                          <div className="text-xs text-slate-500">Criado: {format(new Date(v.created_at), "dd/MM/yyyy")}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">2. Configurar Agendamento</h3>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-500">Data e hora</label>
                      <input type="datetime-local" value={scheduledAt ? scheduledAt.slice(0, 16) : ""} onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return setScheduledAt("");
                        const iso = new Date(v);
                        setScheduledAt(iso.toISOString());
                      }} className="w-full rounded border p-2" />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500">Plataformas</label>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {ALL_PLATFORMS.map((p) => {
                          const connected = connectedPlatforms[p] ?? false;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => togglePlatformLocal(p)}
                              disabled={!connected}
                              className={`px-2 py-1 rounded ${platforms.includes(p) ? "bg-indigo-600 text-white" : connected ? "bg-gray-100" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                            >
                              {p === "x" ? "X" : p}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500">Sugestão IA</label>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-sm text-slate-600">Terça 18h-20h</div>
                        <button onClick={() => {
                          const d = selectedDate ?? new Date();
                          d.setHours(18, 0, 0, 0);
                          setScheduledAt(new Date(d).toISOString());
                        }} className="px-3 py-1 rounded bg-gray-100">Usar</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium">3. Descrições</h3>
                  <div className="mt-2">
                    <label className="text-xs">Instagram</label>
                    <textarea className="w-full rounded border p-2" rows={3} value={descriptions.instagram} onChange={(e) => setDescriptions((s: any) => ({ ...(s ?? {}), instagram: e.target.value }))} />
                    <div className="text-xs text-slate-400">{(descriptions.instagram ?? "").length}/2200</div>

                    <label className="text-xs mt-2">TikTok</label>
                    <textarea className="w-full rounded border p-2" rows={2} value={descriptions.tiktok} onChange={(e) => setDescriptions((s: any) => ({ ...(s ?? {}), tiktok: e.target.value }))} />
                    <div className="text-xs text-slate-400">{(descriptions.tiktok ?? "").length}/2200</div>

                    <label className="text-xs mt-2">Facebook</label>
                    <textarea className="w-full rounded border p-2" rows={3} value={descriptions.facebook} onChange={(e) => setDescriptions((s: any) => ({ ...(s ?? {}), facebook: e.target.value }))} />
                    <div className="text-xs text-slate-400">{(descriptions.facebook ?? "").length}/5000</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowNewModal(false)} className="px-3 py-1 rounded bg-gray-100">Cancelar</button>
                  <button onClick={handleCreate} className="px-4 py-2 rounded bg-indigo-600 text-white">📅 Agendar Post</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details modal */}
        {showDetails && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowDetails(null)} />
            <div className="relative z-50 w-full max-w-3xl bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{showDetails.videos?.title ?? "Post"}</h2>
                  <div className="text-sm text-slate-500">Agendado: {format(new Date(showDetails.scheduled_at), "PPPP p")}</div>
                </div>
                <div className="flex items-center gap-2">
                  {Array.isArray(showDetails.platform) ? showDetails.platform.map((p: string) => <PlatformBadge key={p} platform={p} />) : <PlatformBadge platform={showDetails.platform} />}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {showDetails.videos?.video_processed_url ? (
                    <video src={showDetails.videos.video_processed_url} controls className="w-full rounded" />
                  ) : (
                    <div className="h-40 bg-slate-100 rounded flex items-center justify-center">No preview</div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium">Descrição</h4>
                  <div className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{showDetails.description}</div>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => {
                      const newDesc = prompt("Editar descrição", showDetails.description);
                      if (!newDesc) return;
                      (async () => {
                        const { data, error } = await updateScheduledPost(showDetails.id, { description: newDesc });
                        if (error) return showError("Erro ao atualizar");
                        showSuccess("Post atualizado");
                        setShowDetails(null);
                        refreshPosts();
                      })();
                    }} className="px-3 py-1 rounded bg-gray-100">✏️ Editar</button>

                    <button onClick={() => handleDelete(showDetails.id)} className="px-3 py-1 rounded bg-red-100 text-red-700">🗑️ Excluir</button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowDetails(null)} className="px-3 py-1 rounded bg-gray-100">Fechar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CalendarPage;