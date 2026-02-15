# Checklist de Validação End-to-End - Fase 4

## Objetivo
Validar que todas as funcionalidades migradas estão funcionando corretamente com o backend via API client.

## Pré-requisitos
- [ ] Backend rodando: `cd backend && uvicorn app.main:app --reload`
- [ ] Frontend rodando: `cd frontend && npm run dev`
- [ ] Variáveis de ambiente configuradas (VITE_API_URL, etc)

## Validações

### 1. Autenticação
- [ ] Login funciona corretamente
- [ ] Token JWT é armazenado e enviado nas requisições
- [ ] Logout funciona corretamente

### 2. Dashboard (Requirement 15.1)
- [ ] Página Dashboard carrega sem erros
- [ ] Estatísticas reais são exibidas (videos_total, posts_scheduled_month, posts_published_month, engagement_total)
- [ ] Lista de plataformas conectadas é exibida corretamente
- [ ] Não há chamadas diretas ao Supabase (verificar Network tab)

### 3. ScriptAI - Módulo 1 (Requirement 15.2)
- [ ] Página ScriptAI carrega sem erros
- [ ] Gerar script funciona via API backend
- [ ] Regenerar script funciona
- [ ] Salvar rascunho funciona
- [ ] Listar rascunhos funciona
- [ ] Carregar rascunho funciona
- [ ] Deletar rascunho funciona
- [ ] Não há chamadas diretas ao Supabase (verificar Network tab)

### 4. PostRápido - Módulo 2 (Requirement 15.3)
- [ ] Página PostRápido carrega sem erros
- [ ] Upload de vídeo funciona via API backend
- [ ] Transcrição é gerada automaticamente
- [ ] Descrições são geradas para múltiplas plataformas
- [ ] Agendamento de posts funciona
- [ ] Progress bar de upload funciona
- [ ] Não há upload direto para Supabase Storage (verificar Network tab)

### 5. AvatarAI - Módulo 3 (Requirement 15.4)
- [ ] Página AvatarAI carrega sem erros
- [ ] Geração de vídeo funciona via API backend
- [ ] Polling de status funciona
- [ ] Vídeo gerado é exibido corretamente
- [ ] Enviar para PostRápido funciona
- [ ] Não há chamadas diretas ao Supabase (verificar Network tab)

### 6. Settings - Integrations (Requirement 15.5)
- [ ] Página Settings carrega sem erros
- [ ] Seção HeyGen:
  - [ ] Configurar API key funciona
  - [ ] Testar conexão funciona
  - [ ] Créditos são exibidos corretamente
  - [ ] Listar avatares funciona
  - [ ] Listar vozes funciona
- [ ] Seção Metricool:
  - [ ] Testar conexão funciona
  - [ ] Status é exibido corretamente
  - [ ] **IMPORTANTE**: Palavra "Metricool" NÃO aparece na UI
- [ ] Seção Redes Sociais:
  - [ ] Lista de plataformas é exibida
  - [ ] Status de conexão (conectado/desconectado) é correto
  - [ ] Conectar rede social abre OAuth em nova janela
  - [ ] Polling atualiza status após OAuth
  - [ ] Desconectar rede social funciona

### 7. Calendar (Requirement 15.6)
- [ ] Página Calendar carrega sem erros
- [ ] Posts agendados são exibidos no calendário
- [ ] Filtros por plataforma funcionam
- [ ] Filtros por status funcionam
- [ ] Modal de detalhes abre ao clicar em post
- [ ] Reagendar post funciona
- [ ] Cancelar post funciona
- [ ] Não há chamadas diretas ao Supabase (verificar Network tab)

### 8. Navegação
- [ ] Todos os links do Sidebar funcionam
- [ ] Página Calendar está acessível via menu
- [ ] Não há erros 404 ao navegar

### 9. Console do Browser (Requirement 15.7)
- [ ] Não há erros no console
- [ ] Não há warnings críticos
- [ ] Não há chamadas diretas ao Supabase (exceto auth)
- [ ] Todas requisições HTTP usam o API client

### 10. Error Handling
- [ ] Erro 401 redireciona para login
- [ ] Erro 403 exibe toast apropriado
- [ ] Erro 404 exibe toast apropriado
- [ ] Erro 422 exibe detalhes de validação
- [ ] Erro 429 exibe mensagem de rate limit
- [ ] Erro 500+ exibe mensagem de erro do servidor
- [ ] Network errors exibem mensagem de conexão

## Problemas Encontrados

### Problema 1
**Descrição**: 
**Página**: 
**Severidade**: (Crítico/Alto/Médio/Baixo)
**Status**: (Pendente/Resolvido)

### Problema 2
**Descrição**: 
**Página**: 
**Severidade**: 
**Status**: 

## Conclusão

- [ ] Todas as validações passaram
- [ ] Sistema está pronto para produção
- [ ] Documentação está atualizada

**Data da validação**: ___/___/______
**Validado por**: _________________
