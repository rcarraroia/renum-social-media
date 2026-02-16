import { Shield, CheckCircle } from 'lucide-react';

export function GuaranteeSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-green-500">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-12 h-12 text-white" />
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Garantia de Satisfação
                </h2>
                <p className="text-xl text-gray-700 leading-relaxed mb-6">
                  Se você não estiver satisfeito, seu{' '}
                  <span className="font-bold text-green-600">
                    reembolso é garantido
                  </span>
                  . Sem risco, apenas resultados.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>30 dias de garantia</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Sem perguntas</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>100% seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
