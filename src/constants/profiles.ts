export interface UserProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
  examples: string[];
  color: string;
}

export const USER_PROFILES: UserProfile[] = [
  {
    id: "mlm",
    name: "Consultora de Vendas Diretas",
    icon: "💼",
    description: "Marketing multinível, vendas de catálogo",
    keywords: ["produto", "venda", "cliente", "catálogo", "pedido", "comissão"],
    examples: ["Natura", "Avon", "Mary Kay", "Herbalife", "Hinode"],
    color: "purple",
  },
  {
    id: "politics",
    name: "Profissional Político",
    icon: "🏛️",
    description: "Candidatos, assessores, lideranças",
    keywords: ["política", "eleição", "comunidade", "proposta", "voto"],
    examples: ["Candidato", "Vereador", "Assessor", "Líder comunitário"],
    color: "blue",
  },
  {
    id: "liberal",
    name: "Profissional Liberal",
    icon: "⚖️",
    description: "Advogados, médicos, dentistas, consultores",
    keywords: ["cliente", "consulta", "atendimento", "serviço", "caso"],
    examples: ["Advogado", "Médico", "Dentista", "Psicólogo", "Arquiteto"],
    color: "indigo",
  },
  {
    id: "educator",
    name: "Educador",
    icon: "🎓",
    description: "Professores, tutores, cursos online",
    keywords: ["aula", "ensino", "aluno", "aprendizado", "educação"],
    examples: ["Professor", "Tutor", "Instrutor", "Mentor"],
    color: "green",
  },
  {
    id: "fitness",
    name: "Fitness & Bem-estar",
    icon: "💪",
    description: "Personal trainers, nutricionistas, coaches",
    keywords: ["treino", "saúde", "transformação", "resultado", "fitness"],
    examples: ["Personal Trainer", "Nutricionista", "Coach", "Instrutor"],
    color: "orange",
  },
  {
    id: "creator",
    name: "Criador de Conteúdo",
    icon: "🎨",
    description: "YouTubers, influencers, artistas",
    keywords: ["conteúdo", "criativo", "engajamento", "viral", "tendência"],
    examples: ["YouTuber", "Influencer", "Artista digital", "Streamer"],
    color: "pink",
  },
  {
    id: "entrepreneur",
    name: "Empreendedor",
    icon: "🏢",
    description: "Donos de negócio, startups, gestores",
    keywords: ["negócio", "empresa", "gestão", "lucro", "crescimento"],
    examples: ["Dono de loja", "Startup", "Franqueado", "Gestor"],
    color: "yellow",
  },
  {
    id: "student",
    name: "Estudante",
    icon: "📚",
    description: "Universitários, concurseiros, autodidatas",
    keywords: ["estudo", "prova", "resumo", "aprendizado", "concurso"],
    examples: ["Universitário", "Concurseiro", "Vestibulandos"],
    color: "cyan",
  },
  {
    id: "general",
    name: "Geral",
    icon: "🌐",
    description: "Conteúdo amplo e informativo",
    keywords: ["informação", "dica", "conhecimento", "geral"],
    examples: ["Público geral", "Educação ampla", "Lifestyle"],
    color: "gray",
  },
];