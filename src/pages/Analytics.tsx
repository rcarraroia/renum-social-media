import React from "react";
import MainLayout from "../components/layout/MainLayout";
import MetricCard from "../components/analytics/MetricCard";
import EngagementChart from "../components/analytics/EngagementChart";
import BestTimes from "../components/analytics/BestTimes";
import TopPosts from "../components/analytics/TopPosts";
import NetworkPerformance from "../components/analytics/NetworkPerformance";
import { useAnalytics } from "../hooks/useAnalytics";
import { Eye, Heart, BarChart, Users, ThumbsUp, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { showLoading, dismissToast, showSuccess, showError } from "../utils/toast";

const AnalyticsPage: React.FC = () => {
  const {
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
    refresh,
  } = useAnalytics();

  const exportToPDF = async () => {
    const toastId = showLoading("Exportando relatório...");
    try {
      // Dynamically import the heavy libraries only when needed (client-side)
      const { jsPDF } = await import("jspdf");
      const html2canvasModule = await import("html2canvas");
      const html2canvas = (html2canvasModule as any).default ?? html2canvasModule;

      const el = document.getElementById("analytics-container");
      if (!el) throw new Error("Elemento não encontrado");
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfWidth = 210;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const filename = `RENUM_Analytics_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      pdf.save(filename);
      dismissToast(toastId);
      showSuccess("✅ Relatório exportado!");
    } catch (err: any) {
      dismissToast(toastId);
      console.error(err);
      showError("Erro ao exportar relatório");
    }
  };

  return (
    <MainLayout>
      <div id="analytics-container" className="max-w-7xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Analytics</h1>
            <p className="text-sm text-slate-500">Visão geral de desempenho</p>
          </div>

          <div className="flex items-center gap-3">
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded border p-2 text-sm">
              <option value="all">Todas as redes</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
            </select>

            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded border p-2 text-sm">
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
            </select>

            <button onClick={() => refresh()} className="px-3 py-2 rounded bg-gray-100">Atualizar</button>
            <button onClick={exportToPDF} className="px-4 py-2 rounded bg-indigo-600 text-white">📥 Exportar PDF</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard icon={<Eye />} label="Reach" value={metrics?.reach ?? "--"} growth={metrics?.growth?.reach ?? 0} format="compact" loading={loading} />
          <MetricCard icon={<Heart />} label="Engagement" value={Math.round((metrics?.engagement ?? 0) * 1000) / 10} growth={metrics?.growth?.engagement ?? 0} format="percentage" loading={loading} />
          <MetricCard icon={<BarChart />} label="Posts" value={metrics?.posts ?? "--"} growth={metrics?.growth?.posts ?? 0} loading={loading} />
          <MetricCard icon={<Users />} label="Followers" value={metrics?.followers ?? "--"} growth={metrics?.growth?.followers ?? 0} format="compact" loading={loading} />
          <MetricCard icon={<ThumbsUp />} label="Likes" value={metrics?.likes ?? "--"} growth={metrics?.growth?.likes ?? 0} format="compact" loading={loading} />
          <MetricCard icon={<MessageCircle />} label="Comments" value={metrics?.comments ?? "--"} growth={metrics?.growth?.comments ?? 0} loading={loading} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <EngagementChart data={trend} height={320} loading={loading} />
          </div>

          <div className="space-y-4">
            <BestTimes items={bestTimes} loading={loading} />
            <NetworkPerformance data={networkPerformance} loading={loading} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TopPosts posts={topPosts} loading={loading} />
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-slate-600 mb-2">Relatório Rápido</div>
            <div className="text-sm">Reach: {metrics?.reach ?? "--"}</div>
            <div className="text-sm">Engagement: {Math.round((metrics?.engagement ?? 0) * 1000) / 10}%</div>
            <div className="text-sm">Posts: {metrics?.posts ?? "--"}</div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AnalyticsPage;