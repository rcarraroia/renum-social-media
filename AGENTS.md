# AGENTS.md

## ⚠️ ATENÇÃO - RESPOSTAS SEMPRE EM PORTUGUÊS-BR

## Idioma / Language
- Todas as suas respostas, relatórios, documentação e comentários devem ser em português brasileiro (PT-BR). Isso inclui nomes de tasks, mensagens de status, explicações e qualquer comunicação.
- Inglês apenas dentro de código (variáveis, funções, comentários técnicos inline).

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS DE DESENVOLVIMENTO

### **1. FUNCIONALIDADE SOBRE TESTES**
A funcionalidade completa do sistema SEMPRE tem prioridade absoluta sobre testes que passam.

### **2. ANÁLISE ANTES DE IMPLEMENTAÇÃO**
Toda implementação DEVE ser precedida de análise preventiva completa.

### **3. EFICIÊNCIA NO TEMPO**
Limites de tempo obrigatórios para evitar loops improdutivos.

### **4. CORRIGIR PROBLEMAS, NÃO CONTORNÁ-LOS**
NUNCA comentar código, remover funcionalidades ou simplificar para fazer build passar. SEMPRE corrigir o problema real.

### **5. DOCUMENTAÇÃO CONSOLIDADA**
Não crie múltiplos documentos sobre o mesmo assunto. Se precisar documentar algo, crie UM único arquivo consolidado. Nunca crie versões separadas como 'checklist', 'quick reference', 'architecture' e 'setup' para o mesmo tema — coloque tudo em um só lugar, na pasta docs de cada diretório.

---

## 📋 REGRA 1: ANÁLISE PREVENTIVA OBRIGATÓRIA

### **PROCESSO OBRIGATÓRIO ANTES DE QUALQUER IMPLEMENTAÇÃO:**

#### **1. ANÁLISE PRÉ-IMPLEMENTAÇÃO (5-10 minutos)**
```
ANTES DE ESCREVER QUALQUER CÓDIGO:

□ Ler TODOS os arquivos relacionados à tarefa
□ Entender EXATAMENTE o que precisa ser implementado
□ Identificar dependências e integrações necessárias
□ Verificar padrões de código existentes no projeto
□ Identificar possíveis pontos de erro ANTES de implementar
□ Planejar estrutura de arquivos e funções
□ Definir estratégia de testes ANTES de implementar
```

#### **2. IMPLEMENTAÇÃO FOCADA (15-30 minutos)**
```
COM BASE NA ANÁLISE:

□ Implementar seguindo exatamente o planejado
□ Usar padrões já estabelecidos no projeto
□ Seguir estruturas similares de arquivos existentes
□ Implementar com tratamento de erros desde o início
□ Não improvisar - seguir o plano da análise
```

#### **3. TESTE EFICIENTE (5-15 minutos)**
```
TESTES DIRECIONADOS:

□ Testar apenas o que foi implementado
□ Máximo 2 tentativas de correção
□ Se não funcionar na 2ª tentativa = voltar à análise
□ Não ficar em loop de teste-correção-teste
□ Reportar problemas reais ao usuário se persistirem
```

### **⏱️ LIMITES DE TEMPO OBRIGATÓRIOS:**
- **Análise Preventiva:** 10 minutos máximo
- **Implementação:** 30 minutos máximo
- **Testes:** 15 minutos máximo
- **TOTAL POR TAREFA:** 55 minutos máximo

### **REGRAS DE TEMPO:**
- ✅ Se análise levar mais de 10 min = perguntar ao usuário
- ✅ Se implementação levar mais de 30 min = revisar análise
- ✅ Se testes levarem mais de 15 min = reportar problema
- ❌ NUNCA gastar mais de 1 hora em uma única tarefa

---

## 🚫 REGRA 2: FUNCIONALIDADE SOBRE TESTES

### **HIERARQUIA DE PRIORIDADES (INEGOCIÁVEL):**

1. **🥇 PRIORIDADE MÁXIMA:** Sistema funcionando 100% como projetado
2. **🥈 PRIORIDADE ALTA:** Correção de problemas técnicos (imports, dependências)
3. **🥉 PRIORIDADE MÉDIA:** Testes passando COM funcionalidade completa
4. **🏅 PRIORIDADE BAIXA:** Documentação e otimizações

