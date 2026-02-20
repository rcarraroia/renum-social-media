# SPEC: OpenRouter Integration + Transcription Fixes

## 📋 VISÃO GERAL

Esta spec define a integração do OpenRouter como provedor unificado de modelos de IA e a correção de bugs críticos no serviço de transcrição do sistema RENUM.

**Status:** PRONTO PARA IMPLEMENTAÇÃO  
**Data de Criação:** 20/02/2026  
**Versão:** 1.0

---

## 🎯 OBJETIVOS

### Feature 1: Integração OpenRouter
1. Substituir uso direto da API Anthropic por OpenRouter (mantendo compatibilidade)
2. Habilitar uso de múltiplos modelos de IA com uma única API key
3. Implementar fallback chain inteligente por serviço
4. Reduzir custos de IA em até 70% (estimativa)

### Feature 2: Correção de Bugs de Transcrição
1. Corrigir validação de `DEEPGRAM_API_KEY` (bug: `bool("placeholder")` retorna True)
2. Implementar fallback automático Deepgram → Whisper em runtime
3. Melhorar confiabilidade do serviço de transcrição

---

## 📁 ESTRUTURA DA SPEC

```
.specs/openrouter-integration/
├── README.md              # Este arquivo (visão geral)
├── requirements.md        # Requisitos funcionais e não funcionais
├── design.md             # Arquitetura, decisões técnicas, fluxos
└── tasks.md              # Tasks atômicas com critérios de aceite
```

---

## 📚 COMO USAR ESTA SPEC

### Para Implementadores

1. **Leia PRIMEIRO:**
   - `AGENTS.md` (raiz do projeto) - Regras obrigatórias
   - `.kiro/steering/desenvolvimento-eficiente.md` - Processo de desenvolvimento

2. **Leia os Documentos da Spec:**
   - `requirements.md` - Entenda O QUE precisa ser feito
   - `design.md` - Entenda COMO será implementado
   - `tasks.md` - Veja as tasks específicas

3. **Siga o Processo:**
   - Análise preventiva ANTES de implementar (Regra 1 do AGENTS.md)
   - Consulte schema real do banco via Supabase Power (Regra 4 do AGENTS.md)
   - Implemente seguindo padrões existentes
   - Crie testes ANTES de marcar task como concluída
   - Valide casos de borda obrigatórios

4. **Não Pule Etapas:**
   - Testes NÃO são opcionais
   - Casos de borda DEVEM ser testados
   - Funcionalidade NUNCA deve ser removida para passar testes

### Para Revisores

1. **Valide:**
   - Todos os critérios de aceite foram atendidos
   - Testes foram implementados e passam
   - Casos de borda foram testados
   - Nenhuma funcionalidade foi removida
   - Código segue padrões existentes

2. **Verifique:**
   - Cobertura de testes > 80%
   - API keys não aparecem em logs
   - Documentação foi atualizada
   - Deploy gradual foi seguido

---

## 🎯 ESCOPO

### Incluído
- ✅ Novo serviço `OpenRouterService`
- ✅ Dual mode (Anthropic + OpenRouter)
- ✅ Configuração de modelo por serviço
- ✅ Fallback chain inteligente
- ✅ Correção de bugs de transcrição
- ✅ Testes completos (45+ testes)
- ✅ Documentação
- ✅ Deploy gradual

### Não Incluído
- ❌ Remoção do `ClaudeService`
- ❌ Cache de respostas (opcional, Fase 8)
- ❌ Migração de dados históricos
- ❌ Mudanças no frontend
- ❌ Novos endpoints de API

---

## 📊 MÉTRICAS DE SUCESSO

### Funcionalidade
- Sistema funciona identicamente com ambos os providers
- Taxa de sucesso de requisições > 99% (com fallback)
- Nenhuma funcionalidade perdida

### Performance
- Latência adicional do OpenRouter < 200ms
- Fallback adiciona < 5s ao tempo total
- Transcrição funciona em > 95% dos casos

