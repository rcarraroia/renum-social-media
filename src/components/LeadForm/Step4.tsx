import { cn } from '@/lib/utils';
import { useLeadFormStore, PriceType } from '@/stores/leadFormStore';
import { DollarSign, TrendingUp, Sparkles, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

const priceOptions = [
  {
    value: '$29' as PriceType,
    label: '$29/mês',
    description: 'Plano Básico',
    icon: DollarSign,
    commission: '$1.45 - $2.90',
    popular: false,
  },
  {
    value: '$49' as PriceType,
    label: '$49/mês',
    description: 'Plano Profissional',
    icon: TrendingUp,
    commission: '$2.45 - $4.90',
    popular: true,
  },
  {
    value: '$99' as PriceType,
    label: '$99/mês',
    description: 'Plano Premium',
    icon: Sparkles,
    commission: '$4.95 - $9.90',
    popular: false,
  },
];

export function Step4() {
  const { formData, setPriceWithCommission, setCurrentStep } = useLeadFormStore();

  const handleSelect = (price: PriceType) => {
    setPriceWithCommission(price);
  };

  const handleNext = () => {
    if (formData.priceWithCommission) {
      setCurrentStep(5);
    }
  };

  const handleBack = () => {
    setCurrentStep(3);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
          <Gift className="w-4 h-4" />
          Programa de Afiliados
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          E se você ganhasse comissão?
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Se você recebesse de <span className="font-bold text-green-600">5% a 10%</span> de comissão por assinatura feita através da sua indicação, qual seria o valor mais atrativo?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {priceOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = formData.priceWithCommission === option.value;

          return (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                'group relative p-6 rounded-xl border-2 transition-all duration-200',
                'hover:shadow-lg hover:scale-[1.02] cursor-pointer',
                'focus:outline-none focus:ring-4 focus:ring-green-200',
                isSelected
                  ? 'border-green-600 bg-green-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-green-300'
              )}
            >
              <div className="flex flex-col items-center space-y-4">
                <div
                  className={cn(
                    'p-4 rounded-full transition-colors',
                    isSelected
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-600'
                  )}
                >
                  <Icon className="w-8 h-8" />
                </div>

                <div className="text-center">
                  <div
                    className={cn(
                      'text-3xl font-bold mb-1 transition-colors',
                      isSelected ? 'text-green-900' : 'text-gray-900'
                    )}
                  >
                    {option.label}
                  </div>
                  <p
                    className={cn(
                      'text-sm font-medium mb-2 transition-colors',
                      isSelected ? 'text-green-700' : 'text-gray-500'
                    )}
                  >
                    {option.description}
                  </p>
                  <div
                    className={cn(
                      'text-xs font-semibold px-3 py-1 rounded-full transition-colors',
                      isSelected
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    Comissão: {option.commission}
                  </div>
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
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

      {/* Info Box */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-green-900">Como funciona o programa de afiliados?</h3>
            <p className="text-sm text-green-800 leading-relaxed">
              Compartilhe seu link exclusivo com amigos e colegas. A cada assinatura realizada através do seu link, você recebe uma comissão recorrente enquanto a pessoa permanecer assinante!
            </p>
          </div>
        </div>
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
          disabled={!formData.priceWithCommission}
          className="min-w-[120px] bg-green-600 hover:bg-green-700"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
