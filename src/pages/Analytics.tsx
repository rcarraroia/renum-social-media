import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { api, DashboardMetrics, PostPerformance, PlatformMetrics } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  Users, 
  ThumbsUp, 
  MessageCircle, 
  Share2,
  Bookmark,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [postsData, setPostsData] = useState<PostPerformance[]>([]);
  const [platformsData, setPlatformsData] = useState<PlatformMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('published_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // Modal de detalhes
  const [selectedPost, setSelectedPost] = useState<PostPerformance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openPostDetails = (post: PostPerformance) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closePostDetails = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  useEffect(() => {
    loadData();
  }, [sortBy, sortOrder, selectedPlatform]);

  // Atualização automática quando cache expira (20 minutos)
  useEffect(() => {
    const CACHE_TTL = 20 * 60 * 1000; // 20 minutos em ms
    const interval = setInterval(() => {
      loadData();
    }, CACHE_TTL);

    return () => clearInterval(interval);
  }, [sortBy, sortOrder, selectedPlatform]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados em paralelo
      const [dashboard, posts, platforms] = await Promise.all([
        api.analytics.getDashboard(),
        api.analytics.getPosts({ 
          sort_by: sortBy, 
          order: sortOrder,
          platform: selectedPlatform !== 'all' ? selectedPlatform : undefined
        }),
        api.analytics.getPlatforms(),
      ]);

      setDashboardData(dashboard);
      setPostsData(posts.posts);
      setPlatformsData(platforms.platforms);
      setCurrentPage(1); // Reset para primeira página ao mudar filtros
    } catch (err: any) {
      console.error('Erro ao carregar analytics:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Paginação
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = postsData.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(postsData.length / postsPerPage);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatPercent = (num: number): string => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto space-y-6 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">📊 Analytics</h1>
              <p className="text-sm text-slate-500">Visão geral de desempenho</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto space-y-6 p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto space-y-6 p-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum dado disponível. Conecte suas redes sociais para ver analytics.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Analytics</h1>
            <p className="text-sm text-slate-500">
              Período: {format(new Date(dashboardData.period_start), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(dashboardData.period_end), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select 
              value={selectedPlatform} 
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="rounded border p-2 text-sm"
            >
              <option value="all">Todas as plataformas</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="x">X (Twitter)</option>
              <option value="youtube">YouTube</option>
            </select>

            <button
              onClick={loadData}
              className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Reach */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Alcance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(dashboardData.total_reach)}</div>
              <div className={`text-xs flex items-center gap-1 ${dashboardData.reach_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.reach_change_percent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(dashboardData.reach_change_percent)}
              </div>
            </CardContent>
          </Card>

          {/* Engagement */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(dashboardData.total_engagement)}</div>
              <div className={`text-xs flex items-center gap-1 ${dashboardData.engagement_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.engagement_change_percent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(dashboardData.engagement_change_percent)}
              </div>
            </CardContent>
          </Card>

          {/* Followers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Seguidores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(dashboardData.total_followers)}</div>
              <div className={`text-xs flex items-center gap-1 ${dashboardData.followers_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {dashboardData.followers_change_percent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {formatPercent(dashboardData.followers_change_percent)}
              </div>
            </CardContent>
          </Card>

          {/* Engagement Rate */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Taxa de Engajamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.engagement_rate.toFixed(2)}%</div>
              <div className="text-xs text-slate-500">Média do período</div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Granulares */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ThumbsUp className="h-4 w-4" />
                Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(dashboardData.total_likes)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comentários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(dashboardData.total_comments)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Compartilhamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(dashboardData.total_shares)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Salvamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatNumber(dashboardData.total_saves)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Evolução Temporal */}
        {dashboardData.evolution_data && dashboardData.evolution_data.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução Temporal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dashboardData.evolution_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(new Date(date), 'dd/MM', { locale: ptBR })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })}
                    formatter={(value: number) => formatNumber(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="reach" 
                    stroke="#8884d8" 
                    name="Alcance"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="engagement" 
                    stroke="#82ca9d" 
                    name="Engajamento"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="followers" 
                    stroke="#ffc658" 
                    name="Seguidores"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Breakdown por Plataforma */}
        {platformsData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance por Plataforma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Gráfico de Barras */}
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="platform" 
                      tickFormatter={(platform) => platform.charAt(0).toUpperCase() + platform.slice(1)}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => formatNumber(value)}
                      labelFormatter={(platform) => platform.charAt(0).toUpperCase() + platform.slice(1)}
                    />
                    <Legend />
                    <Bar dataKey="reach" fill="#8884d8" name="Alcance" />
                    <Bar dataKey="engagement" fill="#82ca9d" name="Engajamento" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Lista Detalhada */}
                <div className="space-y-4">
                  {platformsData
                    .sort((a, b) => b.engagement - a.engagement)
                    .map((platform, index) => (
                      <div 
                        key={platform.platform} 
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          index === 0 ? 'bg-green-50 border border-green-200' : 'bg-slate-50'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium capitalize">{platform.platform}</div>
                            {index === 0 && (
                              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
                                Melhor Performance
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">
                            {platform.posts_count} posts • {formatNumber(platform.followers)} seguidores
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatNumber(platform.engagement)}</div>
                          <div className="text-sm text-slate-500">
                            {platform.contribution_percent.toFixed(1)}% do total
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Posts */}
        {postsData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Posts Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">
                        <button 
                          onClick={() => handleSort('platform')}
                          className="flex items-center gap-1 hover:text-indigo-600"
                        >
                          Plataforma
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-left p-2">
                        <button 
                          onClick={() => handleSort('published_at')}
                          className="flex items-center gap-1 hover:text-indigo-600"
                        >
                          Data
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-left p-2">Preview</th>
                      <th className="text-right p-2">
                        <button 
                          onClick={() => handleSort('reach')}
                          className="flex items-center gap-1 hover:text-indigo-600 ml-auto"
                        >
                          Alcance
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-right p-2">
                        <button 
                          onClick={() => handleSort('likes')}
                          className="flex items-center gap-1 hover:text-indigo-600 ml-auto"
                        >
                          Likes
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-right p-2">
                        <button 
                          onClick={() => handleSort('comments')}
                          className="flex items-center gap-1 hover:text-indigo-600 ml-auto"
                        >
                          Comentários
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="text-right p-2">
                        <button 
                          onClick={() => handleSort('engagement_rate')}
                          className="flex items-center gap-1 hover:text-indigo-600 ml-auto"
                        >
                          Taxa Eng.
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPosts.map((post) => (
                      <tr 
                        key={post.post_id} 
                        className="border-b hover:bg-slate-50 cursor-pointer"
                        onClick={() => openPostDetails(post)}
                      >
                        <td className="p-2 capitalize">{post.platform}</td>
                        <td className="p-2 text-sm">
                          {format(new Date(post.published_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="p-2 text-sm max-w-xs truncate">{post.content_preview}</td>
                        <td className="p-2 text-right">{formatNumber(post.reach)}</td>
                        <td className="p-2 text-right">{formatNumber(post.likes)}</td>
                        <td className="p-2 text-right">{formatNumber(post.comments)}</td>
                        <td className="p-2 text-right">{post.engagement_rate.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-slate-500">
                    Mostrando {indexOfFirstPost + 1} - {Math.min(indexOfLastPost, postsData.length)} de {postsData.length} posts
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Posts Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">Nenhum post encontrado para o período selecionado.</p>
                <p className="text-sm text-slate-400 mt-2">
                  Publique posts nas suas redes sociais para ver analytics aqui.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Detalhes do Post */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="capitalize">{selectedPost.platform}</span>
                  <span className="text-sm font-normal text-slate-500">
                    {format(new Date(selectedPost.published_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Detalhes completos do post
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Conteúdo */}
                <div>
                  <h3 className="font-medium mb-2">Conteúdo</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded">
                    {selectedPost.content_preview}
                  </p>
                </div>

                {/* Métricas Principais */}
                <div>
                  <h3 className="font-medium mb-3">Métricas de Performance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-xs text-slate-600 mb-1">Alcance</div>
                      <div className="text-xl font-bold text-blue-700">{formatNumber(selectedPost.reach)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-xs text-slate-600 mb-1">Engajamento</div>
                      <div className="text-xl font-bold text-green-700">{formatNumber(selectedPost.engagement)}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-xs text-slate-600 mb-1">Taxa de Eng.</div>
                      <div className="text-xl font-bold text-purple-700">{selectedPost.engagement_rate.toFixed(2)}%</div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <div className="text-xs text-slate-600 mb-1">Impressões</div>
                      <div className="text-xl font-bold text-orange-700">{formatNumber(selectedPost.impressions)}</div>
                    </div>
                  </div>
                </div>

                {/* Interações Detalhadas */}
                <div>
                  <h3 className="font-medium mb-3">Interações</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4 text-slate-600" />
                        <span className="text-sm">Likes</span>
                      </div>
                      <span className="font-medium">{formatNumber(selectedPost.likes)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-slate-600" />
                        <span className="text-sm">Comentários</span>
                      </div>
                      <span className="font-medium">{formatNumber(selectedPost.comments)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-slate-600" />
                        <span className="text-sm">Compartilhamentos</span>
                      </div>
                      <span className="font-medium">{formatNumber(selectedPost.shares)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                      <div className="flex items-center gap-2">
                        <Bookmark className="h-4 w-4 text-slate-600" />
                        <span className="text-sm">Salvamentos</span>
                      </div>
                      <span className="font-medium">{formatNumber(selectedPost.saves)}</span>
                    </div>
                  </div>
                </div>

                {/* Link para Post Original */}
                {selectedPost.post_url && (
                  <div>
                    <a
                      href={selectedPost.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      Ver post original
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Analytics;
