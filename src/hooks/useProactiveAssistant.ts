import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

export interface ProactiveTrigger {
  id: string;
  delay: number;
  condition?: () => boolean;
  message: string;
  pulse?: boolean;
  celebration?: boolean;
  actions?: string[];
}

export const useProactiveAssistant = () => {
  const location = useLocation();
  const [triggeredMessages, setTriggeredMessages] = useState<Set<string>>(new Set());
  const [pendingTrigger, setPendingTrigger] = useState<ProactiveTrigger | null>(null);

  // Verificar se é primeira visita
  const isFirstVisit = !localStorage.getItem("renum_visited");
  
  // Verificar dias desde última visita
  const daysSinceLastVisit = (() => {
    const lastVisit = localStorage.getItem("renum_last_visit");
    if (!lastVisit) return 0;
    const diff = Date.now() - parseInt(lastVisit);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  })();

  // Marcar visita
  useEffect(() => {
    localStorage.setItem("renum_visited", "true");
    localStorage.setItem("renum_last_visit", Date.now().toString());
  }, []);

  // Triggers por página
  const triggers: Record<string, ProactiveTrigger[]> = {
    "/dashboard": [
      {
        id: "first_login",
        delay: 2000,
        condition: () => isFirstVisit,
        message: `👋 Oi! Eu sou a Rena, sua assistente de IA!

Vejo que é sua primeira vez aqui. Que tal criarmos seu primeiro vídeo juntos? Posso te ajudar com:

🎬 Gerar um script sobre qualquer tema
📱 Gravar com teleprompter
📅 Agendar nas suas redes

Por onde começamos?`,
        actions: ["Criar primeiro vídeo", "Conhecer o sistema", "Depois"],
      },
      {
        id: "returning_user",
        delay: 1000,
        condition: () => daysSinceLastVisit >= 3,
        message: `Que bom te ver de novo! 🤗

Enquanto você estava fora, vou buscar suas estatísticas mais recentes!

Quer ver os detalhes ou criar algo novo?`,
      },
    ],
    "/module-1/script-ai": [
      {
        id: "empty_scripts",
        delay: 5000,
        condition: () => {
          // Verificar se não há scripts (será implementado com estado real)
          return true;
        },
        message: `💡 Ainda sem scripts? Vou te dar uma mãozinha!

Me conta: qual é o seu nicho? (Ex: beleza, fitness, vendas...)

Vou gerar um script perfeito para você começar! ✨`,
        pulse: true,
      },
    ],
    "/module-1/teleprompter": [
      {
        id: "teleprompter_tips",
        delay: 15000,
        message: `📱 Dica rápida para gravação:

• Toque no texto para pausar/continuar
• Use os botões grandes embaixo para ajustar
• Posicione o celular na altura dos olhos

Tudo certo ou precisa de ajuda? 😊`,
      },
    ],
  };

  // Verificar triggers da página atual
  useEffect(() => {
    const pageTriggers = triggers[location.pathname] || [];
    
    pageTriggers.forEach((trigger) => {
      // Verificar se já foi disparado
      if (triggeredMessages.has(trigger.id)) return;
      
      // Verificar condição
      if (trigger.condition && !trigger.condition()) return;
      
      // Agendar trigger
      const timer = setTimeout(() => {
        setPendingTrigger(trigger);
        setTriggeredMessages((prev) => new Set(prev).add(trigger.id));
      }, trigger.delay);
      
      return () => clearTimeout(timer);
    });
  }, [location.pathname, triggeredMessages]);

  const dismissTrigger = useCallback(() => {
    setPendingTrigger(null);
  }, []);

  const handleAction = useCallback((action: string) => {
    // Implementar ações específicas
    console.log("Action triggered:", action);
    dismissTrigger();
  }, [dismissTrigger]);

  return {
    pendingTrigger,
    dismissTrigger,
    handleAction,
  };
};