### Qualidade
- Cobertura de testes > 80%
- Todos os 45+ testes passam
- Zero código comentado

### Custos
- Redução de custos de IA em 50-70% (estimativa)
- Custos validados em produção

---

## 🚀 FASES DE IMPLEMENTAÇÃO

### Fase 1: Preparação (2 tasks)
Configuração de variáveis de ambiente e dependências

### Fase 2: OpenRouter Service (4 tasks)
Implementação do serviço base e métodos principais

### Fase 3: Correção Transcrição (2 tasks)
Correção de bugs críticos de validação e fallback

### Fase 4: Integração (3 tasks)
Integração com rotas existentes (ScriptAI, PostRápido, AI Assistant)

### Fase 5: Testes (3 tasks)
Testes unitários e de integração completos

### Fase 6: Documentação (3 tasks)
Documentação e deploy em staging

### Fase 7: Deploy Gradual (3 tasks)
Deploy em produção por serviço (AI Assistant → PostRápido → ScriptAI)

### Fase 8: Otimização (3 tasks)
Análise de custos e otimizações

**TOTAL:** 23 tasks

---

## ⚠️ REGRAS CRÍTICAS

### Do AGENTS.md

1. **ANÁLISE PREVENTIVA OBRIGATÓRIA**
   - Ler TODOS os arquivos relacionados antes de implementar
   - Entender EXATAMENTE o que precisa ser feito
   - Identificar padrões existentes
   - Planejar estrutura de implementação

2. **FUNCIONALIDADE SOBRE TESTES**
   - Sistema funcionando 100% tem prioridade
   - NUNCA remover funcionalidades para passar testes
   - NUNCA comentar código para fazer build passar
   - SEMPRE corrigir problemas, não contorná-los

3. **PROIBIÇÃO DE ESTIMATIVAS DE TEMPO**
   - NUNCA apresentar horas estimadas
   - NUNCA apresentar datas de entrega
   - NUNCA criar cronogramas com prazos

4. **ANÁLISE OBRIGATÓRIA DO BANCO**
   - SEMPRE usar Supabase Power para consultar schema real
   - NUNCA confiar apenas em arquivos de migration
   - SEMPRE validar estrutura antes de implementar

### Específicas desta Spec

1. **TESTES SÃO OBRIGATÓRIOS**
   - Mínimo 45 testes devem ser implementados
   - Casos de borda DEVEM ser testados
   - API key = "placeholder" DEVE ser testado
   - Nenhuma task pode ser concluída sem testes

2. **DUAL MODE DEVE SER MANTIDO**
   - Sistema DEVE funcionar com USE_OPENROUTER=true e false
   - ClaudeService DEVE ser mantido
   - Migração DEVE ser reversível

3. **DEPLOY GRADUAL É OBRIGATÓRIO**
   - AI Assistant primeiro (menor criticidade)
   - PostRápido segundo
   - ScriptAI por último (maior criticidade)
   - Monitoramento de 48h entre cada fase

---

## 📞 SUPORTE

### Dúvidas sobre a Spec
- Consulte `requirements.md` para requisitos
- Consulte `design.md` para decisões técnicas
- Consulte `tasks.md` para tasks específicas

### Dúvidas sobre Implementação
- Consulte `AGENTS.md` para regras gerais
- Consulte `.kiro/steering/desenvolvimento-eficiente.md` para processo
- Consulte `.context/agents/` para agentes especializados

### Problemas Técnicos
- Consulte logs do sistema
- Consulte documentação do OpenRouter
- Consulte documentação da Anthropic
- Use Supabase Power para validar banco

---

## 📝 CHANGELOG

### v1.0 (20/02/2026)
- Spec inicial criada
- 23 tasks definidas
- 45+ testes obrigatórios especificados
- Deploy gradual planejado

---

**Criado por:** Kiro AI  
**Data:** 20/02/2026  
**Baseado em:** Relatório Técnico OpenRouter + Relatório de Transcrição  
**Seguindo:** AGENTS.md + desenvolvimento-eficiente.md