### **❌ COMPORTAMENTOS ABSOLUTAMENTE PROIBIDOS:**

1. **NUNCA simplificar código para passar em testes**
   - Remover funcionalidades para evitar erros de teste
   - Criar versões "esqueleto" sem funcionalidade real
   - Substituir implementações completas por mockups
   - Desabilitar serviços para evitar dependências

2. **NUNCA comentar código para fazer build passar**
   - Comentar imports que estão faltando
   - Comentar routers que têm dependências
   - Desabilitar funcionalidades para evitar erros
   - Criar "atalhos" ao invés de corrigir problemas

3. **NUNCA priorizar testes sobre funcionalidade**
   - Aceitar que "teste passa = sistema funciona"
   - Reportar sucesso baseado apenas em testes
   - Ignorar funcionalidades perdidas se teste passa
   - Criar ilusão de funcionamento através de testes

4. **NUNCA comprometer arquitetura por testes**
   - Quebrar integrações para evitar erros
   - Remover dependências necessárias
   - Simplificar lógica complexa mas essencial
   - Descaracterizar o sistema projetado

### **✅ COMPORTAMENTOS OBRIGATÓRIOS:**

1. **SEMPRE manter funcionalidade completa**
   - Preservar TODAS as funcionalidades projetadas
   - Manter integrações entre serviços
   - Garantir que o sistema funciona como especificado
   - Resolver problemas técnicos SEM remover funcionalidades

2. **SEMPRE corrigir problemas técnicos corretamente**
   - Se falta arquivo: CRIAR o arquivo
   - Se falta dependência: INSTALAR a dependência
   - Se há import circular: REFATORAR a estrutura
   - Se há erro de sintaxe: CORRIGIR o código
   - NUNCA comentar ou remover código como solução

3. **SEMPRE usar testes como validação, não como objetivo**
   - Testes devem validar funcionalidades existentes
   - Se teste falha, corrigir o teste OU o código
   - Nunca remover funcionalidade para fazer teste passar
   - Testes devem refletir o sistema real, não o contrário

---

## 🔄 PROCESSO DE CORREÇÃO DE PROBLEMAS

### **QUANDO ENCONTRAR PROBLEMAS:**

1. **IDENTIFICAR O PROBLEMA REAL**
   - Arquivo faltando? → CRIAR o arquivo
   - Import circular? → REFATORAR imports
   - Dependência faltando? → INSTALAR dependência
   - Conflito de versão? → ATUALIZAR versões
   - Arquitetura inadequada? → REORGANIZAR código

2. **BUSCAR SOLUÇÃO QUE PRESERVE FUNCIONALIDADE**
   - Refatorar imports
   - Corrigir configurações
   - Atualizar dependências
   - Reorganizar código
   - Criar arquivos faltantes

3. **IMPLEMENTAR CORREÇÃO**
   - Manter TODAS as funcionalidades
   - Preservar integrações
   - Manter arquitetura
   - Corrigir problema técnico

4. **VALIDAR RESULTADO**
   - Sistema funciona como projetado?
   - Funcionalidades preservadas?
   - Integrações mantidas?
   - SÓ ENTÃO verificar testes

### **LIMITES DE TENTATIVAS:**
- ✅ Máximo 2 tentativas de correção
- ✅ Se não funcionar na 2ª tentativa = reportar ao usuário
- ❌ NUNCA ficar em loop de teste-correção por mais de 30 minutos

---

## 🚫 REGRA 3: PROIBIÇÃO DE ESTIMATIVAS E CRONOGRAMAS IRREAIS

### **COMPORTAMENTOS ABSOLUTAMENTE PROIBIDOS:**

1. **NUNCA apresentar estimativas de tempo**
   - Horas estimadas para fases/etapas/tarefas
   - Datas de início e fim de fases
   - Prazos finais calculados
   - Cronogramas com previsão temporal

2. **NUNCA apresentar estimativas de custos**
   - Valores por hora de desenvolvimento
   - Custos totais de fases
   - Orçamentos de projeto
   - Cálculos de ROI ou payback

3. **NUNCA criar ilusão de previsibilidade**
   - Cronogramas detalhados com datas
   - Gantt charts com prazos
   - Roadmaps com timelines
   - Promessas de entrega

### **✅ FORMATO CORRETO PARA DOCUMENTOS:**

