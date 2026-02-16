import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Ana Silva',
    role: 'Consultora Natura',
    avatar: 'AS',
    text: 'Economizei 8 horas por semana e aumentei minhas vendas em 35%! O Posts Flows mudou completamente minha forma de trabalhar.',
    rating: 5,
  },
  {
    name: 'Carlos Mendes',
    role: 'Candidato Municipal',
    avatar: 'CM',
    text: 'Finalmente posso criar conteúdo político de qualidade sem perder tempo. A IA contextual entende exatamente o que preciso.',
    rating: 5,
  },
  {
    name: 'Beatriz Costa',
    role: 'Influencer',
    avatar: 'BC',
    text: 'O Avatar AI é um game-changer para minhas redes sociais. Consigo postar todos os dias sem aparecer na câmera!',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-gray-600">
              Histórias reais de quem transformou sua presença digital
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-blue-100 relative"
              >
                <Quote className="absolute top-6 right-6 w-12 h-12 text-blue-200" />
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
