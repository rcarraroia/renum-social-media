import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Twitter,
  TrendingUp,
  Video,
  MessageCircle,
  Globe,
  Pin,
  Twitch
} from 'lucide-react';

const socialNetworks = [
  {
    name: 'Instagram',
    icon: Instagram,
    color: 'from-purple-600 to-pink-600',
    formats: 'Posts, Reels, Stories',
  },
  {
    name: 'TikTok',
    icon: Video,
    color: 'from-black to-gray-800',
    formats: 'Vídeos curtos',
  },
  {
    name: 'YouTube',
    icon: Youtube,
    color: 'from-red-600 to-red-700',
    formats: 'Vídeos, Shorts',
  },
  {
    name: 'Threads',
    icon: MessageCircle,
    color: 'from-black to-gray-700',
    formats: 'Posts de texto',
  },
  {
    name: 'Twitter/X',
    icon: Twitter,
    color: 'from-blue-400 to-blue-600',
    formats: 'Tweets, Threads',
  },
  {
    name: 'Twitch',
    icon: Twitch,
    color: 'from-purple-600 to-purple-700',
    formats: 'Clips, Vídeos',
  },
  {
    name: 'Google Business',
    icon: Globe,
    color: 'from-blue-600 to-green-600',
    formats: 'Posts locais',
  },
  {
    name: 'Bluesky',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    formats: 'Posts sociais',
  },
  {
    name: 'Facebook',
    icon: Facebook,
    color: 'from-blue-600 to-blue-700',
    formats: 'Posts, Reels, Stories',
  },
  {
    name: 'Pinterest',
    icon: Pin,
    color: 'from-red-600 to-red-700',
    formats: 'Pins, Boards',
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'from-blue-700 to-blue-800',
    formats: 'Posts profissionais',
  },
];

export function SocialNetworksSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Globe className="w-4 h-4" />
            Integração Total
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold">
            Publique em{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              11 Redes Sociais
            </span>
            {' '}Simultaneamente
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Crie uma vez, publique em todos os lugares. O Posts Flows conecta você
            com as principais plataformas do mercado.
          </p>
        </div>

        {/* Social Networks Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {socialNetworks.map((network, index) => {
            const Icon = network.icon;
            
            return (
              <div
                key={network.name}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-white/20"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Icon with Gradient Background */}
                <div className="mb-4">
                  <div
                    className={`w-14 h-14 rounded-lg bg-gradient-to-br ${network.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Network Name */}
                <h3 className="text-lg font-bold mb-2 text-white">
                  {network.name}
                </h3>

                {/* Formats */}
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  {network.formats}
                </p>

                {/* Hover Effect Border */}
                <div
                  className={`absolute inset-0 rounded-xl bg-gradient-to-br ${network.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}
                />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-1">11</div>
              <div className="text-sm text-gray-400">Redes Sociais</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-4xl font-bold text-cyan-400 mb-1">∞</div>
              <div className="text-sm text-gray-400">Posts Ilimitados</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-1">1</div>
              <div className="text-sm text-gray-400">Clique para Publicar</div>
            </div>
          </div>

          <p className="text-gray-400 max-w-2xl mx-auto">
            Não perca mais tempo copiando e colando conteúdo entre plataformas.
            Com o Posts Flows, você agenda uma vez e publica em todas as suas redes
            automaticamente.
          </p>
        </div>
      </div>
    </section>
  );
}
