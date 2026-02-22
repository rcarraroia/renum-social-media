# Testes E2E - Playwright

Este diretório contém os testes end-to-end (E2E) da aplicação usando Playwright.

## Estrutura de Testes

- `auth.spec.ts` - Testes de autenticação (login, registro, logout)
- `navigation.spec.ts` - Testes de navegação entre páginas
- `onboarding.spec.ts` - Testes do fluxo de onboarding simplificado (3 passos)
- `post-creation.spec.ts` - Testes de criação de posts
- `video-upload.spec.ts` - Testes de upload de vídeos

## Como Executar

### Executar todos os testes

```bash
npm run test:e2e
```

### Executar com interface visual

```bash
npm run test:e2e:ui
```

### Executar em modo headed (ver o navegador)

```bash
npm run test:e2e:headed
```

### Executar um arquivo específico

```bash
npx playwright test e2e/onboarding.spec.ts
```

### Executar um teste específico

```bash
npx playwright test e2e/onboarding.spec.ts -g "deve exibir 3 passos no stepper"
```

## Testes de Onboarding

O arquivo `onboarding.spec.ts` contém testes abrangentes para o fluxo de onboarding simplificado:

### Cobertura de Testes

1. **Estrutura do Stepper**
   - Verifica que existem exatamente 3 passos
   - Valida que não há referências ao Avatar AI no stepper

2. **Passo 1: Perfil**
   - Preenchimento de nome completo
   - Seleção de público-alvo
   - Seleção de perfis profissionais
   - Possibilidade de pular o passo

3. **Passo 2: Conectar Redes**
   - Exibição de plataformas sociais
   - Navegação (voltar e avançar)
   - Possibilidade de pular o passo

4. **Passo 3: Pronto**
   - Exibição de resumo
   - Mensagem sobre configurar Avatar AI depois
   - Redirecionamento para dashboard

5. **Validações Críticas**
   - Não há campos de HeyGen no onboarding
   - Não há mais de uma menção informativa ao HeyGen
   - Fluxo completo funciona corretamente
   - Progresso é persistido entre passos

### Requisitos Validados

- ✅ Requirement 1 (Onboarding Simplificado) - AC 1, 2, 4
- ✅ Fluxo de 3 passos: Perfil → Conectar Redes → Pronto
- ✅ HeyGen removido do onboarding
- ✅ Navegação entre passos funcional
- ✅ Possibilidade de pular passos

## Configuração

A configuração do Playwright está em `playwright.config.ts` na raiz do projeto.

### Navegadores Testados

- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

### URL Base

- Desenvolvimento: `http://localhost:5173`

## Debugging

### Ver relatório HTML

Após executar os testes, você pode ver o relatório HTML:

```bash
npx playwright show-report
```

### Modo debug

```bash
npx playwright test --debug
```

### Ver traces

```bash
npx playwright show-trace trace.zip
```

## Boas Práticas

1. **Seletores**: Use seletores semânticos (role, label, text) ao invés de classes CSS
2. **Esperas**: Use `expect().toBeVisible()` ao invés de `waitFor()`
3. **Isolamento**: Cada teste deve ser independente
4. **Limpeza**: Use `beforeEach` para setup e garantir estado limpo
5. **Asserções**: Seja específico nas asserções para facilitar debugging

## Troubleshooting

### Testes falhando localmente

1. Certifique-se de que o servidor de desenvolvimento está rodando:
   ```bash
   npm run dev
   ```

2. Limpe o cache do Playwright:
   ```bash
   npx playwright install
   ```

3. Execute em modo headed para ver o que está acontecendo:
   ```bash
   npm run test:e2e:headed
   ```

### Testes lentos

- Use `fullyParallel: true` no config (já configurado)
- Execute apenas os testes necessários durante desenvolvimento
- Use `test.only()` para focar em um teste específico

## CI/CD

Os testes E2E são executados automaticamente no CI com:
- 2 tentativas em caso de falha
- 1 worker (execução sequencial para estabilidade)
- Screenshots apenas em falhas
- Traces na primeira tentativa