#### **CRONOGRAMAS PERMITIDOS:**
```markdown
## FASES DO PROJETO

### Fase 1: Fundação
**Objetivo:** Habilitar funcionalidade básica

**Tarefas:**
- [ ] Configurar Supabase Storage
- [ ] Criar migration do banco
- [ ] Implementar endpoint de upload
- [ ] Criar componente de upload

**Entregável:** Upload de imagens funcionando
```

#### **❌ FORMATO PROIBIDO:**
```markdown
## CRONOGRAMA (PROIBIDO!)

| Fase | Duração | Início | Fim | Custo |
|------|---------|--------|-----|-------|
| Fase 1 | 16h | 17/02 | 19/02 | R$ 2.400 |
```

---

## 🗄️ REGRA 4: ANÁLISE OBRIGATÓRIA DO BANCO DE DADOS REAL

### **COMPORTAMENTOS OBRIGATÓRIOS:**

1. **SEMPRE usar Supabase Power para análise de banco**
   - Consultar schema real via `list_tables`
   - Verificar políticas RLS via SQL
   - Checar dados reais via `execute_sql`
   - Validar estrutura atual do banco

2. **NUNCA confiar apenas em arquivos de migration**
   - Migrations podem não ter sido executadas
   - Migrations podem ter falhado parcialmente
   - Schema real pode divergir dos arquivos
   - Dados reais podem ter estrutura diferente

3. **SEMPRE validar antes de qualquer análise/auditoria**
   - Conectar no Supabase via Power
   - Listar tabelas reais
   - Verificar colunas e tipos
   - Checar constraints e índices
   - Validar políticas RLS

---

## 📊 CRITÉRIOS DE AVALIAÇÃO

### **SISTEMA ACEITÁVEL:**
- ✅ Funcionalidade completa como projetada
- ✅ Todas as integrações funcionando
- ✅ Arquitetura preservada
- ✅ Dentro dos limites de tempo
- ✅ Problemas técnicos CORRIGIDOS (não contornados)
- ⚠️ Alguns testes podem falhar temporariamente

### **SISTEMA INACEITÁVEL:**
- ❌ Funcionalidades removidas para passar em testes
- ❌ Código comentado para fazer build passar
- ❌ Integrações quebradas ou removidas
- ❌ Arquitetura comprometida
- ❌ "Esqueleto" sem funcionalidade real
- ❌ Mais de 1 hora gasta em uma única tarefa
- ❌ Problemas contornados ao invés de corrigidos

---

## ✅ CHECKLIST OBRIGATÓRIO

### **ANTES DE CADA TAREFA:**
- [ ] Li todos os arquivos relacionados?
- [ ] Entendi exatamente o que implementar?
- [ ] Identifiquei padrões existentes para seguir?
- [ ] Planejei a estrutura de implementação?
- [ ] Identifiquei possíveis pontos de erro?
- [ ] Defini estratégia de teste?

### **DURANTE A IMPLEMENTAÇÃO:**
- [ ] Estou seguindo o plano da análise?
- [ ] Estou usando padrões existentes?
- [ ] Estou implementando tratamento de erros?
- [ ] Estou dentro do limite de tempo?
- [ ] Estou preservando TODAS as funcionalidades?
- [ ] Estou CORRIGINDO problemas, não contornando?

### **ANTES DE QUALQUER ALTERAÇÃO:**
- [ ] Esta alteração remove alguma funcionalidade projetada?
- [ ] Esta alteração quebra alguma integração essencial?
- [ ] Esta alteração compromete a arquitetura do sistema?
- [ ] Estou comentando código ao invés de corrigir o problema?
- [ ] Estou fazendo isso apenas para um teste passar?
- [ ] O sistema continuará funcionando como projetado?

**SE QUALQUER RESPOSTA FOR "SIM" PARA AS 5 PRIMEIRAS OU "NÃO" PARA A ÚLTIMA:**
**❌ NÃO FAZER A ALTERAÇÃO - CORRIGIR O PROBLEMA REAL**

---

## 🎯 COMPROMISSO DE EFICIÊNCIA E QUALIDADE

**EU, KIRO AI, ME COMPROMETO A:**

