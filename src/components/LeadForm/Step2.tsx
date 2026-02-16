import { cn } from '@/lib/utils';
import { useLeadFormStore, AppNameType } from '@/stores/leadFormStore';
import { Sparkles, Zap, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const appNameOptions = [
  {
    value: 'SocialFlow' as AppNameType,
    label: 'SocialFlow',
    description: 'Automação inteligente',
    icon: Zap,
    tagline: 'Fluxo contínuo de conteúdo',
  },
  {
    value: 'SmartGenius' as AppNameType,
    label: 'SmartGenius',
    description: 'Tecnologia avançada',
    icon: Sparkles,
    tagline: 'Inteligência artificial',
  },
  {
    value: 'inFluency' as AppNameType,
    label: 'inFluency',
    description: 'Resultados garantidos',
    icon: TrendingUp,
    tagline: 'Impulsione suas vendas',
  },
];

export function Step2() {
  const { formData, setAppName, setCurrentStep } = useLeadFormStore();

  const handleSelect = (appName: AppNameType) => {
    setAppName(appName);
  };

  const handleNext = () => {
    if (formData.appName) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Ajude-nos a escolher o nome!
        </h2>
        <p className="text-gray-600">
          Qual nome você acha mais atrativo para o app?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {appNameOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = formData.appName === option.value;

          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'group relative p-6 rounded-xl border-2 transition-all duration-200',
                'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
                'focus:outline-none focus:ring-4 focus:ring-blue-200',
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              )}
            >
              <div className="flex flex-col items-center space-y-4">
                <div
                  className={cn(
                    'p-4 rounded-full transition-colors',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                  )}
                >
                  <Icon className="w-8 h-8" />
                </div>

                <div className="text-center">
                  <div
                    className={cn(
                      'text-2xl font-bold mb-1 transition-colors',
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    )}
                  >
                    {option.label}
                  </div>
                  <p
                    className={cn(
                      'text-sm font-medium mb-2 transition-colors',
                      isSelected ? 'text-blue-700' : 'text-gray-500'
                    )}
                  >
                    {option.description}
                  </p>
                  <p
                    className={cn(
                      'text-xs transition-colors',
                      isSelected ? 'text-blue-600' : 'text-gray-400'
                    )}
                  >
                    {option.tagline}
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

      <div className="flex justify-center gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="min-w-[120px]"
        >
          Voltar
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={!formData.appName}
          className="min-w-[120px] bg-blue-600 hover:bg-blue-700"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
