# REQUISITOS - OpenRouter Integration + Transcription Fixes

## 📋 VISÃO GERAL

Esta spec define a integração do OpenRouter como provedor unificado de modelos de IA e a correção de bugs críticos no serviço de transcrição.

**Objetivos:**
1. Substituir uso direto da API Anthropic por OpenRouter (mantendo compatibilidade)
2. Habilitar uso de múltiplos modelos de IA com uma única API key
3. Implementar fallback chain inteligente por serviço
4. Corrigir bugs de validação de API keys no serviço de transcrição
5. Implementar fallback automático Deepgram → Whisper

---

## 🎯 FEATURE 1: INTEGRAÇÃO OPENROUTER

### 1.1 REQUISITOS FUNCIONAIS

#### RF1.1: Serviço OpenRouter
- Sistema DEVE criar novo serviço `OpenRouterService` em `backend/app/services/openrouter.py`
- Serviço DEVE usar SDK OpenAI com `base_url` customizada para OpenRouter
- Serviço DEVE suportar configuração de modelo diferente por tipo de serviço (script, description, assistant)
- Serviço DEVE implementar fallback chain configurável por serviço
- Serviço DEVE manter mesma interface pública do `ClaudeService` existente

#### RF1.2: Dual Mode (Anthropic + OpenRouter)
- Sistema DEVE suportar flag `USE_OPENROUTER` para alternar entre providers
- Sistema DEVE manter `ClaudeService` funcionando quando `USE_OPENROUTER=false`
- Sistema DEVE usar `OpenRouterService` quando `USE_OPENROUTER=true`
- Sistema DEVE permitir migração gradual por serviço

#### RF1.3: Configuração por Serviço
- Sistema DEVE permitir configurar modelo específico para ScriptAI via `OPENROUTER_SCRIPT_MODEL`
- Sistema DEVE permitir configurar modelo específico para PostRápido via `OPENROUTER_DESCRIPTION_MODEL`
- Sistema DEVE permitir configurar modelo específico para AI Assistant via `OPENROUTER_ASSISTANT_MODEL`
- Sistema DEVE retornar erro claro se variáveis não forem configuradas (não há valores padrão)
- A escolha de modelos será feita pelo administrador via painel admin (ainda não desenvolvido)

#### RF1.4: Fallback Chain Inteligente
- Sistema DEVE implementar fallback automático quando modelo primário falhar
- Sistema DEVE permitir configurar fallback chain por serviço via variáveis de ambiente
- Sistema DEVE logar qual modelo foi usado em cada requisição
- Sistema DEVE retornar erro apenas se todos os modelos do fallback falharem
- A configuração de fallback chains será feita pelo administrador via painel admin (ainda não desenvolvido)

#### RF1.5: Validação de API Keys
- Sistema DEVE validar `OPENROUTER_API_KEY` antes de processar requisições
- Sistema DEVE retornar HTTP 503 com mensagem clara se key não estiver configurada
- Sistema DEVE retornar HTTP 503 se key for "placeholder"
- Sistema DEVE logar tentativas de uso com keys inválidas

#### RF1.6: Migração dos Serviços Existentes
- Sistema DEVE migrar `/api/scriptai/generate` para usar novo serviço
- Sistema DEVE migrar `/api/scriptai/regenerate` para usar novo serviço
- Sistema DEVE migrar `/api/module2/generate-descriptions` para usar novo serviço
- Sistema DEVE migrar `/api/module2/regenerate-description` para usar novo serviço
- Sistema DEVE migrar AI Assistant para usar novo serviço
- Sistema DEVE manter funcionalidade 100% idêntica após migração

### 1.2 REQUISITOS NÃO FUNCIONAIS

#### RNF1.1: Performance
- Latência adicional do OpenRouter DEVE ser < 200ms comparado a Anthropic direto
- Fallback DEVE adicionar no máximo 5 segundos ao tempo total de resposta
- Sistema DEVE implementar timeout de 60 segundos por tentativa de modelo