1. ✅ **SEMPRE fazer análise preventiva antes de implementar**
2. ✅ **NUNCA gastar mais de 1 hora em uma única tarefa**
3. ✅ **PARAR após 2 tentativas de correção e reportar problemas**
4. ✅ **FOCAR em progresso real ao invés de perfeição em testes**
5. ✅ **USAR padrões existentes ao invés de reinventar**
6. ✅ **SER eficiente e produtivo, não perfeccionista**
7. ✅ **NUNCA simplificar código para passar em testes**
8. ✅ **SEMPRE preservar funcionalidades completas do sistema**
9. ✅ **CORRIGIR problemas técnicos sem comprometer arquitetura**
10. ✅ **PRIORIZAR sistema funcionando sobre testes passando**
11. ✅ **NUNCA comentar código para fazer build passar**
12. ✅ **SEMPRE criar arquivos faltantes ao invés de comentar imports**
13. ✅ **NUNCA apresentar estimativas de tempo ou custo**
14. ✅ **SEMPRE verificar banco de dados real via Supabase Power**
15. ✅ **NUNCA confiar apenas em arquivos de migration**

---

## 📝 EXEMPLOS PRÁTICOS

### **EXEMPLO 1: Import falhando por arquivo faltando**

#### ❌ **ABORDAGEM PROIBIDA:**
```python
# Comentar o import para fazer build passar
# from app.api.routes import leads
```

#### ✅ **ABORDAGEM CORRETA:**
```python
# 1. Identificar o que está faltando
# 2. Criar app/database.py com get_db()
# 3. Criar app/models/leads.py com LeadCreate e LeadResponse
# 4. Manter o import funcionando
from app.api.routes import leads
```

### **EXEMPLO 2: Teste falhando por import circular**

#### ❌ **ABORDAGEM PROIBIDA:**
```
"Vou simplificar o serviço removendo dependências 
para o teste passar"
```

#### ✅ **ABORDAGEM CORRETA:**
```
1. Análise (5 min): Identificar imports circulares específicos
2. Implementação (20 min): Refatorar imports mantendo funcionalidades
3. Teste (10 min): Validar que tudo funciona
```

---

## Dev environment tips
- Install dependencies with `npm install` before running scaffolds.
- Use `npm run dev` for the interactive TypeScript session that powers local experimentation.
- Run `npm run build` to refresh the CommonJS bundle in `dist/` before shipping changes.
- Store generated artefacts in `.context/` so reruns stay deterministic.

## Testing instructions
- Execute `npm run test` to run the Jest suite.
- Append `-- --watch` while iterating on a failing spec.
- Trigger `npm run build && npm run test` before opening a PR to mimic CI.
- Add or update tests alongside any generator or CLI changes.

## PR instructions
- Follow Conventional Commits (for example, `feat(scaffolding): add doc links`).
- Cross-link new scaffolds in `docs/README.md` and `agents/README.md` so future agents can find them.
- Attach sample CLI output or generated markdown when behaviour shifts.
- Confirm the built artefacts in `dist/` match the new source changes.

## Repository map
- `AI_RULES.md/` — explain what lives here and when agents should edit it.
- `components.json/` — explain what lives here and when agents should edit it.
- `eslint.config.js/` — explain what lives here and when agents should edit it.
- `index.html/` — explain what lives here and when agents should edit it.
- `install-mcp-dependencies.ps1/` — explain what lives here and when agents should edit it.
- `MCP_SETUP.md/` — explain what lives here and when agents should edit it.
- `package-lock.json/` — explain what lives here and when agents should edit it.
- `package.json/` — explain what lives here and when agents should edit it.

## AI Context References
- Documentation index: `.context/docs/README.md`
- Agent playbooks: `.context/agents/README.md`
- Contributor guide: `CONTRIBUTING.md`

---

**ESTAS REGRAS SÃO PERMANENTES, INEGOCIÁVEIS E IRREVOGÁVEIS.**

**A FUNCIONALIDADE COMPLETA DO SISTEMA É SAGRADA.**

**TESTES SÃO FERRAMENTAS, NÃO OBJETIVOS.**

**CORRIGIR PROBLEMAS, NÃO CONTORNÁ-LOS.**

**PROGRESSO REAL É MAIS IMPORTANTE QUE PERFEIÇÃO EM TESTES.**

---

## 🧰 FERRAMENTAS DISPONÍVEIS PARA EXECUÇÃO DE TAREFAS

### **IMPORTANTE: SEMPRE CONSULTE ESTAS FERRAMENTAS ANTES DE INICIAR QUALQUER TAREFA**

