import { Brain, CalendarDays, Smartphone } from 'lucide-react';

const differentials = [
  {
    icon: Brain,
    title: 'IA Contextual',
    description:
      'Scripts e descrições adaptados especificamente para MLM e política, não conteúdo genérico',
  },
  {
    icon: CalendarDays,
    title: 'Calendário Integrado',
    description:
      'Visualização e edição de posts sem sair do app, tudo em um só lugar',
  },
  {
    icon: Smartphone,
    title: 'Mobile-First PWA',
    description:
      'Aplicativo instalável no celular para usar em qualquer lugar, a qualquer hora',
  },
];

export function DifferentialsSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              O que nos torna diferente das outras ferramentas
            </h2>
            <p className="text-xl text-gray-300">
              Recursos exclusivos que você não encontra em nenhum outro lugar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {differentials.map((differential, index) => {
              const Icon = differential.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-800 rounded-2xl p-8 border border-gray-700 hover:border-blue-500 transition-all hover:shadow-2xl hover:shadow-blue-500/20"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {differential.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {differential.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
