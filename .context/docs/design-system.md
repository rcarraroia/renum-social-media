# Design System

Este documento descreve o design system do projeto RENUM, baseado em **shadcn/ui** + **Tailwind CSS** com variáveis CSS customizadas.

---

## Visão Geral

O design system do projeto é composto por:

1. **Variáveis CSS** definidas em `src/globals.css` (cores, espaçamentos, bordas)
2. **Componentes UI** reutilizáveis em `src/components/ui/` (baseados em shadcn/ui)
3. **Configuração Tailwind** em `tailwind.config.ts` (tema, cores, animações)
4. **Utilitário `cn`** em `src/lib/utils.ts` (composição de classes CSS)

---

## 1. Variáveis CSS (Tokens de Design)

Todas as cores e tokens de design são definidos como variáveis CSS em `src/globals.css`. Isso permite:
- Consistência visual em todo o projeto
- Suporte a tema claro/escuro
- Fácil manutenção e customização

### Cores Principais

#### Background e Foreground
```css
--background: 0 0% 100%;           /* Fundo principal (branco) */
--foreground: 222.2 84% 4.9%;      /* Texto principal (quase preto) */
```

#### Card
```css
--card: 0 0% 100%;                 /* Fundo de cards (branco) */
--card-foreground: 222.2 84% 4.9%; /* Texto em cards */
```

#### Primary (Cor principal da marca)
```css
--primary: 222.2 47.4% 11.2%;      /* Cor primária (azul escuro) */
--primary-foreground: 210 40% 98%; /* Texto sobre cor primária (branco) */
```

#### Secondary
```css
--secondary: 210 40% 96.1%;        /* Cor secundária (cinza claro) */
--secondary-foreground: 222.2 47.4% 11.2%; /* Texto sobre secundária */
```

#### Muted (Elementos desabilitados/secundários)
```css
--muted: 210 40% 96.1%;            /* Fundo de elementos muted */
--muted-foreground: 215.4 16.3% 46.9%; /* Texto muted (cinza médio) */
```

#### Accent (Destaque/hover)
```css
--accent: 210 40% 96.1%;           /* Fundo de elementos em destaque */
--accent-foreground: 222.2 47.4% 11.2%; /* Texto sobre accent */
```

#### Destructive (Erros/ações destrutivas)
```css
--destructive: 0 84.2% 60.2%;      /* Cor de erro (vermelho) */
--destructive-foreground: 210 40% 98%; /* Texto sobre erro (branco) */
```

#### Borders e Inputs
```css
--border: 214.3 31.8% 91.4%;       /* Cor de bordas */
--input: 214.3 31.8% 91.4%;        /* Cor de bordas de inputs */
--ring: 222.2 84% 4.9%;            /* Cor do focus ring */
```

#### Radius
```css
--radius: 0.5rem;                  /* Border radius padrão (8px) */
```

### Tema Escuro

O projeto suporta tema escuro através da classe `.dark`. As variáveis são redefinidas automaticamente:

```css
.dark {
  --background: 222.2 84% 4.9%;    /* Fundo escuro */
  --foreground: 210 40% 98%;       /* Texto claro */
  /* ... outras variáveis ... */
}
```

---

## 2. Como Usar as Variáveis CSS

### ❌ ERRADO: Cores Hardcoded
```tsx
// NÃO FAÇA ISSO!
<div className="bg-indigo-600 text-white border-slate-300">
  <p className="text-slate-600">Texto</p>
</div>
```

### ✅ CORRETO: Variáveis do Design System
```tsx
// FAÇA ISSO!
<div className="bg-primary text-primary-foreground border-border">
  <p className="text-muted-foreground">Texto</p>
</div>
```

### Mapeamento de Cores Comuns

| Cor Hardcoded | Variável do Design System |
|---------------|---------------------------|
| `bg-white` | `bg-card` ou `bg-background` |
| `bg-indigo-600` | `bg-primary` |
| `bg-indigo-50` | `bg-accent` |
| `bg-slate-100` | `bg-muted` |
| `text-slate-900` | `text-card-foreground` |
| `text-slate-600` | `text-muted-foreground` |
| `text-indigo-600` | `text-primary` |
| `text-white` | `text-primary-foreground` |
| `border-slate-300` | `border-border` |
| `border-indigo-600` | `border-primary` |

---

## 3. Componentes UI (shadcn/ui)

Todos os componentes UI estão em `src/components/ui/` e seguem o padrão shadcn/ui.

### Componentes Principais

#### Button
```tsx
import { Button } from "@/components/ui/button";

// Variantes disponíveis
<Button variant="default">Primário</Button>
<Button variant="secondary">Secundário</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destrutivo</Button>
<Button variant="link">Link</Button>

// Tamanhos
<Button size="default">Padrão</Button>
<Button size="sm">Pequeno</Button>
<Button size="lg">Grande</Button>
<Button size="icon">Ícone</Button>
```

#### Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo do card
  </CardContent>
  <CardFooter>
    Rodapé
  </CardFooter>
</Card>
```

#### Dialog (Modal)
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
      <DialogDescription>Descrição</DialogDescription>
    </DialogHeader>
    <div>Conteúdo</div>
    <DialogFooter>
      <Button>Ação</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Input
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email" 
    placeholder="seu@email.com"
    className="w-full"
  />
</div>
```

### Lista Completa de Componentes

- `accordion` - Acordeão expansível
- `alert` / `alert-dialog` - Alertas e diálogos de confirmação
- `avatar` - Avatar de usuário
- `badge` - Badge/tag
- `button` - Botão
- `calendar` - Calendário
- `card` - Card/cartão
- `checkbox` - Checkbox
- `dialog` - Modal/diálogo
- `dropdown-menu` - Menu dropdown
- `form` - Formulário (com react-hook-form)
- `input` - Campo de texto
- `label` - Label de formulário
- `popover` - Popover
- `select` - Select/dropdown
- `separator` - Separador
- `sheet` - Sheet/drawer lateral
- `skeleton` - Skeleton loader
- `switch` - Switch/toggle
- `table` - Tabela
- `tabs` - Abas
- `textarea` - Área de texto
- `toast` / `toaster` - Notificações toast
- `tooltip` - Tooltip

---

## 4. Padrões de Espaçamento

### Espaçamento Interno (Padding)

| Componente | Padding Padrão |
|------------|----------------|
| Card | `p-6` (24px) |
| Dialog | `p-6` (24px) |
| Button | `px-4 py-2` (16px horizontal, 8px vertical) |
| Input | `px-4 py-3` (16px horizontal, 12px vertical) |

### Espaçamento Entre Elementos (Gap/Space)

```tsx
// Espaçamento vertical entre elementos
<div className="space-y-4">  {/* 16px entre elementos */}
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Espaçamento horizontal entre elementos
<div className="flex gap-3">  {/* 12px entre elementos */}
  <Button>Botão 1</Button>
  <Button>Botão 2</Button>
</div>
```

### Escala de Espaçamento Recomendada

- `gap-2` / `space-y-2` = 8px (elementos muito próximos)
- `gap-3` / `space-y-3` = 12px (elementos próximos)
- `gap-4` / `space-y-4` = 16px (espaçamento padrão)
- `gap-6` / `space-y-6` = 24px (espaçamento maior)
- `gap-8` / `space-y-8` = 32px (seções)

---

## 5. Tipografia

### Hierarquia de Títulos

```tsx
// Título principal (h1)
<h1 className="text-3xl font-semibold text-card-foreground">
  Título Principal
</h1>

// Título de seção (h2)
<h2 className="text-2xl font-semibold text-card-foreground">
  Título de Seção
</h2>

// Subtítulo (h3)
<h3 className="text-lg font-semibold text-card-foreground">
  Subtítulo
</h3>

// Texto de parágrafo
<p className="text-sm text-muted-foreground">
  Texto de parágrafo
</p>
```

### Pesos de Fonte

- `font-medium` (500) - Texto normal com destaque leve
- `font-semibold` (600) - Títulos e elementos importantes (PADRÃO)
- `font-bold` (700) - Evitar (usar `font-semibold` ao invés)

### Tamanhos de Texto

- `text-xs` (12px) - Texto muito pequeno (labels, hints)
- `text-sm` (14px) - Texto padrão (parágrafos, descrições)
- `text-base` (16px) - Texto normal
- `text-lg` (18px) - Subtítulos
- `text-xl` (20px) - Títulos pequenos
- `text-2xl` (24px) - Títulos médios
- `text-3xl` (30px) - Títulos grandes

---

## 6. Bordas e Sombras

### Bordas

```tsx
// Borda padrão
<div className="border border-border rounded-lg">
  Conteúdo
</div>

// Borda com destaque
<div className="border-2 border-primary rounded-lg">
  Conteúdo destacado
</div>

// Borda tracejada (para placeholders)
<div className="border-2 border-dashed border-border rounded-lg">
  Placeholder
</div>
```

### Border Radius

- `rounded-md` (6px) - Padrão para elementos pequenos
- `rounded-lg` (8px) - Padrão para cards e containers (PADRÃO)
- `rounded-full` - Círculo completo (avatares, badges)

### Sombras

```tsx
// Sombra padrão (cards)
<div className="shadow-sm">
  Card com sombra leve
</div>

// Sem sombra (padrão para a maioria dos elementos)
<div className="shadow-none">
  Elemento sem sombra
</div>
```

**IMPORTANTE:** O design system usa `shadow-sm` (sombra leve) como padrão. Evite `shadow-lg` ou `shadow-xl`.

---

## 7. Estados Interativos

### Hover

