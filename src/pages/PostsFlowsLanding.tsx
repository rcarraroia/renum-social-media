import { useEffect } from 'react';
import { useLeadFormStore } from '@/stores/leadFormStore';
import { ProgressBar } from '@/components/LeadForm/ProgressBar';
import { Step1 } from '@/components/LeadForm/Step1';
import { Step2 } from '@/components/LeadForm/Step2';
import { Step3 } from '@/components/LeadForm/Step3';
import { Step4 } from '@/components/LeadForm/Step4';
import { Step5 } from '@/components/LeadForm/Step5';
import { ProblemSection } from '@/components/Landing/ProblemSection';
import { SolutionSection } from '@/components/Landing/SolutionSection';
import { SocialNetworksSection } from '@/components/Landing/SocialNetworksSection';
import { BenefitsSection } from '@/components/Landing/BenefitsSection';
import { DifferentialsSection } from '@/components/Landing/DifferentialsSection';
import { SocialProofSection } from '@/components/Landing/SocialProofSection';
import { GuaranteeSection } from '@/components/Landing/GuaranteeSection';
import { FAQSection } from '@/components/Landing/FAQSection';
import { supabase } from '@/integrations/supabase/client';
import { CountdownSection } from '@/components/Landing/CountdownSection';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function PostsFlowsLanding() {
  const isMobile = useIsMobile();
  const { currentStep, formState, formData, setFormState, resetForm } =
    useLeadFormStore();

  const handleSubmit = async (contactData: {
    name: string;
    email: string;
    whatsapp: string;
  }) => {
    setFormState('submitting');

    try {
      const payload = {
        activity: formData.activity,
        app_name: formData.appName,
        price: formData.price,
        price_with_commission: formData.priceWithCommission,
        name: contactData.name,
        email: contactData.email,
        whatsapp: contactData.whatsapp,
      };

      // Salvar direto no Supabase (temporário até backend estar pronto)
      const { data, error } = await supabase
        .from('leads')
        .insert([payload])
        .select();

      if (error) {
        console.error('Erro ao salvar lead:', error);
        throw new Error(error.message || 'Erro ao enviar formulário');
      }

      setFormState('success');
      toast.success('Inscrição realizada com sucesso!', {
        description: 'Você receberá um email em breve com mais informações.',
      });
    } catch (error) {
      setFormState('error');
      toast.error('Erro ao enviar formulário', {
        description: error instanceof Error ? error.message : 'Por favor, tente novamente mais tarde.',
      });
      console.error('Error submitting form:', error);
    }
  };

  // Reset form on unmount
  useEffect(() => {
    return () => {
      if (formState === 'success') {
        resetForm();
      }
    };
  }, [formState, resetForm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <img 
              src="logo-camera.png" 
              alt="Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {formState === 'success' ? (
          /* Success State */
          <div className="container mx-auto px-4 py-12 max-w-2xl text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Inscrição Confirmada! 🎉
            </h2>
            <p className="text-lg text-gray-600">
              Você está na lista de espera e garantiu{' '}
              <span className="font-bold text-blue-600">30% de desconto</span> no
              primeiro mês!
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-3">
              <p className="text-sm text-blue-900 font-medium">
                📧 Enviamos um email de confirmação para{' '}
                <span className="font-bold">{formData.email}</span>
              </p>
              <p className="text-sm text-blue-800">
                Em breve você receberá mais informações sobre o lançamento e como
                ativar seu desconto exclusivo.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={resetForm}
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Fazer nova inscrição
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-12 md:py-16">
              <div className="text-center space-y-6 mb-12">
                <CountdownSection />
                
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mt-8">
                  <Zap className="w-4 h-4" />
                  Lançamento em breve
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight max-w-4xl mx-auto">
                  A automação de conteúdo que vai{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                    transformar suas redes sociais
                  </span>{' '}
                  em uma máquina de vendas
                </h1>

                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Crie, agende e publique conteúdo profissional em todas as suas redes
                  sociais em minutos, não horas.
                </p>

                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6">
                  {[
                    {
                      icon: Sparkles,
                      text: 'IA para criação de conteúdo',
                    },
                    {
                      icon: TrendingUp,
                      text: 'Análise de performance',
                    },
                    {
                      icon: Zap,
                      text: 'Publicação automática',
                    },
                  ].map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {benefit.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Problem Section */}
            <ProblemSection />

            {/* Solution Section */}
            <SolutionSection />

            {/* Social Networks Section */}
            <SocialNetworksSection />

            {/* Benefits Section */}
            <BenefitsSection />

            {/* Differentials Section */}
            <DifferentialsSection />

            {/* Social Proof Section (condicional - mínimo 10 em 3 perfis) */}
            <SocialProofSection />

            {/* Guarantee Section */}
            <GuaranteeSection />

            {/* Form Section */}
            <div className="container mx-auto px-4 py-16 md:py-24">
              <div className="max-w-5xl mx-auto">
                <div className="text-center space-y-4 mb-12">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
                    Garanta seu desconto de{' '}
                    <span className="text-blue-600">30%</span>
                  </h2>
                  <p className="text-xl text-gray-600">
                    Inscreva-se na lista de espera agora e seja um dos primeiros a usar
                  </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-10">
                  <ProgressBar currentStep={currentStep} totalSteps={5} />

                  {currentStep === 1 && <Step1 />}
                  {currentStep === 2 && <Step2 />}
                  {currentStep === 3 && <Step3 />}
                  {currentStep === 4 && <Step4 />}
                  {currentStep === 5 && <Step5 onSubmit={handleSubmit} />}
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="container mx-auto px-4 pb-16">
              <div className="text-center space-y-4">
                <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Sem cartão de crédito</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Cancele quando quiser</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>30% de desconto garantido</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <FAQSection />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 O App. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
