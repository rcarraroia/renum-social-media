import React, { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { listVideos, deleteVideo } from "../services/videos";
import { useAuth } from "@/hooks/useAuth";
import { showSuccess, showError, showLoading, dismissToast } from "../utils/toast";
import { useNavigate } from "react-router-dom";

interface Video {
  id: string;
  title: string;
  video_raw_url: string;
  status: string;
  module_type: string;
  created_at: string;
  duration_seconds?: number;
  metadata?: {
    aspectRatio?: string;
    selectedPlatforms?: string[];
    recordingMethod?: string;
  };
}

const MyVideosPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "ready" | "draft">("all");

  const loadVideos = async () => {
    if (!user?.organization_id) return;

    setLoading(true);
    const filters = filter === "all" ? {} : { status: filter };
    const { data, error } = await listVideos(user.organization_id, filters);

    if (error) {
      showError("Erro ao carregar vídeos");
      console.error(error);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVideos();
  }, [user?.organization_id, filter]);

  const handleDelete = async (videoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;
    if (!user?.organization_id) return;

    const toastId = showLoading("Excluindo vídeo...");
    const { error } = await deleteVideo(videoId, user.organization_id);

    dismissToast(toastId);

    if (error) {
      showError("Erro ao excluir vídeo");
      console.error(error);
    } else {
      showSuccess("Vídeo excluído com sucesso!");
      loadVideos();
    }
  };

  const handleDownload = (video: Video) => {
    if (!video.video_raw_url) {
      showError("URL do vídeo não disponível");
      return;
    }

    const a = document.createElement("a");
    a.href = video.video_raw_url;
    a.download = `${video.title || "video"}-${Date.now()}.webm`;
    a.click();
    showSuccess("Download iniciado!");
  };

  const handleSendToPostRapido = (video: Video) => {
    navigate("/module-2", {
      state: {
        fromTeleprompter: true,
        videoId: video.id,
        videoUrl: video.video_raw_url,
        aspectRatio: video.metadata?.aspectRatio || "9:16",
        selectedPlatforms: video.metadata?.selectedPlatforms || [],
      },
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎬 Meus Vídeos</h1>
            <p className="text-sm text-slate-500">
              Gerencie todos os vídeos gravados pelo teleprompter
            </p>
          </div>
          <button
            onClick={() => navigate("/module-1")}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            + Gravar Novo Vídeo
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Todos ({videos.length})
            </button>
            <button
              onClick={() => setFilter("ready")}
              className={`px-4 py-2 rounded ${
                filter === "ready"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Prontos
            </button>
            <button
              onClick={() => setFilter("draft")}
              className={`px-4 py-2 rounded ${
                filter === "draft"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Rascunhos
            </button>
          </div>
        </div>

        {/* Videos Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-500">Carregando vídeos...</div>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold mb-2">Nenhum vídeo encontrado</h3>
            <p className="text-slate-500 mb-6">
              Comece gravando seu primeiro vídeo com o teleprompter!
            </p>
            <button
              onClick={() => navigate("/module-1")}
              className="px-6 py-3 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Gravar Primeiro Vídeo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Video Preview */}
                <div
                  className="relative bg-black"
                  style={{
                    aspectRatio: video.metadata?.aspectRatio?.replace(":", "/") || "16/9",
                  }}
                >
                  {video.video_raw_url ? (
                    <video
                      src={video.video_raw_url}
                      className="w-full h-full object-cover"
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="text-4xl mb-2">📹</div>
                        <div className="text-sm">Vídeo não disponível</div>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        video.status === "ready"
                          ? "bg-emerald-600 text-white"
                          : "bg-yellow-600 text-white"
                      }`}
                    >
                      {video.status === "ready" ? "✓ Pronto" : "📝 Rascunho"}
                    </span>
                  </div>

                  {/* Recording Method Badge */}
                  {video.metadata?.recordingMethod && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-black/70 text-white">
                        {video.metadata.recordingMethod === "teleprompter"
                          ? "🔤 Teleprompter"
                          : "📹 Upload"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg truncate">{video.title}</h3>
                    <p className="text-xs text-slate-500">
                      Criado em {formatDate(video.created_at)}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex gap-2 flex-wrap text-xs">
                    {video.metadata?.aspectRatio && (
                      <span className="px-2 py-1 bg-slate-100 rounded">
                        📐 {video.metadata.aspectRatio}
                      </span>
                    )}
                    {video.duration_seconds && (
                      <span className="px-2 py-1 bg-slate-100 rounded">
                        ⏱️ {formatDuration(video.duration_seconds)}
                      </span>
                    )}
                  </div>

                  {/* Platforms */}
                  {video.metadata?.selectedPlatforms &&
                    video.metadata.selectedPlatforms.length > 0 && (
                      <div className="text-xs text-slate-600">
                        <strong>Plataformas:</strong>{" "}
                        {video.metadata.selectedPlatforms.join(", ")}
                      </div>
                    )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <button
                      onClick={() => handleDownload(video)}
                      className="flex-1 px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm flex items-center justify-center gap-1"
                      title="Baixar para galeria do celular"
                    >
                      💾 Baixar
                    </button>
                    {video.status === "ready" && (
                      <button
                        onClick={() => handleSendToPostRapido(video)}
                        className="flex-1 px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex items-center justify-center gap-1"
                      >
                        📤 Publicar
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="px-3 py-2 rounded bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                      title="Excluir vídeo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MyVideosPage;
