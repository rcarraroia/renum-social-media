import { Search, Upload, Bot } from 'lucide-react';

const solutions = [
  {
    icon: Search,
    title: 'Pesquisa + Script',
    description:
      'Descubra tendências e gere scripts profissionais em minutos com IA contextual',
    color: 'blue',
  },
  {
    icon: Upload,
    title: 'Upload + Edição',
    description:
      'Adicione legendas automáticas e edite seus vídeos com IA de forma profissional',
    color: 'purple',
  },
  {
    icon: Bot,
    title: 'Avatar AI',
    description:
      'Crie vídeos profissionais sem aparecer em frente à câmera usando avatares virtuais',
    color: 'green',
  },
];

export function SolutionSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 to-blue-700">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              A nossa ferramenta de automação de redes sociais é a solução completa para seus problemas de gestão de conteúdo
            </h2>
            <p className="text-xl text-blue-100">
              3 módulos poderosos que trabalham juntos para transformar sua criação de
              conteúdo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {solution.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{solution.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
