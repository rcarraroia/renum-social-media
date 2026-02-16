import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLeadFormStore } from '@/stores/leadFormStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const contactSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  whatsapp: z
    .string()
    .regex(
      /^\+?[1-9]\d{1,14}$/,
      'WhatsApp inválido. Use formato internacional: +5511999999999'
    ),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface Step5Props {
  onSubmit: (data: ContactFormData) => Promise<void>;
}

export function Step5({ onSubmit }: Step5Props) {
  const { formData, setContactInfo, setCurrentStep, formState } = useLeadFormStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: formData.name,
      email: formData.email,
      whatsapp: formData.whatsapp,
    },
  });

  const handleFormSubmit = async (data: ContactFormData) => {
    setContactInfo(data.name, data.email, data.whatsapp);
    await onSubmit(data);
  };

  const handleBack = () => {
    setCurrentStep(4);
  };

  const isSubmitting = formState === 'submitting';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Quase lá! Deixe seus dados
        </h2>
        <p className="text-gray-600">
          Garanta <span className="font-bold text-blue-600">30% de desconto</span> no
          primeiro mês
        </p>
      </div>

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="max-w-md mx-auto space-y-5"
      >
        {/* Nome Completo */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Nome completo *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome completo"
            {...register('name')}
            className={cn(
              'h-12 text-base',
              errors.name && 'border-red-500 focus-visible:ring-red-500'
            )}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            {...register('email')}
            className={cn(
              'h-12 text-base',
              errors.email && 'border-red-500 focus-visible:ring-red-500'
            )}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* WhatsApp */}
        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-sm font-medium text-gray-700">
            WhatsApp *
          </Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="+5511999999999"
            {...register('whatsapp')}
            className={cn(
              'h-12 text-base',
              errors.whatsapp && 'border-red-500 focus-visible:ring-red-500'
            )}
            disabled={isSubmitting}
          />
          {errors.whatsapp && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.whatsapp.message}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Formato internacional: +55 11 99999-9999
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-900 leading-relaxed">
            🔒 Seus dados estão seguros. Não compartilhamos suas informações com
            terceiros e você pode cancelar a qualquer momento.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex-1 h-12"
          >
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Concluir Inscrição'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
