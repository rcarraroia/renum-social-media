import { Clock, FileText, Camera, Calendar, TrendingDown } from 'lucide-react';

const problems = [
  {
    icon: Clock,
    text: 'Tempo gasto na criação de vídeos profissionais',
  },
  {
    icon: FileText,
    text: 'Dificuldade em escrever descrições engajadoras',
  },
  {
    icon: Camera,
    text: 'Timidez de aparecer em vídeo',
  },
  {
    icon: Calendar,
    text: 'Desorganização no agendamento de posts',
  },
  {
    icon: TrendingDown,
    text: 'Baixo engajamento com conteúdo inconsistente',
  },
];

export function ProblemSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
            Você está perdendo tempo precioso criando conteúdo para redes sociais?
          </h2>
          <p className="text-xl text-gray-600">
            Consultoras e políticos perdem{' '}
            <span className="font-bold text-red-600">horas por semana</span> criando,
            editando e agendando posts
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
            {problems.map((problem, index) => {
              const Icon = problem.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-6 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-left text-gray-700 font-medium pt-2">
                    {problem.text}
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
