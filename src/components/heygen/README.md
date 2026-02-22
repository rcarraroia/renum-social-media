# Componentes HeyGen

Esta pasta contém os componentes relacionados à integração com HeyGen.

## Componentes

### HeyGenSetupWizard

Wizard de configuração HeyGen em 2 passos para conectar e configurar a integração.

#### Funcionalidades

**Passo 1: Validação de API Key** ✅
- Campo de API Key com toggle show/hide (Eye/EyeOff)
- Validação via endpoint `/api/integrations/heygen/validate-key`
- Estados: idle → loading → success → error
- Feedback visual com ícones e mensagens
- Link para criar conta no HeyGen
- Validação mínima de 10 caracteres
- Suporte a Enter para submeter

**Passo 2: Seleção de Avatar + Voz** 🚧
- Será implementado na Task 6
- Grid de avatares (clones + públicos)
- Seletor de voz integrado
- Card "Criar clone" com modal de guia

#### Props

```typescript
interface HeyGenSetupWizardProps {
  onComplete?: (data: { apiKey: string; avatarId: string; voiceId: string }) => void;
  onCancel?: () => void;
}
```

- `onComplete`: Callback chamado quando o wizard é concluído com sucesso
- `onCancel`: Callback chamado quando o usuário cancela o wizard

#### Uso Básico

```tsx
import HeyGenSetupWizard from "@/components/heygen/HeyGenSetupWizard";

function MyComponent() {
  const handleComplete = (data) => {
    console.log("Configuração salva:", data);
    // Salvar no banco, redirecionar, etc.
  };

  const handleCancel = () => {
    console.log("Cancelado");
    // Voltar para tela anterior
  };

  return (
    <HeyGenSetupWizard 
      onComplete={handleComplete} 
      onCancel={handleCancel} 
    />
  );
}
```

#### Estados de Validação

O componente gerencia 4 estados de validação:

1. **idle**: Estado inicial, aguardando input do usuário
2. **loading**: Validando API Key no backend
3. **success**: API Key válida, mostra créditos disponíveis
4. **error**: API Key inválida ou erro de rede

#### Feedback Visual

- **Loading**: Spinner animado + texto "Validando..."
- **Success**: Ícone de check verde + mensagem de sucesso + créditos
- **Error**: Ícone X vermelho + mensagem de erro específica

#### Validações

- API Key deve ter pelo menos 10 caracteres
- Validação em tempo real ao clicar em "Conectar"
- Suporte a Enter para submeter o formulário
- Botão desabilitado durante loading e após sucesso

#### Responsividade

- Layout adaptável para mobile, tablet e desktop
- Stepper horizontal responsivo
- Campos de formulário com largura 100%
- Espaçamento adequado em todas as resoluções

#### Acessibilidade

- Labels associados aos inputs
- Aria-labels nos botões de toggle
- Estados disabled apropriados
- Feedback visual e textual para todas as ações
- Suporte a navegação por teclado

### HeyGenSetupWizardDemo

Componente de demonstração que mostra como usar o HeyGenSetupWizard.

Útil para:
- Testar o wizard isoladamente
- Ver exemplos de uso
- Entender as props e callbacks

#### Uso

```tsx
import HeyGenSetupWizardDemo from "@/components/heygen/HeyGenSetupWizardDemo";

// Em uma rota de teste ou página de desenvolvimento
<HeyGenSetupWizardDemo />
```

## Integração com Backend

O wizard se comunica com o endpoint:

```
POST /api/integrations/heygen/validate-key
```

**Request:**
```json
{
  "api_key": "string (min 10 chars)"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "credits_remaining": 150.5,
  "plan": "pro"
}
```

**Response (Error):**
```json
{
  "valid": false,
  "error": "API Key inválida. Verifique suas credenciais."
}
```

## Próximos Passos

- [ ] Task 6: Implementar Passo 2 (Avatar + Voz)
- [ ] Task 6: Criar componente HeyGenCloneGuide (modal)
- [ ] Task 6: Integrar com endpoints de avatares e vozes
- [ ] Task 8: Integrar wizard no Module3.tsx

## Testes

Testes unitários (Task 5.2 - opcional):
- [ ] Toggle show/hide password
- [ ] Validação de API Key
- [ ] Estados de loading e erro
- [ ] Navegação entre passos

## Dependências

- `lucide-react`: Ícones (Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink)
- `@/utils/toast`: Notificações (showError, showSuccess)
- Tailwind CSS: Estilização

## Estrutura de Arquivos

```
src/components/heygen/
├── HeyGenSetupWizard.tsx       # Componente principal do wizard
├── HeyGenSetupWizardDemo.tsx   # Componente de demonstração
└── README.md                    # Esta documentação
```

## Notas de Implementação

- O wizard usa state management local (useState)
- Validação assíncrona com fetch API
- Timeout de 1 segundo antes de avançar para Passo 2 (UX)
- Passo 2 é um placeholder que será implementado na Task 6
- Stepper visual mostra progresso e estado de cada passo
- Componente totalmente controlado (controlled component)

## Requisitos Atendidos

- ✅ Requirement 2 (Wizard de Configuração) - AC 1, 2, 3, 4, 5
- ✅ Requirement 3 (Validação de API Key) - AC 1, 3, 4, 5
- ✅ Requirement 9 (Feedback Visual) - AC 1, 2, 3, 4
- ✅ Requirement 10 (Responsividade) - AC 1, 2, 3, 4, 5, 6, 7
