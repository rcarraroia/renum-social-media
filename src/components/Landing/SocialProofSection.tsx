import { useEffect, useState } from 'react';
import { Users, TrendingUp, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileStats {
  activity: string;
  count: number;
}

interface AppNameStats {
  app_name: string;
  count: number;
  percentage: number;
}

export function SocialProofSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [profileStats, setProfileStats] = useState<ProfileStats[]>([]);
  const [appNameStats, setAppNameStats] = useState<AppNameStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar total de leads
      const { count: total } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Buscar estatísticas por perfil
      const { data: profiles } = await supabase
        .from('leads')
        .select('activity');

      // Buscar estatísticas por nome do app
      const { data: appNames } = await supabase
        .from('leads')
        .select('app_name');

      if (profiles && appNames && total !== null) {
        // Contar por perfil
        const profileCounts = profiles.reduce((acc, lead) => {
          acc[lead.activity] = (acc[lead.activity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const profileStatsArray = Object.entries(profileCounts)
          .map(([activity, count]) => ({ activity, count }))
          .sort((a, b) => b.count - a.count);

        // Contar por nome do app
        const appNameCounts = appNames.reduce((acc, lead) => {
          acc[lead.app_name] = (acc[lead.app_name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const appNameStatsArray = Object.entries(appNameCounts)
          .map(([app_name, count]) => ({
            app_name,
            count,
            percentage: Math.round((count / total) * 100),
          }))
          .sort((a, b) => b.count - a.count);

        // Verificar critério: mínimo de 10 inscritos em pelo menos 3 perfis diferentes
        const profilesWithMinimum = profileStatsArray.filter(p => p.count >= 10);
        const shouldShow = profilesWithMinimum.length >= 3;

        setTotalLeads(total);
        setProfileStats(profileStatsArray);
        setAppNameStats(appNameStatsArray);
        setIsVisible(shouldShow);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mapear nomes de atividades para português
  const activityNames: Record<string, string> = {
    consultora: 'Consultoras',
    politico: 'Políticos',
    profissional_liberal: 'Profissionais Liberais',
    educador: 'Educadores',
    fitness: 'Fitness',
    criador: 'Criadores de Conteúdo',
    empreendedor: 'Empreendedores',
    estudante: 'Estudantes',
    geral: 'Outros Profissionais',
  };

  // Se não atingiu critérios ou está carregando, não renderiza nada
  if (loading || !isVisible) {
    return null;
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              Social Proof
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              Junte-se a {totalLeads} Profissionais Esperando o Lançamento
            </h2>
            <p className="text-xl text-gray-600">
              Veja quem mais está na lista de espera
            </p>
          </div>

          {/* Avatares Animados */}
          <div className="flex justify-center mb-12">
            <div className="flex -space-x-3">
              {Array.from({ length: Math.min(12, totalLeads) }).map((_, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-4 border-white flex items-center justify-center text-white text-sm font-bold shadow-lg animate-in fade-in zoom-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {String.fromCharCode(65 + (i % 26))}
                </div>
              ))}
            </div>
          </div>

          {/* Grid de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Perfis que já se inscreveram */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Perfis que já se inscreveram
                </h3>
              </div>

              <div className="space-y-3">
                {profileStats.slice(0, 5).map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">
                      {activityNames[stat.activity] || stat.activity}
                    </span>
                    <span className="font-bold text-blue-600">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nomes mais votados */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Nomes mais votados
                </h3>
              </div>

              <div className="space-y-4">
                {appNameStats.map((stat, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{stat.app_name}</span>
                      <span className="text-sm font-bold text-blue-600">
                        {stat.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-lg text-gray-600">
              Não fique de fora! Garanta seu{' '}
              <span className="font-bold text-blue-600">desconto de 30%</span> agora
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