#### RNF1.2: Confiabilidade
- Sistema DEVE ter disponibilidade > 99% considerando fallback chain
- Sistema DEVE logar todas as falhas de API para análise posterior
- Sistema DEVE manter funcionalidade mesmo se OpenRouter estiver offline (usando Anthropic direto)

#### RNF1.3: Segurança
- API keys DEVEM ser armazenadas apenas em variáveis de ambiente
- API keys NUNCA devem aparecer em logs
- Sistema DEVE validar origem das requisições (CORS)

#### RNF1.4: Manutenibilidade
- Código DEVE seguir padrões existentes do projeto
- Código DEVE ter cobertura de testes > 80%
- Código DEVE ter documentação inline em pontos críticos

---

## 🎯 FEATURE 2: CORREÇÃO DE BUGS DE TRANSCRIÇÃO

### 2.1 REQUISITOS FUNCIONAIS

#### RF2.1: Validação Correta de API Keys
- Sistema DEVE corrigir validação de `DEEPGRAM_API_KEY` em `TranscriptionService.__init__`
- Sistema DEVE considerar key inválida se for `None`, string vazia, ou "placeholder"
- Sistema DEVE usar Whisper se Deepgram key for inválida
- Sistema DEVE logar qual provider está sendo usado (Deepgram ou Whisper)

#### RF2.2: Fallback Automático em Runtime
- Sistema DEVE implementar try-catch em `transcribe_audio()`
- Sistema DEVE tentar Whisper automaticamente se Deepgram falhar
- Sistema DEVE logar erro do Deepgram antes de fazer fallback
- Sistema DEVE retornar erro apenas se ambos (Deepgram e Whisper) falharem
- Sistema DEVE incluir no response qual provider foi usado

#### RF2.3: Tratamento de Erros
- Sistema DEVE retornar mensagens de erro claras para o usuário
- Sistema DEVE logar stack trace completo para debugging
- Sistema DEVE incluir provider usado no metadata da resposta

### 2.2 REQUISITOS NÃO FUNCIONAIS

#### RNF2.1: Confiabilidade
- Sistema DEVE ter disponibilidade > 95% de transcrição (considerando fallback)
- Sistema DEVE processar transcrições mesmo com Deepgram offline

#### RNF2.2: Performance
- Fallback para Whisper DEVE adicionar no máximo 10 segundos ao tempo total
- Sistema DEVE processar áudio de 60 segundos em menos de 30 segundos (Whisper)

---

## 📊 CRITÉRIOS DE ACEITE GERAIS

### Funcionalidade
- [ ] Todos os endpoints existentes continuam funcionando identicamente
- [ ] Nenhuma funcionalidade foi removida ou simplificada
- [ ] Sistema funciona com `USE_OPENROUTER=true` e `USE_OPENROUTER=false`
- [ ] Fallback chains funcionam corretamente
- [ ] Validação de API keys funciona corretamente
- [ ] Transcrição funciona com Deepgram e Whisper

### Qualidade
- [ ] Cobertura de testes > 80%
- [ ] Todos os testes passam
- [ ] Nenhum código comentado para fazer build passar
- [ ] Nenhuma funcionalidade removida para passar em testes

### Documentação
- [ ] Variáveis de ambiente documentadas em `.env.example`
- [ ] README atualizado com instruções de configuração
- [ ] Comentários inline em pontos críticos

### Segurança
- [ ] API keys não aparecem em logs
- [ ] Validação de keys antes de processar requisições
- [ ] CORS configurado corretamente

---

## 🚫 RESTRIÇÕES E LIMITAÇÕES

### ⚠️ RESTRIÇÃO CRÍTICA — FRONTEND

**Esta implementação é 100% backend. Nenhum arquivo do frontend deve ser alterado.**

- O painel atual do usuário (`/settings`, `/module-1`, `/module-2`, etc.) permanece intocado
- A única API key que o usuário final configura no painel atual é a do HeyGen
- A configuração do OpenRouter (chave de API, modelos por serviço) será feita exclusivamente pelo administrador via painel admin
- O painel admin ainda não existe e não será desenvolvido nesta spec
- Qualquer interface de configuração do OpenRouter fica para quando o painel admin for implementado

