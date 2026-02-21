# BUGFIX SPEC - Transcrição com Deepgram/Whisper

**Data de Criação:** 20/02/2026  
**Status:** DOCUMENTAÇÃO DO BUG (Fase 1-3)  
**Prioridade:** CRÍTICA

---

## 🔍 FASE 1: REPRODUÇÃO DO BUG

### Bug #1: Validação Incorreta de DEEPGRAM_API_KEY

#### Sintoma
Sistema usa Deepgram mesmo quando `DEEPGRAM_API_KEY="placeholder"`, resultando em falhas de autenticação.

#### Passos para Reproduzir
1. Configurar `DEEPGRAM_API_KEY="placeholder"` no `.env`
2. Iniciar aplicação backend
3. Tentar transcrever um áudio
4. Sistema tenta usar Deepgram e falha com erro 401

#### Comportamento Esperado
- Sistema deve detectar que "placeholder" não é uma key válida
- Sistema deve usar Whisper local automaticamente
- Nenhuma tentativa de chamar Deepgram API

#### Comportamento Atual
- Sistema considera "placeholder" como válida (porque `bool("placeholder")` = True)
- Sistema tenta chamar Deepgram API
- Deepgram retorna erro 401 Unauthorized
- Sistema falha sem fallback

#### Taxa de Reprodução
- [x] Sempre (100%)

#### Evidências
```python
# Código atual em backend/app/services/transcription.py
def __init__(self):
    self.deepgram_api_key = settings.deepgram_api_key
    self.use_deepgram = bool(self.deepgram_api_key)  # ❌ BUG AQUI
    
    # bool("placeholder") = True
    # bool("") = False
    # bool(None) = False
```

---

### Bug #2: Sem Fallback Automático em Runtime

#### Sintoma
Quando Deepgram API falha (timeout, rate limit, erro 500), sistema retorna erro ao usuário ao invés de tentar Whisper.

#### Passos para Reproduzir
1. Configurar `DEEPGRAM_API_KEY` válida
2. Simular falha da Deepgram API (timeout, erro 500, rate limit)
3. Tentar transcrever um áudio
4. Sistema retorna erro ao usuário

#### Comportamento Esperado
- Sistema tenta Deepgram primeiro
- Se Deepgram falhar, sistema loga o erro
- Sistema tenta Whisper automaticamente
- Sistema retorna transcrição do Whisper
- Response inclui campo `provider: "whisper"`

#### Comportamento Atual
- Sistema tenta Deepgram
- Se Deepgram falhar, sistema retorna erro imediatamente
- Nenhuma tentativa de fallback para Whisper
- Usuário precisa reenviar requisição

#### Taxa de Reprodução
- [x] Sempre (100%) quando Deepgram falha

#### Evidências
```python
# Código atual em backend/app/services/transcription.py
async def transcribe_audio(self, audio_path: str, language: str = "pt-BR"):
    if self.use_deepgram:
        return await self._transcribe_deepgram(audio_path, language)
        # ❌ Se falhar aqui, não há try-catch para fallback
    else:
        return await self._transcribe_whisper(audio_path, language)
```

---

## 🔬 FASE 2: ISOLAMENTO

### Quando Começou?
- Bug existe desde a implementação inicial do serviço de transcrição
- Não foi introduzido por mudança recente

### O Que Mudou Recentemente?
- Nada relacionado ao serviço de transcrição
- Bug é estrutural, não regressão

### Acontece em Todos os Ambientes?
- [x] Desenvolvimento
- [x] Staging
- [x] Produção

### Código Mínimo para Reproduzir

**Bug #1:**
```python
# Validação incorreta
api_key = "placeholder"
use_deepgram = bool(api_key)  # True ❌
print(use_deepgram)  # True
```

**Bug #2:**
```python
# Sem fallback
async def transcribe_audio(audio_path):
    if use_deepgram:
        result = await deepgram_api_call()  # Se falhar, erro propagado
        return result
    else:
        return await whisper_call()
```

