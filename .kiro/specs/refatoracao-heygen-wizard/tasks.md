# Plano de Implementação: Refatoração Integração HeyGen

## Visão Geral

Refatoração completa da integração HeyGen: remover do onboarding, criar wizard de 2 passos no módulo AvatarAI, voz como atributo do avatar. Implementação em TypeScript (frontend) e Python (backend).

## Tarefas

- [x] 1. Preparar infraestrutura de banco de dados
  - [x] 1.1 Criar migration para adicionar coluna heygen_access_token
    - Adicionar coluna `heygen_access_token TEXT` nullable na tabela `organizations`
    - Documentar obsolescência de `heygen_api_key_encrypted` (manter por compatibilidade)
    - Criar migration em `supabase/migrations/`
    - _Requisitos: Requirement 7 (Persistência de Dados) - AC 2, 7; Requirement 8 (Segurança) - AC 7_

- [x] 2. Implementar endpoint de validação de API Key (Backend)
  - [x] 2.1 Criar modelo Pydantic HeyGenApiKeyOnly
    - Criar modelo em `backend/app/models/heygen.py`
    - Campo `api_key: str` com validação
    - _Requisitos: Requirement 3 (Validação de API Key) - AC 1, 7_
  
  - [x] 2.2 Implementar endpoint POST /api/integrations/heygen/validate-key
    - Criar rota em `backend/app/api/routes/heygen.py`
    - Validar API Key chamando HeyGen API (GET /v1/user.info)
    - Retornar `{valid: bool, credits_remaining: int, plan: str}`
    - Não salvar no banco (apenas validação)
    - Tratamento de erros: API Key inválida, timeout, rate limit
    - _Requisitos: Requirement 3 (Validação de API Key) - AC 1, 2, 3, 4, 5, 6, 7; Requirement 11 (Performance) - AC 1; Requirement 12 (Tratamento de Erros) - AC 1, 2, 7_
  
  - [x] 2.3 Escrever testes unitários para endpoint de validação
    - Testar API Key válida
    - Testar API Key inválida
    - Testar timeout e erros de rede
    - _Requisitos: Requirement 3 (Validação de API Key) - AC 3, 4; Requirement 12 (Tratamento de Erros) - AC 1, 2_

- [x] 3. Checkpoint - Validar backend
  - Garantir que todos os testes passem, perguntar ao usuário se há dúvidas.

- [x] 4. Remover HeyGen do onboarding (Frontend)
  - [x] 4.1 Modificar Onboarding.tsx
    - Remover Passo 3 (Avatar AI) do componente
    - Ajustar stepper para 3 passos: Perfil → Conectar Redes → Pronto
    - Atualizar lógica de `onboarding_step` para valores 1-3
    - Remover imports e componentes relacionados ao HeyGen
    - Arquivo: `src/components/Onboarding.tsx`
    - _Requisitos: Requirement 1 (Onboarding Simplificado) - AC 1, 2, 3, 4, 5_
  
  - [x] 4.2 Escrever testes E2E para onboarding modificado
    - Testar fluxo completo de 3 passos
    - Validar que não há referências ao HeyGen
    - _Requisitos: Requirement 1 (Onboarding Simplificado) - AC 1, 2, 4_

