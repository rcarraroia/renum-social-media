import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink, RefreshCw, User, Sparkles } from "lucide-react";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HeyGenCloneGuide from "./HeyGenCloneGuide";
import AvatarCard from "./AvatarCard";

/**
 * HeyGenSetupWizard - Wizard de configuração HeyGen em 2 passos
 * 
 * Passo 1: Validação de API Key
 * Passo 2: Seleção de Avatar + Voz
 * 
 * @version 1.0.1 - Debug logging enabled
 */

type WizardStep = 1 | 2;

type ValidationState = "idle" | "loading" | "success" | "error";

interface ValidationResult {
  valid: boolean;
  credits_remaining?: number;
  plan?: string;
  error?: string;
}

interface Avatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  gender?: string;
  is_clone?: boolean;
}

interface Voice {
  voice_id: string;
  voice_name: string;
  language?: string;
  gender?: string;
  preview_audio_url?: string;
}

interface HeyGenSetupWizardProps {
  onComplete?: (data: { apiKey: string; avatarId: string; voiceId: string }) => void;
  onCancel?: () => void;
}

const HeyGenSetupWizard: React.FC<HeyGenSetupWizardProps> = ({ onComplete, onCancel }) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  
  // Step 1: API Key
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationError, setValidationError] = useState<string>("");
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  
  // Step 2: Avatar + Voice
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showCloneGuide, setShowCloneGuide] = useState(false);

  /**
   * Carrega avatares quando avança para o Passo 2
   */
  useEffect(() => {
    if (currentStep === 2 && avatars.length === 0) {
      loadAvatars();
      loadVoices();
    }
  }, [currentStep]);

  /**
   * Obtém o token de autenticação do Supabase
   */
  const getAuthToken = async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  /**
   * Carrega lista de avatares do backend
   */
  const loadAvatars = async () => {
    console.log("🔵 Carregando avatares...");
    setLoadingAvatars(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      // Usar endpoint do wizard que aceita API Key no body
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/heygen/wizard/avatars`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ api_key: apiKey }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao carregar avatares");
      }

      const data = await response.json();
      console.log("🟢 Avatares carregados:", data.avatars?.length || 0);
      setAvatars(data.avatars || []);
    } catch (error) {
      console.error("🔴 Erro ao carregar avatares:", error);
      showError("Erro ao carregar avatares. Tente novamente.");
    } finally {
      setLoadingAvatars(false);
    }
  };

  /**
   * Carrega lista de vozes do backend
   */
  const loadVoices = async () => {
    console.log("🔵 Carregando vozes...");
    setLoadingVoices(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      // Usar endpoint do wizard que aceita API Key no body
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/heygen/wizard/voices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ api_key: apiKey }),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao carregar vozes");
      }

      const data = await response.json();
      console.log("🟢 Vozes carregadas:", data.voices?.length || 0);
      setVoices(data.voices || []);
    } catch (error) {
      console.error("🔴 Erro ao carregar vozes:", error);
      showError("Erro ao carregar vozes. Tente novamente.");
    } finally {
      setLoadingVoices(false);
    }
  };

  /**
   * Volta para o Passo 1 e reseta o estado de validação
   */
  const handleBackToStep1 = () => {
    setCurrentStep(1);
    setValidationState("idle");
    setValidationError("");
  };

  /**
   * Salva a configuração completa (API Key + Avatar + Voz)
   */
  const handleSaveConfiguration = async () => {
    console.log("🔵 BOTÃO SALVAR CLICADO - Avatar:", selectedAvatarId, "Voz:", selectedVoiceId);
    
    if (!selectedAvatarId) {
      showError("Selecione um avatar");
      return;
    }

    if (!selectedVoiceId) {
      showError("Selecione uma voz");
      return;
    }

    console.log("🟢 VALIDAÇÕES OK - Enviando requisição...");
    setSavingConfig(true);
    const toastId = showLoading("Salvando configuração...");

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      console.log("🟢 TOKEN OK - URL:", import.meta.env.VITE_API_URL);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/heygen`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          api_key: apiKey,
          avatar_id: selectedAvatarId,
          voice_id: selectedVoiceId,
        }),
      });

      console.log("🟢 RESPOSTA RECEBIDA - Status:", response.status);

      dismissToast(toastId);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("🔴 ERRO NA RESPOSTA:", errorData);
        throw new Error(errorData.detail || "Erro ao salvar configuração");
      }

      const responseData = await response.json();
      console.log("🟢 SUCESSO:", responseData);

      showSuccess("Configuração salva com sucesso!");

      if (onComplete) {
        onComplete({
          apiKey,
          avatarId: selectedAvatarId,
          voiceId: selectedVoiceId,
        });
      }
    } catch (error: any) {
      dismissToast(toastId);
      console.error("🔴 ERRO CRÍTICO:", error);
      showError(error.message || "Erro ao salvar configuração. Tente novamente.");
    } finally {
      setSavingConfig(false);
    }
  };

  /**
   * Valida a API Key chamando o endpoint do backend
   */
  const handleValidateApiKey = async () => {
    if (!apiKey || apiKey.trim().length < 10) {
      showError("API Key deve ter pelo menos 10 caracteres");
      return;
    }

    setValidationState("loading");
    setValidationError("");

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/heygen/validate-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      const data: ValidationResult = await response.json();

      if (response.ok && data.valid) {
        setValidationState("success");
        setCreditsRemaining(data.credits_remaining ?? null);
        showSuccess("API Key válida! Avançando para seleção de avatar...");
        
        // Avançar para o Passo 2 imediatamente
        setCurrentStep(2);
      } else {
        setValidationState("error");
        const errorMessage = data.error || "API Key inválida. Verifique suas credenciais.";
        setValidationError(errorMessage);
        showError(errorMessage);
      }
    } catch (error: any) {
      setValidationState("error");
      const errorMessage = error.message || "Erro ao validar API Key. Tente novamente.";
      setValidationError(errorMessage);
      showError(errorMessage);
      console.error("Erro ao validar API Key:", error);
    }
  };

  const renderStep1 = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">Conectar HeyGen</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Conecte sua conta HeyGen para criar vídeos com avatares digitais.
          </p>
        </div>

        {/* Link para criar conta */}
        <div className="bg-accent border border-border rounded-md p-4">
          <p className="text-sm text-card-foreground mb-2">
            Ainda não tem uma conta HeyGen?
          </p>
          <a
            href="https://heygen.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/90 font-medium transition-colors"
          >
            Criar conta grátis no HeyGen
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Campo de API Key */}
        <div className="space-y-2">
          <label htmlFor="apiKey" className="block text-sm font-medium text-card-foreground">
            API Key do HeyGen
          </label>
          <div className="relative">
            <input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Digite sua API Key do HeyGen"
              disabled={validationState === "loading" || validationState === "success"}
              className="w-full px-4 py-3 pr-12 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring focus:border-input disabled:bg-muted disabled:text-muted-foreground transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter" && validationState !== "loading") {
                  handleValidateApiKey();
                }
              }}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              disabled={validationState === "loading" || validationState === "success"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              aria-label={showApiKey ? "Ocultar API Key" : "Mostrar API Key"}
            >
              {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Você pode encontrar sua API Key nas configurações da sua conta HeyGen.
          </p>
        </div>

        {/* Feedback de validação */}
        {validationState === "error" && validationError && (
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive rounded-md">
            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Erro na validação</p>
              <p className="text-sm text-destructive/90 mt-1">{validationError}</p>
            </div>
          </div>
        )}

        {validationState === "success" && (
          <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary rounded-md">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">API Key válida!</p>
              {creditsRemaining !== null && (
                <p className="text-sm text-primary/90 mt-1">
                  Créditos disponíveis: {creditsRemaining.toFixed(1)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button
              onClick={onCancel}
              disabled={validationState === "loading"}
              variant="outline"
            >
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleValidateApiKey}
            disabled={!apiKey || apiKey.length < 10 || validationState === "loading" || validationState === "success"}
            className="flex-1"
            variant="default"
          >
            {validationState === "loading" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Validando...
              </>
            ) : validationState === "success" ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Validado
              </>
            ) : (
              "Conectar"
            )}
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Renderiza o Passo 2: Seleção de Avatar + Voz
   */
  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">Selecionar Avatar e Voz</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Escolha o avatar e a voz que serão usados nos seus vídeos.
          </p>
        </div>

        {/* Loading state */}
        {loadingAvatars && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando seus avatares...</span>
          </div>
        )}

        {/* Avatares carregados */}
        {!loadingAvatars && avatars.length > 0 && (
          <div className="space-y-6">
            {/* Seção de Avatares Personalizados */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Seus Avatares Personalizados
                </h3>
                <Button
                  onClick={loadAvatars}
                  disabled={loadingAvatars}
                  variant="ghost"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Atualizar
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {avatars.map((avatar) => (
                  <AvatarCard
                    key={avatar.avatar_id}
                    avatar={avatar}
                    voices={voices}
                    selectedAvatarId={selectedAvatarId}
                    selectedVoiceId={selectedVoiceId}
                    onSelectAvatar={setSelectedAvatarId}
                    onSelectVoice={setSelectedVoiceId}
                    loadingVoices={loadingVoices}
                  />
                ))}
              </div>
            </div>

            {/* Card "Criar Clone" */}
            <div>
              <h3 className="text-lg font-semibold text-card-foreground mb-3">Criar Novo Clone</h3>
              <button
                onClick={() => setShowCloneGuide(true)}
                className="w-full p-6 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition-colors group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">Criar Clone Personalizado</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Crie um avatar digital com sua aparência
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!loadingAvatars && avatars.length === 0 && (
          <div className="text-center py-12 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <User className="w-16 h-16 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold text-card-foreground mb-2">
                  Nenhum avatar personalizado encontrado
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Você ainda não criou nenhum clone ou avatar personalizado no HeyGen.
                  Crie seu primeiro avatar para começar a gerar vídeos personalizados.
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCloneGuide(true)} variant="default" size="lg">
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Meu Primeiro Clone
            </Button>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">
                Ou acesse o painel do HeyGen para criar seu avatar:
              </p>
              <a
                href="https://app.heygen.com/avatar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/90 font-medium transition-colors"
              >
                Abrir HeyGen Studio
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleBackToStep1}
            disabled={savingConfig}
            variant="outline"
          >
            ← Voltar
          </Button>
          <Button
            onClick={handleSaveConfiguration}
            disabled={!selectedAvatarId || !selectedVoiceId || savingConfig}
            className="flex-1"
            variant="default"
          >
            {savingConfig ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Configuração"
            )}
          </Button>
        </div>

        {/* Modal de guia de clone */}
        {showCloneGuide && (
          <HeyGenCloneGuide
            onClose={() => setShowCloneGuide(false)}
            onRefresh={loadAvatars}
          />
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep === 1
                  ? "bg-primary text-primary-foreground"
                  : validationState === "success"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {validationState === "success" && currentStep !== 1 ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                "1"
              )}
            </div>
            <span className={`text-sm font-medium transition-colors ${currentStep === 1 ? "text-card-foreground" : "text-muted-foreground"}`}>
              API Key
            </span>
          </div>

          <div className="w-16 h-0.5 bg-border" />

          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <span className={`text-sm font-medium transition-colors ${currentStep === 2 ? "text-card-foreground" : "text-muted-foreground"}`}>
              Avatar & Voz
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo do passo atual */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        {currentStep === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
};

export default HeyGenSetupWizard;
