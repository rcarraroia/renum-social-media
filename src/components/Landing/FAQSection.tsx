import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'Como funciona o desconto de 30%?',
    answer:
      'Ao se inscrever na lista de espera, você garante automaticamente 30% de desconto no primeiro mês de qualquer plano. O desconto será aplicado automaticamente quando você ativar sua conta no lançamento.',
  },
  {
    question: 'Quando vou receber acesso ao app?',
    answer:
      'O lançamento oficial está previsto para 06/03/2026. Você receberá um email com instruções de acesso no dia do lançamento, com prioridade sobre quem não está na lista de espera.',
  },
  {
    question: 'Posso cancelar a qualquer momento?',
    answer:
      'Sim! Não há fidelidade ou multa por cancelamento. Você pode cancelar sua assinatura a qualquer momento diretamente no painel de controle, e o cancelamento terá efeito no final do período pago.',
  },
  {
    question: 'Quantas redes sociais posso conectar?',
    answer:
      'O App suporta 11 redes sociais: Instagram, TikTok, YouTube, Facebook, LinkedIn, Twitter, Pinterest, Threads, Bluesky, Twitch e Google Business. Você pode conectar quantas contas quiser em cada rede, dependendo do seu plano.',
  },
  {
    question: 'Preciso de conhecimento técnico para usar?',
    answer:
      'Não! O App foi desenvolvido para ser extremamente intuitivo. Nossa IA contextual entende suas necessidades e cria conteúdo automaticamente. Você só precisa revisar e aprovar. Além disso, oferecemos suporte VIP nos primeiros 30 dias para todos da lista de espera.',
  },
  {
    question: 'O que acontece após o lançamento?',
    answer:
      'Após o lançamento em 06/03/2026, você receberá um email com seu link exclusivo de ativação. Seu desconto de 30% estará pré-aplicado. Você terá acesso prioritário e suporte VIP por 30 dias para garantir que aproveite ao máximo a plataforma.',
  },
  {
    question: 'Posso mudar de plano depois?',
    answer:
      'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor imediatamente (upgrade) ou no próximo ciclo de cobrança (downgrade).',
  },
  {
    question: 'Meus dados estão seguros?',
    answer:
      'Absolutamente! Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados nunca são compartilhados com terceiros e você tem controle total sobre suas informações.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-gray-600">
              Tire suas dúvidas sobre o lançamento
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 overflow-hidden transition-all hover:shadow-md"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 hover:bg-blue-50/50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-lg">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform duration-200 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    openIndex === index ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-5 text-gray-700 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <p className="text-gray-700">
              Ainda tem dúvidas?{' '}
              <a
                href="#form"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('form')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
              >
                Inscreva-se agora
              </a>{' '}
              e receba todas as informações por email
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