Esta seção lista TODAS as ferramentas, agentes, workflows, skills e powers disponíveis para você executar tarefas de forma eficiente e profissional.

---

## 📦 KIRO POWERS (MCP SERVERS)

### **REGRA CRÍTICA: SEMPRE VERIFIQUE OS POWERS DISPONÍVEIS**

Você tem acesso a vários Powers (MCP Servers) que fornecem funcionalidades especializadas. **SEMPRE consulte os powers disponíveis ANTES de implementar soluções manualmente.**

### **Powers Instalados:**

#### **1. Supabase Power** 🔥 **MAIS IMPORTANTE**
**Keywords:** database, postgres, auth, storage, realtime, backend, supabase, rls

**Quando usar:**
- ✅ Consultar schema do banco de dados
- ✅ Executar queries SQL
- ✅ Verificar políticas RLS
- ✅ Listar tabelas e colunas
- ✅ Validar estrutura do banco ANTES de qualquer análise/auditoria

**Como ativar:**
```
Usar kiroPowers tool com action="activate" e powerName="supabase-hosted"
```

**REGRA OBRIGATÓRIA (do AGENTS.md):**
- SEMPRE usar Supabase Power para análise de banco
- NUNCA confiar apenas em arquivos de migration
- SEMPRE validar schema real antes de auditorias

#### **2. Vercel Power**
**Keywords:** vercel, deploy, deployment, hosting, serverless

**Quando usar:**
- ✅ Listar projetos Vercel
- ✅ Verificar deployments
- ✅ Consultar logs de build/runtime
- ✅ Obter informações de domínios

#### **3. Stripe Power**
**Keywords:** stripe, payments, checkout, subscriptions, billing

**Quando usar:**
- ✅ Gerenciar pagamentos
- ✅ Criar/listar produtos
- ✅ Gerenciar assinaturas
- ✅ Processar refunds

#### **4. Postman Power**
**Keywords:** postman, api, testing, collections, rest, http

**Quando usar:**
- ✅ Testar APIs
- ✅ Criar coleções de testes
- ✅ Gerenciar ambientes de teste

#### **5. Tavily Power**
**Keywords:** search, web, research, crawl, extract

**Quando usar:**
- ✅ Buscar informações na web
- ✅ Extrair conteúdo de URLs
- ✅ Fazer pesquisas especializadas

#### **6. HeyGen Power**
**Keywords:** heygen, video, avatar, ai-video

**Quando usar:**
- ✅ Gerar vídeos com avatares
- ✅ Consultar créditos HeyGen
- ✅ Listar avatares/vozes disponíveis

---

## 🤖 AGENTES ESPECIALIZADOS

**Localização:** `.context/agents/`

Agentes são personas especializadas com conhecimento profundo em áreas específicas. Use-os como referência ou delegue tarefas complexas.

### **Lista de Agentes Disponíveis:**

1. **architect-specialist.md**
   - Arquitetura de software
   - Design de sistemas
   - Padrões arquiteturais

2. **backend-specialist.md**
   - APIs REST/GraphQL
   - Lógica de negócio
   - Integrações backend

3. **bug-fixer.md**
   - Debugging sistemático
   - Correção de bugs
   - Análise de root cause

4. **code-reviewer.md**
   - Revisão de código
   - Qualidade de código
   - Best practices

5. **database-specialist.md**
   - Schema design
   - Queries SQL
   - Otimização de banco

6. **devops-specialist.md**
   - CI/CD
   - Docker/Kubernetes
   - Deploy e infraestrutura

7. **documentation-writer.md**
   - Documentação técnica
   - READMEs
   - Guias de uso

8. **feature-developer.md** ⭐
   - Desenvolvimento end-to-end
   - UI → Services → Integration
   - Padrão principal do projeto

9. **frontend-specialist.md**
   - React/TypeScript
   - UI/UX
   - State management

10. **mobile-specialist.md**
    - Apps mobile
    - Responsive design
    - PWA

11. **performance-optimizer.md**
    - Otimização de performance
    - Profiling
    - Caching

12. **refactoring-specialist.md**
    - Refatoração de código
    - Clean code
    - Melhoria de arquitetura

13. **security-auditor.md**
    - Auditoria de segurança
    - Vulnerabilidades
    - Best practices de segurança

14. **test-writer.md**
    - Testes unitários
    - Testes de integração
    - TDD/BDD