### Arquivos Afetados
- `backend/app/services/transcription.py` (principal)
- `backend/app/config.py` (configuração)
- Todos os endpoints que usam transcrição

---

## 🎯 FASE 3: ENTENDIMENTO (ROOT CAUSE)

### Bug #1: Validação Incorreta

#### Os 5 Porquês

1. **Por que o sistema usa Deepgram com "placeholder"?**
   - Porque `self.use_deepgram = bool(self.deepgram_api_key)` retorna True

2. **Por que `bool("placeholder")` retorna True?**
   - Porque em Python, qualquer string não-vazia é truthy

3. **Por que não validamos o conteúdo da string?**
   - Porque assumimos que `bool()` seria suficiente para validar

4. **Por que "placeholder" está sendo usado?**
   - Porque é o valor padrão no `.env.example` para indicar que precisa ser configurado

5. **ROOT CAUSE:**
   - Validação inadequada que não considera strings específicas como inválidas
   - Falta de validação de conteúdo (apenas validação de existência)

#### Análise Técnica

```python
# Problema
bool(None)          # False ✅
bool("")            # False ✅
bool("placeholder") # True  ❌ DEVERIA SER FALSE
bool("valid_key")   # True  ✅

# Solução necessária
def is_valid_key(key):
    if key is None:
        return False
    if key.strip() == "":
        return False
    if key.lower() == "placeholder":
        return False
    return True
```

---

### Bug #2: Sem Fallback Automático

#### Os 5 Porquês

1. **Por que o sistema não tenta Whisper quando Deepgram falha?**
   - Porque não há try-catch em `transcribe_audio()`

2. **Por que não há try-catch?**
   - Porque a implementação original assumiu que Deepgram seria confiável

3. **Por que não consideramos falhas de API externa?**
   - Porque focamos no "happy path" sem considerar cenários de falha

4. **Por que isso não foi detectado antes?**
   - Porque testes não cobriram cenários de falha de API externa

5. **ROOT CAUSE:**
   - Falta de tratamento de exceções para APIs externas
   - Ausência de estratégia de fallback em runtime
   - Testes insuficientes para cenários de falha

---

## 📊 IMPACTO DO BUG

### Severidade
- **CRÍTICA** - Afeta funcionalidade core do sistema

### Usuários Afetados
- Todos os usuários que tentam transcrever áudio
- Especialmente em ambientes onde Deepgram não está configurado corretamente

### Frequência
- **Bug #1:** Acontece em 100% dos casos com key "placeholder"
- **Bug #2:** Acontece sempre que Deepgram API falha (timeout, rate limit, erro 500)

### Consequências
1. **Falhas de transcrição** quando Deepgram não está configurado
2. **Experiência ruim do usuário** - precisa reenviar requisição
3. **Perda de disponibilidade** - sistema não usa backup disponível (Whisper)
4. **Custos desnecessários** - tentativas falhadas de Deepgram consomem quota

---

## 🔧 FASE 4: CORREÇÃO (A SER IMPLEMENTADA)

**NOTA:** Esta seção documenta a correção planejada. A implementação será feita após aprovação desta spec.

### Casos de Borda Identificados
1. `DEEPGRAM_API_KEY = None` → Usar Whisper ✅
2. `DEEPGRAM_API_KEY = ""` → Usar Whisper ✅
3. `DEEPGRAM_API_KEY = "placeholder"` → Usar Whisper ✅
4. `DEEPGRAM_API_KEY = "valid_key"` → Usar Deepgram ✅
5. Deepgram timeout → Fallback Whisper ✅
6. Deepgram 401 → Fallback Whisper ✅
7. Deepgram 429 (rate limit) → Fallback Whisper ✅
8. Deepgram 500 → Fallback Whisper ✅
9. Whisper também falha → Retornar erro ✅

---

**Status:** DOCUMENTAÇÃO COMPLETA - AGUARDANDO APROVAÇÃO PARA IMPLEMENTAÇÃO  
**Próximo Passo:** Revisar esta spec antes de implementar correções

