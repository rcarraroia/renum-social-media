import { Clock, TrendingUp, Video, Calendar } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Economize até 10 horas por semana',
    description: 'Automatize a criação de conteúdo e foque no que realmente importa',
  },
  {
    icon: TrendingUp,
    title: 'Aumente seu engajamento em até 200%',
    description: 'Descrições otimizadas por IA que realmente convertem',
  },
  {
    icon: Video,
    title: 'Vídeos profissionais sem aparecer',
    description: 'Use Avatar AI para criar conteúdo sem timidez',
  },
  {
    icon: Calendar,
    title: 'Agendamento inteligente',
    description: 'Publique nos melhores horários para cada plataforma',
  },
];

export function BenefitsSection() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              Benefícios que farão a diferença no seu negócio
            </h2>
            <p className="text-xl text-gray-600">
              Resultados comprovados que transformam sua presença digital
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-100"
                >
                  <div className="flex items-start gap-6">
                    <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
