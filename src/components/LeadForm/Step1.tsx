import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLeadFormStore, ActivityType } from '@/stores/leadFormStore';
import { 
  Briefcase, 
  Users, 
  Video, 
  Stethoscope,
  GraduationCap,
  Dumbbell,
  Lightbulb,
  BookOpen,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const allActivities = [
  {
    value: 'consultora' as ActivityType,
    label: 'Consultora de vendas diretas',
    description: 'Natura, Avon, Mary Kay',
    icon: Briefcase,
  },
  {
    value: 'politico' as ActivityType,
    label: 'Profissional político',
    description: 'Campanhas e comunicação',
    icon: Users,
  },
  {
    value: 'criador' as ActivityType,
    label: 'Criador de Conteúdo',
    description: 'YouTubers, Influencers',
    icon: Video,
  },
  {
    value: 'profissional_liberal' as ActivityType,
    label: 'Profissional Liberal',
    description: 'Advogados, Médicos, Dentistas',
    icon: Stethoscope,
  },
  {
    value: 'educador' as ActivityType,
    label: 'Educador',
    description: 'Professores, Tutores, Instrutores',
    icon: GraduationCap,
  },
  {
    value: 'fitness' as ActivityType,
    label: 'Fitness & Bem-estar',
    description: 'Personal Trainer, Nutricionista, Coach',
    icon: Dumbbell,
  },
  {
    value: 'empreendedor' as ActivityType,
    label: 'Empreendedor',
    description: 'Donos de negócio, Startups, Gestores',
    icon: Lightbulb,
  },
  {
    value: 'estudante' as ActivityType,
    label: 'Estudante',
    description: 'Universitários, Graduandos, Pesquisadores',
    icon: BookOpen,
  },
  {
    value: 'geral' as ActivityType,
    label: 'Geral',
    description: 'Público geral, Entusiastas',
    icon: Globe,
  },
];

export function Step1() {
  const { formData, setActivity, setCurrentStep } = useLeadFormStore();
  const [showAll, setShowAll] = useState(false);

  const visibleActivities = showAll ? allActivities : allActivities.slice(0, 3);

  const handleSelect = (activity: ActivityType) => {
    setActivity(activity);
    // Auto-advance to next step after selection
    setTimeout(() => {
      setCurrentStep(2);
    }, 300);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Qual sua atividade profissional?
        </h2>
        <p className="text-gray-600">
          Selecione a opção que melhor descreve você
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {visibleActivities.map((activity) => {
          const Icon = activity.icon;
          const isSelected = formData.activity === activity.value;

          return (
            <button
              key={activity.value}
              onClick={() => handleSelect(activity.value)}
              className={cn(
                'group relative p-6 rounded-xl border-2 transition-all duration-200',
                'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
                'focus:outline-none focus:ring-4 focus:ring-blue-200',
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              )}
            >
              <div className="flex flex-col items-center space-y-3 text-center">
                <div
                  className={cn(
                    'p-3 rounded-lg transition-colors',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    className={cn(
                      'font-semibold text-base mb-1 transition-colors',
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    )}
                  >
                    {activity.label}
                  </h3>
                  <p
                    className={cn(
                      'text-sm transition-colors',
                      isSelected ? 'text-blue-700' : 'text-gray-500'
                    )}
                  >
                    {activity.description}
                  </p>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Ver Mais Button */}
      {!showAll && (
        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAll(true)}
            className="min-w-[200px]"
          >
            Ver mais opções ({allActivities.length - 3})
          </Button>
        </div>
      )}
    </div>
  );
}
