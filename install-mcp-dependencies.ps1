# Script de instalação das dependências MCP para Windows
# Execute como Administrador: PowerShell -ExecutionPolicy Bypass -File install-mcp-dependencies.ps1

Write-Host "🔧 Instalando dependências MCP para Windows..." -ForegroundColor Green

# Verificar se Python está instalado
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python encontrado: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python não encontrado. Instale Python 3.10+ de https://python.org" -ForegroundColor Red
    Write-Host "💡 Dica: Marque 'Add Python to PATH' durante a instalação" -ForegroundColor Yellow
    exit 1
}

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale Node.js de https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Instalar uv (Python package manager)
Write-Host "📦 Instalando uv (gerenciador de pacotes Python ultrarrápido)..." -ForegroundColor Yellow
try {
    Write-Host "🔄 Baixando e instalando uv..." -ForegroundColor Cyan
    irm https://astral.sh/uv/install.ps1 | iex
    Write-Host "✅ uv instalado com sucesso" -ForegroundColor Green
    
    # Atualizar PATH para a sessão atual
    $env:PATH += ";$env:USERPROFILE\.local\bin"
    
    # Verificar se uv foi instalado
    $uvVersion = uv --version 2>&1
    Write-Host "✅ uv versão: $uvVersion" -ForegroundColor Green
    
} catch {
    Write-Host "⚠️ Erro ao instalar uv automaticamente." -ForegroundColor Yellow
    Write-Host "💡 Tente instalar manualmente:" -ForegroundColor Cyan
    Write-Host "   1. Acesse: https://github.com/astral-sh/uv/releases" -ForegroundColor White
    Write-Host "   2. Baixe uv-x86_64-pc-windows-msvc.zip" -ForegroundColor White
    Write-Host "   3. Extraia e adicione ao PATH" -ForegroundColor White
}

# Testar uvx
Write-Host "🧪 Testando uvx..." -ForegroundColor Yellow
try {
    uvx --version
    Write-Host "✅ uvx funcionando perfeitamente!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ uvx não encontrado. Reinicie o PowerShell e tente novamente." -ForegroundColor Yellow
    Write-Host "💡 Ou adicione manualmente ao PATH: $env:USERPROFILE\.local\bin" -ForegroundColor Cyan
}

# Instalar pacotes MCP via uvx (mais rápido e confiável)
Write-Host "📦 Instalando pacotes MCP..." -ForegroundColor Yellow

# Metricool MCP
Write-Host "🔄 Instalando Metricool MCP..." -ForegroundColor Cyan
try {
    uvx --help | Out-Null
    Write-Host "✅ uvx disponível, MCPs podem ser instalados sob demanda" -ForegroundColor Green
} catch {
    Write-Host "⚠️ uvx não disponível, usando pip como fallback" -ForegroundColor Yellow
    try {
        pip install mcp-metricool
        Write-Host "✅ mcp-metricool instalado via pip" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao instalar mcp-metricool" -ForegroundColor Red
    }
}

# HeyGen MCP
Write-Host "🔄 Instalando HeyGen MCP..." -ForegroundColor Cyan
try {
    uvx --help | Out-Null
    Write-Host "✅ uvx disponível, HeyGen MCP será instalado sob demanda" -ForegroundColor Green
} catch {
    Write-Host "⚠️ uvx não disponível, usando pip como fallback" -ForegroundColor Yellow
    try {
        pip install heygen-mcp
        Write-Host "✅ heygen-mcp instalado via pip" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao instalar heygen-mcp" -ForegroundColor Red
    }
}

# Verificar instalações
Write-Host "`n🔍 Resumo da instalação..." -ForegroundColor Cyan

# Testar npx
try {
    npx --version | Out-Null
    Write-Host "✅ npx funcionando (para Tavily)" -ForegroundColor Green
} catch {
    Write-Host "❌ npx não encontrado" -ForegroundColor Red
}

# Testar uvx
try {
    uvx --version | Out-Null
    Write-Host "✅ uvx funcionando (para Metricool/HeyGen)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ uvx não encontrado - reinicie o terminal" -ForegroundColor Yellow
}

Write-Host "`n🎉 Instalação concluída!" -ForegroundColor Green
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. 🔄 Reinicie o PowerShell/Terminal" -ForegroundColor White
Write-Host "2. 🔑 Configure suas API keys no arquivo .kiro/settings/mcp.json" -ForegroundColor White
Write-Host "3. 🚀 Reinicie o Kiro" -ForegroundColor White
Write-Host "4. 🧪 Teste os MCPs no chat" -ForegroundColor White

Write-Host "`n💡 Dica: Se uvx não funcionar, adicione ao PATH:" -ForegroundColor Yellow
Write-Host "   $env:USERPROFILE\.local\bin" -ForegroundColor White