**Como usar:**
```markdown
Consulte `.context/agents/[nome-do-agente].md` para obter orientações específicas
```

---

## 🔄 WORKFLOWS DISPONÍVEIS

**Localização:** `.agent/workflows/`

Workflows são comandos especializados que ativam modos específicos de trabalho.

### **Lista de Workflows:**

1. **brainstorm.md**
   - Geração de ideias
   - Exploração de soluções
   - Análise de alternativas

2. **create.md**
   - Criação de novos recursos
   - Scaffolding de código
   - Geração de estruturas

3. **debug.md** ⭐
   - Debugging sistemático
   - Investigação de problemas
   - Root cause analysis

4. **deploy.md**
   - Preparação para deploy
   - Validação pré-deploy
   - Checklist de deploy

5. **enhance.md**
   - Melhorias de código
   - Otimizações
   - Refatorações

6. **orchestrate.md**
   - Coordenação de tarefas
   - Planejamento de execução
   - Delegação de trabalho

7. **plan.md**
   - Planejamento de features
   - Análise de requisitos
   - Definição de escopo

8. **preview.md**
   - Visualização de mudanças
   - Review de código
   - Validação de implementação

9. **status.md**
   - Status de tarefas
   - Progresso de features
   - Relatórios

10. **test.md**
    - Execução de testes
    - Criação de testes
    - Validação de qualidade

11. **ui-ux-pro-max.md**
    - Design UI/UX avançado
    - Padrões de interface
    - Acessibilidade

**Como usar:**
```markdown
Leia `.agent/workflows/[nome-do-workflow].md` para ativar o modo específico
```

---

## 🎯 SKILLS DISPONÍVEIS

**Localização:** `.agent/skills/` e `.agents/skills/`

Skills são metodologias e técnicas especializadas que você pode ativar para executar tarefas específicas.

### **Lista de Skills:**