### Restrições Técnicas
- DEVE usar Python 3.11+
- DEVE usar FastAPI existente
- DEVE manter compatibilidade com Supabase
- DEVE seguir padrões de código existentes

### Restrições de Negócio
- NÃO pode quebrar funcionalidades existentes
- NÃO pode aumentar custos sem aprovação
- NÃO pode comprometer segurança

### Limitações Conhecidas
- OpenRouter adiciona latência de ~50-200ms
- Fallback aumenta tempo de resposta em caso de falha
- Whisper local consome CPU significativa

---

## 📝 CASOS DE USO

### CU1: Gerar Script com OpenRouter
**Ator:** Usuário autenticado  
**Pré-condições:** `USE_OPENROUTER=true`, `OPENROUTER_API_KEY` configurada  
**Fluxo Principal:**
1. Usuário envia requisição para `/api/scriptai/generate`
2. Sistema valida API key
3. Sistema chama Tavily para pesquisa
4. Sistema chama OpenRouter com modelo configurado
5. Sistema retorna script gerado

**Fluxo Alternativo 1 (Modelo primário falha):**
4a. OpenRouter retorna erro para modelo primário  
4b. Sistema tenta próximo modelo do fallback chain  
4c. Sistema retorna script do modelo de fallback  

**Fluxo Alternativo 2 (API key inválida):**
2a. Sistema detecta API key inválida  
2b. Sistema retorna HTTP 503 com mensagem clara  

### CU2: Transcrever Áudio com Fallback
**Ator:** Sistema (processamento de vídeo)  
**Pré-condições:** Arquivo de áudio válido  
**Fluxo Principal:**
1. Sistema chama `transcribe_audio()`
2. Sistema valida `DEEPGRAM_API_KEY`
3. Sistema chama Deepgram API
4. Sistema retorna transcrição

**Fluxo Alternativo 1 (Deepgram key inválida):**
2a. Sistema detecta key inválida  
2b. Sistema usa Whisper local  
2c. Sistema retorna transcrição do Whisper  

**Fluxo Alternativo 2 (Deepgram falha em runtime):**
3a. Deepgram API retorna erro  
3b. Sistema loga erro  
3c. Sistema tenta Whisper local  
3d. Sistema retorna transcrição do Whisper  

---

## 🔍 VALIDAÇÃO DO SCHEMA DO BANCO

**Validação realizada via Supabase Power em 20/02/2026:**

### Tabelas Relevantes
- ✅ `organizations` - Contém `id`, `name`, `plan`
- ✅ `users` - Contém `id`, `organization_id`, `email`
- ✅ `videos` - Contém `id`, `organization_id`, `user_id`, `script`, `metadata`, `transcription`
- ✅ `api_logs` - Contém `id`, `organization_id`, `module`, `endpoint`, `status_code`

### Campos Necessários
- ✅ `videos.metadata` (jsonb) - Para armazenar modelo usado
- ✅ `videos.transcription` (text) - Para armazenar transcrição
- ✅ `api_logs.module` - Para registrar uso por módulo

**Conclusão:** Schema atual suporta todas as funcionalidades necessárias. Nenhuma migration adicional é necessária.

---

## 📚 REFERÊNCIAS

- [Relatório Técnico OpenRouter](../docs/OPENROUTER_TECHNICAL_REPORT.md)
- [Relatório de Transcrição](../docs/TRANSCRIPTION_ARCHITECTURE_REPORT.md)
- [AGENTS.md](../../AGENTS.md)
- [Desenvolvimento Eficiente](.kiro/steering/desenvolvimento-eficiente.md)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Anthropic SDK Documentation](https://docs.anthropic.com)

---

**Data de Criação:** 20/02/2026  
**Autor:** Kiro AI  
**Status:** PRONTO PARA IMPLEMENTAÇÃO  
**Versão:** 1.0