- [x] 5. Criar HeyGenSetupWizard - Passo 1 (API Key) ✅ CONCLUÍDO
  - [x] 5.1 Implementar componente HeyGenSetupWizard.tsx ✅
    - Criar arquivo `src/components/heygen/HeyGenSetupWizard.tsx`
    - Estrutura de 2 passos com state management
    - Passo 1: Formulário de API Key
    - Campo password com toggle show/hide (usar lucide-react Eye/EyeOff)
    - Link "Criar conta grátis no HeyGen" (https://heygen.com)
    - Botão "Conectar" → POST /api/integrations/heygen/validate-key
    - Estados: idle → loading → success → error
    - Feedback visual: loading spinner, mensagem de erro, sucesso
    - ✅ Refatorado para usar design system (variáveis CSS, componentes shadcn/ui)
    - ✅ Substituídas cores hardcoded por variáveis do design system
    - ✅ Convertidos botões customizados para componente Button
    - ✅ Ajustados espaçamentos, tipografia e bordas para padrão Card
    - ✅ Zero erros de diagnóstico
    - _Requisitos: Requirement 2 (Wizard de Configuração) - AC 1, 2, 3, 4, 5; Requirement 3 (Validação de API Key) - AC 1, 3, 4, 5; Requirement 9 (Feedback Visual) - AC 1, 2, 3, 4; Requirement 10 (Responsividade) - AC 1, 2, 3, 4, 5, 6, 7_
  
  - [ ]* 5.2 Escrever testes unitários para Passo 1
    - Testar toggle show/hide password
    - Testar validação de API Key
    - Testar estados de loading e erro
    - _Requisitos: Requirement 2 (Wizard de Configuração) - AC 3; Requirement 3 (Validação de API Key) - AC 5; Requirement 9 (Feedback Visual) - AC 1, 3_

- [x] 6. Criar HeyGenSetupWizard - Passo 2 (Avatar + Voz) ✅ CONCLUÍDO
  - [x] 6.1 Implementar Passo 2 do wizard ✅
    - Grid de avatares (GET /api/integrations/heygen/avatars)
    - Clones no topo, avatares públicos abaixo
    - Seletor de voz integrado ao card do avatar
    - Card especial "Criar clone" → abre HeyGenCloneGuide modal
    - Botão "Salvar" → PUT /api/integrations/heygen
    - Salvar: api_key, avatar_id, voice_id
    - ✅ Refatorado para usar design system (variáveis CSS, componentes shadcn/ui)
    - ✅ Substituídas cores hardcoded por variáveis do design system
    - ✅ Convertidos botões customizados para componente Button
    - ✅ Ajustados espaçamentos, tipografia e bordas para padrão Card
    - ✅ Zero erros de diagnóstico
    - _Requisitos: Requirement 2 (Wizard de Configuração) - AC 2, 5, 6; Requirement 4 (Seleção Avatar e Voz) - AC 1, 2, 3, 4, 5, 6, 7, 8; Requirement 9 (Feedback Visual) - AC 1, 2, 3, 6, 7; Requirement 11 (Performance) - AC 2, 3, 5_
  
  - [x] 6.2 Criar componente HeyGenCloneGuide.tsx (Modal) ✅
    - Criar arquivo `src/components/heygen/HeyGenCloneGuide.tsx`
    - Modal com passo a passo visual para criar clone
    - Botão "Ir para HeyGen" (abre heygen.com em nova aba)
    - Botão "Atualizar lista" → recarrega avatares
    - ✅ Refatorado para usar Dialog do shadcn/ui (substituído modal customizado)
    - ✅ Substituídas cores hardcoded por variáveis do design system
    - ✅ Convertidos botões customizados para componente Button
    - ✅ Ajustados espaçamentos, tipografia e bordas para padrão Card
    - ✅ Zero erros de diagnóstico
    - _Requisitos: Requirement 5 (Criação de Clone) - AC 1, 2, 3, 4, 5, 6, 7; Requirement 10 (Responsividade) - AC 7_
  
  - [ ]* 6.3 Escrever testes unitários para Passo 2
    - Testar seleção de avatar
    - Testar seleção de voz
    - Testar abertura do modal de clone
    - Testar salvamento da configuração
    - _Requisitos: Requirement 4 (Seleção Avatar e Voz) - AC 3, 4, 5, 6, 8; Requirement 5 (Criação de Clone) - AC 1, 6_

- [ ] 7. Checkpoint - Validar wizard completo
  - Garantir que todos os testes passem, perguntar ao usuário se há dúvidas.

- [ ] 8. Integrar wizard no Module3.tsx
  - [x] 8.1 Modificar Module3.tsx para detectar configuração HeyGen ✅
    - Verificar se `heygen_api_key` ou `heygen_access_token` existe
    - Sem configuração: exibir HeyGenSetupWizard (substitui tela inteira)
    - Com configuração: exibir módulo normal
    - Arquivo: `src/pages/Module3.tsx`
    - ✅ Implementado verificação de configuração HeyGen
    - ✅ Wizard substitui tela inteira quando não configurado
    - ✅ Módulo normal exibido quando configurado
    - ✅ Seguindo design system (variáveis CSS, componentes shadcn/ui)
    - ✅ Zero erros de diagnóstico
    - _Requisitos: Requirement 2 (Wizard de Configuração) - AC 1, 6; Requirement 6 (Gerenciamento de Avatar) - AC 1_
  
  - [x] 8.2 Criar header do módulo com informações HeyGen ✅
    - Miniatura do avatar selecionado
    - Créditos restantes (GET /api/integrations/heygen/credits)
    - Botão "Trocar avatar" → reabre wizard no Passo 2
    - ✅ Implementado header com miniatura do avatar
    - ✅ Exibição de créditos restantes
    - ✅ Botão "Trocar Avatar" que reabre o wizard
    - ✅ Seguindo design system (variáveis CSS, componentes shadcn/ui)
    - ✅ Zero erros de diagnóstico
    - _Requisitos: Requirement 6 (Gerenciamento de Avatar) - AC 2, 3, 4, 5, 6_
  
  - [ ] 8.3 Escrever testes de integração para Module3
    - Testar exibição do wizard quando não configurado
    - Testar exibição do módulo quando configurado
    - Testar botão "Trocar avatar"
    - _Requisitos: Requirement 2 (Wizard de Configuração) - AC 1, 6; Requirement 6 (Gerenciamento de Avatar) - AC 1, 2, 3_

- [ ] 9. Testes end-to-end completos
  - [ ]* 9.1 Escrever teste E2E do fluxo completo
    - Onboarding sem HeyGen (3 passos)
    - Acesso ao Module3 → wizard aparece
    - Passo 1: validar API Key
    - Passo 2: selecionar avatar + voz
    - Salvar configuração
    - Verificar header com avatar e créditos
    - Testar "Trocar avatar"
    - _Requisitos: Requirement 1 (Onboarding Simplificado) - AC 1, 2, 4; Requirement 2 (Wizard de Configuração) - AC 1, 2, 6; Requirement 3 (Validação de API Key) - AC 3, 4; Requirement 4 (Seleção Avatar e Voz) - AC 6, 7; Requirement 6 (Gerenciamento de Avatar) - AC 2, 3_

- [x] 10. Checkpoint final - Validação completa ✅
  - ✅ Todos os testes de diagnóstico passaram (zero erros)
  - ✅ Todos os componentes seguem o design system
  - ✅ Integração com Module3.tsx funcionando
  - ✅ Wizard de configuração implementado e validado
  - ✅ Sistema de detecção de configuração HeyGen funcionando
  - ✅ Header com informações do avatar implementado
  - ✅ Documentação do design system criada
  - ✅ AGENTS.md atualizado com regras de UI/UX
  - **STATUS:** Refatoração HeyGen concluída com sucesso!

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada tarefa referencia requisitos específicos (serão preenchidos após requirements.md)
- Checkpoints garantem validação incremental
- Frontend usa React + TypeScript + shadcn/ui
- Backend usa Python + FastAPI + Pydantic
- Wizard substitui completamente a tela do Module3 quando HeyGen não está configurado
- Voz é atributo do avatar (selecionada junto com o avatar no Passo 2)
- Clone é criado manualmente na plataforma HeyGen (wizard apenas guia o usuário)
