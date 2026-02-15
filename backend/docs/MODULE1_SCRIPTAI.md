# Módulo 1 - ScriptAI

## Visão Geral

O Módulo 1 (ScriptAI) é um sistema de geração inteligente de scripts para vídeos de redes sociais que combina pesquisa web contextualizada via Tavily com geração de conteúdo via Claude AI. O módulo permite que usuários criem scripts otimizados baseados em temas específicos, com suporte a diferentes audiências, tons e durações, além de gerenciar rascunhos.

## Endpoints

### 1. Gerar Script

Gera um script inteligente baseado em um tema e parâmetros.

**Endpoint:** `POST /api/modules/1/generate-script`

**Request:**
```json
{
  "topic": "Benefícios da vitamina D para a pele",
  "audience": "mlm",
  "tone": "informal",
  "duration": 60,
  "language": "pt-BR"
}
```

**Response:**
```json
{
  "script": "Você sabia que 80% das brasileiras...",
  "sources": [
    {
      "title": "Estudo sobre vitamina D",
      "url": "https://..."
    }
  ],
  "metadata": {
    "generation_params": {
      "topic": "Benefícios da vitamina D para a pele",
      "audience": "mlm",
      "tone": "informal",
      "duration": 60,
      "language": "pt-BR"
    },
    "sources": [...],
    "script_stats": {
      "word_count": 150,
      "estimated_duration": 62,
      "generated_at": "2024-01-15T10:30:00Z",
      "model": "claude-sonnet-4-20250514"
    }
  }
}
```

---

### 2. Regenerar Script

Regenera um script com feedback adicional do usuário.

**Endpoint:** `POST /api/modules/1/regenerate-script`

**Request:**
```json
{
  "topic": "Benefícios da vitamina D para a pele",
  "audience": "mlm",
  "tone": "professional",
  "duration": 90,
  "feedback": "Quero mais dados científicos"
}
```

**Response:** Mesmo formato do endpoint de geração.

---

### 3. Salvar Rascunho

Salva um script como rascunho para edição futura.

**Endpoint:** `POST /api/modules/1/scripts/save-draft`

**Request:**
```json
{
  "title": "Vitamina D para pele",
  "script": "Texto do script...",
  "metadata": {
    "generation_params": {...},
    "sources": [...]
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Vitamina D para pele",
  "script": "Texto do script...",
  "metadata": {...},
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 4. Listar Rascunhos

Lista todos os rascunhos da organização.

**Endpoint:** `GET /api/modules/1/scripts/drafts`

**Response:**
```json
{
  "drafts": [
    {
      "id": "uuid",
      "title": "Vitamina D para pele",
      "script": "Texto do script...",
      "topic": "Benefícios da vitamina D",
      "audience": "mlm",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

### 5. Obter Rascunho

Obtém detalhes de um rascunho específico.

**Endpoint:** `GET /api/modules/1/scripts/drafts/{draft_id}`

**Response:** Mesmo formato do endpoint de salvar rascunho.

---

### 6. Atualizar Rascunho

Atualiza um rascunho existente.

**Endpoint:** `PUT /api/modules/1/scripts/drafts/{draft_id}`

**Request:**
```json
{
  "title": "Vitamina D para pele - Atualizado",
  "script": "Texto do script atualizado..."
}
```

**Response:** Mesmo formato do endpoint de salvar rascunho.

---

### 7. Deletar Rascunho

Deleta um rascunho.

**Endpoint:** `DELETE /api/modules/1/scripts/drafts/{draft_id}`

**Response:**
```json
{
  "message": "Rascunho deletado com sucesso."
}
```

---

## Jornadas Pós-Aprovação

Quando o usuário aprova um script, ele tem 3 caminhos:

### Jornada 1: Teleprompter

O frontend redireciona para a interface de teleprompter. Após gravação, o vídeo vai para o Módulo 2 (PostRápido).

### Jornada 2: Avatar AI

O frontend envia o script para o endpoint `POST /api/modules/3/generate-video` (já implementado na Fase 2).

### Jornada 3: Salvar para Depois

Usa o endpoint `POST /api/modules/1/scripts/save-draft`.

---

## Parâmetros de Geração

### Audience (Público)

- `mlm`: MLM/Network Marketing - tom empoderador e focado em vendas
- `politics`: Política - tom informativo e propositivo
- `general`: Geral - tom educativo e acessível

### Tone (Tom)

- `informal`: Informal - linguagem casual e direta
- `professional`: Profissional - linguagem formal e técnica
- `inspirational`: Inspiracional - linguagem motivacional

### Duration (Duração)

- `30`: 30 segundos
- `60`: 60 segundos
- `90`: 90 segundos

---

## Estrutura de Metadata

```json
{
  "generation_params": {
    "topic": "Estratégias de Marketing Digital",
    "audience": "mlm",
    "tone": "professional",
    "duration": 60,
    "language": "pt-BR"
  },
  "sources": [
    {
      "title": "10 Estratégias de Marketing Digital para 2024",
      "url": "https://example.com/article",
      "score": 0.95
    }
  ],
  "script_stats": {
    "word_count": 150,
    "estimated_duration": 58,
    "generated_at": "2024-01-15T10:30:00Z",
    "model": "claude-sonnet-4-20250514"
  },
  "feedback_history": [
    {
      "feedback": "Tornar mais inspiracional",
      "applied_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Request inválido (campos obrigatórios ausentes ou valores inválidos) |
| 401 | Token de autenticação ausente ou inválido |
| 403 | Acesso negado (RLS - organização diferente) |
| 404 | Rascunho não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |
| 502 | Erro na API externa (Tavily ou Claude) |
| 504 | Timeout na API externa |

---

## Exemplos de Uso

### cURL

```bash
# Gerar script
curl -X POST https://api.renum.com/api/modules/1/generate-script \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Benefícios da vitamina D",
    "audience": "mlm",
    "tone": "informal",
    "duration": 60,
    "language": "pt-BR"
  }'

# Salvar rascunho
curl -X POST https://api.renum.com/api/modules/1/scripts/save-draft \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Vitamina D para pele",
    "script": "Texto do script...",
    "metadata": {}
  }'
```

### Python

```python
import requests

# Gerar script
response = requests.post(
    "https://api.renum.com/api/modules/1/generate-script",
    headers={
        "Authorization": "Bearer {token}",
        "Content-Type": "application/json"
    },
    json={
        "topic": "Benefícios da vitamina D",
        "audience": "mlm",
        "tone": "informal",
        "duration": 60,
        "language": "pt-BR"
    }
)

# Salvar rascunho
response = requests.post(
    "https://api.renum.com/api/modules/1/scripts/save-draft",
    headers={
        "Authorization": "Bearer {token}",
        "Content-Type": "application/json"
    },
    json={
        "title": "Vitamina D para pele",
        "script": "Texto do script...",
        "metadata": {}
    }
)
```