```tsx
// Hover em botões (já incluído no componente Button)
<button className="hover:bg-accent hover:text-accent-foreground transition-colors">
  Botão
</button>

// Hover em links
<a className="text-primary hover:text-primary/90 transition-colors">
  Link
</a>
```

### Focus

```tsx
// Focus em inputs (já incluído no componente Input)
<input className="focus:ring-2 focus:ring-ring focus:border-input" />
```

### Disabled

```tsx
// Estado desabilitado
<button disabled className="disabled:opacity-50 disabled:cursor-not-allowed">
  Botão Desabilitado
</button>
```

### Transições

**SEMPRE adicione `transition-colors` em elementos interativos:**

```tsx
<button className="hover:bg-accent transition-colors">
  Botão com transição suave
</button>
```

---

## 8. Ícones (Lucide React)

O projeto usa **lucide-react** para ícones:

```tsx
import { Check, X, Loader2, AlertCircle } from "lucide-react";

// Ícone padrão (16px)
<Check className="w-4 h-4" />

// Ícone médio (20px)
<Check className="w-5 h-5" />

// Ícone grande (24px)
<Check className="w-6 h-6" />

// Ícone com cor
<Check className="w-5 h-5 text-primary" />

// Ícone animado (loading)
<Loader2 className="w-5 h-5 animate-spin" />
```

---

## 9. Responsividade

O projeto usa breakpoints do Tailwind:

```tsx
// Mobile-first approach
<div className="
  w-full           /* Mobile: largura total */
  sm:w-1/2         /* Small (640px+): metade da largura */
  md:w-1/3         /* Medium (768px+): um terço */
  lg:w-1/4         /* Large (1024px+): um quarto */
">
  Conteúdo responsivo
</div>

// Grid responsivo
<div className="
  grid 
  grid-cols-1      /* Mobile: 1 coluna */
  sm:grid-cols-2   /* Small: 2 colunas */
  lg:grid-cols-3   /* Large: 3 colunas */
  gap-4
">
  {/* Cards */}
</div>
```

---

## 10. Checklist de Implementação

Ao criar novos componentes, sempre verifique:

- [ ] ✅ Usar variáveis CSS ao invés de cores hardcoded
- [ ] ✅ Usar componentes shadcn/ui quando disponíveis
- [ ] ✅ Usar `Button` ao invés de `<button>` customizado
- [ ] ✅ Usar `Dialog` ao invés de modal customizado
- [ ] ✅ Usar `font-semibold` ao invés de `font-bold`
- [ ] ✅ Usar `text-muted-foreground` ao invés de `text-slate-600`
- [ ] ✅ Usar `border-border` ao invés de `border-slate-300`
- [ ] ✅ Usar `bg-accent` ao invés de `bg-indigo-50`
- [ ] ✅ Usar `shadow-sm` ao invés de `shadow-lg`
- [ ] ✅ Adicionar `transition-colors` em elementos interativos
- [ ] ✅ Usar espaçamento `p-6` para cards
- [ ] ✅ Usar `rounded-lg` para bordas de containers

---

## 11. Exemplos Práticos

### Exemplo 1: Card com Botão

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

<Card>
  <CardHeader>
    <CardTitle>Título do Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Descrição do conteúdo
    </p>
  </CardContent>
  <CardFooter>
    <Button variant="default">Ação Principal</Button>
    <Button variant="outline">Cancelar</Button>
  </CardFooter>
</Card>
```

### Exemplo 2: Formulário

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="name">Nome</Label>
    <Input 
      id="name" 
      placeholder="Digite seu nome"
      className="w-full"
    />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input 
      id="email" 
      type="email"
      placeholder="seu@email.com"
      className="w-full"
    />
  </div>
  
  <div className="flex gap-3 pt-4">
    <Button type="submit" variant="default" className="flex-1">
      Salvar
    </Button>
    <Button type="button" variant="outline">
      Cancelar
    </Button>
  </div>
</form>
```

### Exemplo 3: Lista de Itens Selecionáveis

```tsx
import { Check } from "lucide-react";

const items = [/* ... */];
const [selectedId, setSelectedId] = useState("");

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <button
      key={item.id}
      onClick={() => setSelectedId(item.id)}
      className={`
        p-4 border-2 rounded-lg text-left transition-colors
        ${selectedId === item.id 
          ? 'border-primary bg-accent' 
          : 'border-border hover:border-primary/50'
        }
      `}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-card-foreground">
          {item.name}
        </h3>
        {selectedId === item.id && (
          <Check className="w-5 h-5 text-primary" />
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {item.description}
      </p>
    </button>
  ))}
</div>
```

---

## 12. Referências

- **shadcn/ui**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons/
- **Radix UI** (base dos componentes shadcn/ui): https://www.radix-ui.com/

---

**Data de Criação:** 21/02/2026  
**Última Atualização:** 21/02/2026  
**Autor:** Kiro AI  
**Status:** ATIVO
