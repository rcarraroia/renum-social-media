import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                  step < currentStep
                    ? 'bg-blue-600 text-white'
                    : step === currentStep
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {step < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="font-semibold">{step}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-2 font-medium transition-colors',
                  step <= currentStep ? 'text-blue-600' : 'text-gray-400'
                )}
              >
                {step === 1 && 'Atividade'}
                {step === 2 && 'Nome'}
                {step === 3 && 'Valor'}
                {step === 4 && 'Comissão'}
                {step === 5 && 'Contato'}
              </span>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-1 flex-1 mx-2 transition-all duration-300',
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