1. **systematic-debugging/** ⭐
   - Metodologia de 4 fases
   - Root cause analysis
   - Debugging estruturado
   - **Use quando:** enfrentar bugs complexos

2. **tailwind-patterns/**
   - Padrões Tailwind CSS
   - Design system
   - Componentes estilizados
   - **Use quando:** trabalhar com UI/CSS

3. **tdd-workflow/**
   - Test-Driven Development
   - Red-Green-Refactor
   - Testes primeiro
   - **Use quando:** criar features com TDD

4. **testing-patterns/**
   - Padrões de teste
   - Mocks e stubs
   - Test fixtures
   - **Use quando:** escrever testes

5. **vulnerability-scanner/**
   - Scan de vulnerabilidades
   - Análise de segurança
   - Checklists de segurança
   - **Use quando:** fazer auditorias de segurança

6. **web-design-guidelines/**
   - Guidelines de design
   - Acessibilidade
   - UX best practices
   - **Use quando:** criar/revisar UI

7. **webapp-testing/**
   - Testes E2E
   - Playwright
   - Testes de integração
   - **Use quando:** testar aplicação completa

8. **ui-ux-pro-max/** (em `.agents/skills/`)
   - Design UI/UX avançado
   - Padrões modernos
   - Acessibilidade WCAG
   - **Use quando:** criar interfaces profissionais

**Como ativar:**
```markdown
Leia `.agent/skills/[nome-do-skill]/SKILL.md` para ativar a metodologia
```

---

## 📚 DOCUMENTAÇÃO DO PROJETO

**Localização:** `.context/docs/`

Documentação centralizada sobre o projeto RENUM.

### **Documentos Disponíveis:**

1. **architecture.md**
   - Arquitetura do sistema
   - Componentes principais
   - Fluxo de dados

2. **codebase-map.json**
   - Mapa do código
   - Estrutura de diretórios
   - Dependências

3. **data-flow.md**
   - Fluxo de dados
   - Integrações
   - APIs

4. **development-workflow.md**
   - Workflow de desenvolvimento
   - Git flow
   - Processo de PR

5. **glossary.md**
   - Glossário de termos
   - Definições
   - Convenções

6. **project-overview.md**
   - Visão geral do projeto
   - Objetivos
   - Roadmap

7. **security.md**
   - Práticas de segurança
   - Políticas
   - Compliance

8. **testing-strategy.md**
   - Estratégia de testes
   - Tipos de testes
   - Cobertura

9. **tooling.md**
   - Ferramentas utilizadas
   - Configurações
   - Setup

---

## 🎬 PROCESSO DE EXECUÇÃO DE TAREFAS

### **ANTES DE INICIAR QUALQUER TAREFA:**

1. **Consulte os Powers disponíveis**
   - Especialmente Supabase Power para tarefas de banco
   - Vercel Power para tarefas de deploy
   - Tavily Power para pesquisas

2. **Identifique o agente apropriado**
   - Backend? → `backend-specialist.md`
   - Frontend? → `frontend-specialist.md`
   - Bug? → `bug-fixer.md`
   - Deploy? → `devops-specialist.md`

3. **Ative o workflow correto**
   - Debugging? → `debug.md`
   - Nova feature? → `create.md`
   - Deploy? → `deploy.md`

4. **Use o skill apropriado**
   - Bug complexo? → `systematic-debugging`
   - Auditoria? → `vulnerability-scanner`
   - Testes? → `testing-patterns`

5. **Consulte a documentação**
   - Arquitetura? → `.context/docs/architecture.md`
   - Fluxo de dados? → `.context/docs/data-flow.md`

---

## ⚠️ LEMBRETES CRÍTICOS

### **SUPABASE POWER - NUNCA ESQUEÇA!**

```
❌ ERRADO: Analisar banco apenas olhando arquivos de migration
✅ CORRETO: Usar Supabase Power para consultar schema real

❌ ERRADO: Assumir estrutura do banco
✅ CORRETO: Validar com list_tables e execute_sql

❌ ERRADO: Confiar em documentação desatualizada
✅ CORRETO: Consultar banco real via Power
```

### **SYSTEMATIC DEBUGGING - USE SEMPRE!**

```
❌ ERRADO: Tentar correções aleatórias
✅ CORRETO: Seguir metodologia de 4 fases

❌ ERRADO: Comentar código para fazer funcionar
✅ CORRETO: Identificar root cause e corrigir

❌ ERRADO: Assumir causa do problema
✅ CORRETO: Investigar com evidências
```

### **FEATURE DEVELOPER - PADRÃO DO PROJETO**

```
❌ ERRADO: Criar arquitetura nova
✅ CORRETO: Seguir padrões existentes em feature-developer.md

❌ ERRADO: Duplicar código
✅ CORRETO: Reutilizar componentes UI existentes

❌ ERRADO: Lógica de negócio na UI
✅ CORRETO: Manter em src/services/
```

---

## 📖 EXEMPLOS DE USO

### **Exemplo 1: Auditoria de Segurança**

```markdown
1. Ativar Supabase Power
   → Consultar schema real do banco
   → Verificar políticas RLS

2. Consultar vulnerability-scanner skill
   → Seguir checklist de segurança
   → Aplicar metodologia de scan

3. Consultar security-auditor agent
   → Seguir padrões de auditoria
   → Gerar relatório estruturado
```

### **Exemplo 2: Correção de Bug Complexo**

```markdown
1. Ativar debug workflow
   → Entrar em modo de debugging

2. Usar systematic-debugging skill
   → Fase 1: Reproduzir
   → Fase 2: Isolar
   → Fase 3: Entender (root cause)
   → Fase 4: Corrigir e verificar

3. Consultar bug-fixer agent
   → Seguir best practices de correção
```

### **Exemplo 3: Nova Feature End-to-End**

```markdown
1. Consultar feature-developer agent
   → Entender padrões do projeto
   → Identificar arquivos a modificar

2. Ativar create workflow
   → Modo de criação de features

3. Seguir estrutura:
   → Services em src/services/
   → UI em src/components/
   → Reutilizar primitives de src/components/ui/
```

### **Exemplo 4: Deploy no Easypanel**

```markdown
1. Ativar deploy workflow
   → Modo de preparação para deploy

2. Consultar devops-specialist agent
   → Seguir checklist de deploy

3. Usar Vercel Power (se aplicável)
   → Verificar variáveis de ambiente
   → Consultar logs de deploy

4. Validar com Supabase Power
   → Confirmar schema do banco
   → Verificar políticas RLS
```

---

**Data de Criação:** 15/02/2026  
**Última Atualização:** 20/02/2026  
**Status:** ATIVO E OBRIGATÓRIO  
**Aplicação:** IMEDIATA - todas as implementações futuras
