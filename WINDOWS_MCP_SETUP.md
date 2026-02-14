# 🪟 Setup MCP para Windows

## ❌ Problemas Identificados nos Logs:

1. **`uvx` não encontrado** - Precisa instalar `uv`
2. **Erro no Tavily package** - Nome incorreto `[email protected]`
3. **JSON malformado** - Corrigido

## 🔧 Solução Rápida

### Passo 1: Instalar Dependências

**Opção A - Script Automático (Recomendado):**
```powershell
# Execute como Administrador
PowerShell -ExecutionPolicy Bypass -File install-mcp-dependencies.ps1
```

**Opção B - Manual:**
```powershell
# Instalar uv
irm https://astral.sh/uv/install.ps1 | iex

# Instalar pacotes Python
pip install mcp-metricool heygen-mcp
```

### Passo 2: Configuração Simplificada

Por enquanto, vamos usar apenas o **Tavily Remote MCP** que funciona melhor no Windows:

```json
{
  "mcpServers": {
    "tavily-remote": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.tavily.com/mcp/?tavilyApiKey=YOUR_TAVILY_API_KEY_HERE"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Passo 3: Obter API Key do Tavily

1. Acesse [tavily.com](https://tavily.com)
2. Crie uma conta gratuita
3. Copie sua API key (formato: `tvly-...`)
4. Substitua `YOUR_TAVILY_API_KEY_HERE` no arquivo MCP

### Passo 4: Testar

1. **Reinicie o Kiro**
2. **Teste no chat**: "Can you search for recent news about AI?"

## 🔄 Adicionando Outros MCPs (Após Tavily Funcionar)

### Metricool (Quando uv estiver funcionando):
```json
"metricool": {
  "command": "uvx",
  "args": ["mcp-metricool"],
  "env": {
    "METRICOOL_USER_TOKEN": "seu_token",
    "METRICOOL_USER_ID": "seu_user_id"
  },
  "disabled": false,
  "autoApprove": []
}
```

### HeyGen (Quando uv estiver funcionando):
```json
"heygen": {
  "command": "uvx",
  "args": ["heygen-mcp"],
  "env": {
    "HEYGEN_API_KEY": "sua_key"
  },
  "disabled": false,
  "autoApprove": []
}
```

## 🚨 Troubleshooting Windows

### Erro: "uvx não reconhecido"
```powershell
# Adicionar ao PATH
$env:PATH += ";$env:USERPROFILE\.local\bin"

# Ou reinstalar uv
irm https://astral.sh/uv/install.ps1 | iex
```

### Erro: "npx não encontrado"
```powershell
# Instalar Node.js de https://nodejs.org
# Ou via Chocolatey
choco install nodejs
```

### Erro: "Python não encontrado"
```powershell
# Instalar Python de https://python.org
# Ou via Microsoft Store
# Ou via Chocolatey
choco install python
```

## ✅ Status Atual

- ✅ **JSON corrigido** - Sem mais "Unexpected end of JSON input"
- ✅ **Tavily Remote** - Funcionará com npx
- ⏳ **Metricool/HeyGen** - Aguardando instalação do uv

## 🎯 Próximos Passos

1. **Execute o script de instalação**
2. **Configure a API key do Tavily**
3. **Teste o Tavily MCP**
4. **Adicione outros MCPs gradualmente**

**Foque primeiro no Tavily para ter pelo menos um MCP funcionando!** 🎉