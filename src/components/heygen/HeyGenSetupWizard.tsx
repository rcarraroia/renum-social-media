import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, ExternalLink, RefreshCw, User, Sparkles } from "lucide-react";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/**
 * HeyGenSetupWizard - Wizard de configuração HeyGen em 3 passos
 * 
 * Passo 1: Validação e Salvamento de API Key
 * Passo 2: Guia de Criação de Avatar
 * Passo 3: Seleção de Avatar (voz opcional)
 * 
 * @version 2.0.0 - Configuração em etapas desacopladas
 */

type WizardStep = 1 | 2 | 3;

type ValidationState = "idle" | "loading" | "success" | "error";

interface Avatar {
  avatar_id: string;
  avatar_name: string;
  preview_image_url?: string;
  gender?: string;
  is_clone?: boolean;
}

interface HeyGenSetupWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
  initialStep?: WizardStep; // NOVO: permite começar em um passo específico
}

const HeyGenSetupWizard: React.FC<HeyGenSetupWizardProps> = ({ onComplete, onCancel, initialStep = 1 }) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialStep);
  
  // Step 1: API Key
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationError, setValidationError] = useState<string>("");
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [savingApiKey, setSavingApiKey] = useState(false);
  
  // Step 3: Avatar (voz opcional)
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  /**
   * Carrega avatares quando avança para o Passo 3
   */
  useEffect(() => {
    if (currentStep === 3 && avatars.length === 0) {
      loadAvatars();
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
      console.log("🔵 Primeiros 5 avatares:", data.avatars?.slice(0, 5).map((a: Avatar) => ({
        id: a.avatar_id,
        name: a.avatar_name,
        is_clone: a.is_clone
      })));
      setAvatars(data.avatars || []);
    } catch (error) {
      console.error("🔴 Erro ao carregar avatares:", error);
      showError("Erro ao carregar avatares. Tente novamente.");
    } finally {
      setLoadingAvatars(false);
    }
  };



  /**
   * Valida e salva a API Key imediatamente
   */
  const handleValidateAndSaveApiKey = async () => {
    if (!apiKey || apiKey.trim().length < 10) {
      showError("API Key deve ter pelo menos 10 caracteres");
      return;
    }

    setValidationState("loading");
    setSavingApiKey(true);
    setValidationError("");

    const toastId = showLoading("Validando e salvando API Key...");

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      // Chamar novo endpoint que valida E salva
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/heygen/save-api-key`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ api_key: apiKey }),
      });

      dismissToast(toastId);

      if (response.ok) {
        const data = await response.json();
        setValidationState("success");
        setCreditsRemaining(data.credits_remaining ?? null);
        showSuccess("API Key salva com sucesso! Agora vamos configurar seu avatar.");
        
        // Avançar para o Passo 2 (Guia de Avatar)
        setTimeout(() => setCurrentStep(2), 1000);
      } else {
        const data = await response.json();
        setValidationState("error");
        const errorMessage = data.detail || "Erro ao salvar API Key. Tente novamente.";
        setValidationError(errorMessage);
        showError(errorMessage);
      }
    } catch (error: any) {
      dismissToast(toastId);
      setValidationState("error");
      const errorMessage = error.message || "Erro ao validar API Key. Tente novamente.";
      setValidationError(errorMessage);
      showError(errorMessage);
      console.error("Erro ao validar API Key:", error);
    } finally {
      setSavingApiKey(false);
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
                if (e.key === "Enter" && validationState !== "loading" && !savingApiKey) {
                  handleValidateAndSaveApiKey();
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
            onClick={handleValidateAndSaveApiKey}
            disabled={!apiKey || apiKey.length < 10 || validationState === "loading" || savingApiKey}
            className="flex-1"
            variant="default"
          >
            {validationState === "loading" || savingApiKey ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar e Continuar"
            )}
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Renderiza o Passo 2: Guia de Criação de Avatar
   */
  const renderStep2 = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">Criar Seu Avatar Digital</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Para usar o AvatarAI, você precisa criar um clone digital no HeyGen.
          </p>
        </div>

        {/* Card de instruções */}
        <div className="bg-accent border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground mb-2">Como criar seu clone:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">1.</span>
                  <span>Clique em "Ir para HeyGen Studio" abaixo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">2.</span>
                  <span>Faça login com sua conta HeyGen</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">3.</span>
                  <span>Clique em "Create Avatar" e siga as instruções</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">4.</span>
                  <span>Grave um vídeo de 2 minutos seguindo o script</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">5.</span>
                  <span>Aguarde o processamento (pode levar algumas horas)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">6.</span>
                  <span>Volte aqui e clique em "Já criei meu avatar"</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Botão para HeyGen Studio */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => window.open('https://app.heygen.com/avatar', '_blank')}
            variant="default"
            size="lg"
            className="w-full"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Ir para HeyGen Studio
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Uma nova aba será aberta. Não feche esta página!
          </p>
        </div>

        {/* Informação adicional */}
        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-card-foreground">Dica:</span> O processo de criação do clone leva cerca de 5-10 minutos para gravar o vídeo, 
            e o processamento pode levar de 2 a 24 horas. Você pode fechar esta página e voltar depois.
          </p>
        </div>

        {/* Botões de navegação */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={() => setCurrentStep(1)}
            variant="outline"
          >
            ← Voltar
          </Button>
          <Button
            onClick={() => setCurrentStep(3)}
            variant="default"
            className="flex-1"
          >
            Já criei meu avatar →
          </Button>
          <Button
            onClick={() => {
              if (onComplete) onComplete();
            }}
            variant="ghost"
          >
            Pular por enquanto
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Renderiza o Passo 3: Seleção de Avatar
   */
  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-card-foreground">Selecionar Seu Avatar</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Escolha qual avatar você quer usar nos seus vídeos.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {avatars.map((avatar) => (
                <button
                  key={avatar.avatar_id}
                  onClick={() => handleSelectAvatar(avatar.avatar_id)}
                  disabled={savingAvatar}
                  className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                    selectedAvatarId === avatar.avatar_id
                      ? "border-primary shadow-sm"
                      : "border-border hover:border-primary/50"
                  } ${savingAvatar ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {/* Avatar Preview */}
                  <div className="relative aspect-[3/4] bg-muted">
                    {avatar.preview_image_url ? (
                      <img
                        src={avatar.preview_image_url}
                        alt={avatar.avatar_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}

                    {/* Overlay de seleção */}
                    {selectedAvatarId === avatar.avatar_id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </div>
                    )}

                    {/* Badge de clone */}
                    {avatar.is_clone && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded">
                        Clone
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="p-3">
                    <h4 className="font-medium text-card-foreground truncate">{avatar.avatar_name}</h4>
                    {avatar.gender && (
                      <p className="text-xs text-muted-foreground capitalize">{avatar.gender}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Botão para criar novo clone */}
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full p-6 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-accent transition-colors group"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Criar Novo Clone</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Voltar ao guia de criação
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Estado vazio */}
        {!loadingAvatars && avatars.length === 0 && (
          <div className="text-center py-12 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <User className="w-16 h-16 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold text-card-foreground mb-2">
                  Nenhum avatar encontrado
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Parece que você ainda não criou seu avatar no HeyGen, ou ele ainda está sendo processado.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setCurrentStep(2)} variant="default" size="lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Voltar ao Guia
              </Button>
              <Button onClick={loadAvatars} variant="outline" size="lg">
                <RefreshCw className="w-5 h-5 mr-2" />
                Atualizar Lista
              </Button>
            </div>
          </div>
        )}

        {/* Botões de navegação */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={() => setCurrentStep(2)}
            disabled={savingAvatar}
            variant="outline"
          >
            ← Voltar
          </Button>
          {selectedAvatarId && (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Avatar selecionado
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Salva o avatar selecionado
   */
  const handleSelectAvatar = async (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    setSavingAvatar(true);

    const toastId = showLoading("Salvando avatar...");

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/integrations/heygen/save-avatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_id: avatarId }),
      });

      dismissToast(toastId);

      if (response.ok) {
        showSuccess("Avatar configurado com sucesso!");
        
        // Aguardar 1 segundo e chamar onComplete
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1000);
      } else {
        const data = await response.json();
        throw new Error(data.detail || "Erro ao salvar avatar");
      }
    } catch (error: any) {
      dismissToast(toastId);
      console.error("Erro ao salvar avatar:", error);
      showError(error.message || "Erro ao salvar avatar. Tente novamente.");
      setSelectedAvatarId(""); // Limpar seleção em caso de erro
    } finally {
      setSavingAvatar(false);
    }
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
              Guia Avatar
            </span>
          </div>

          <div className="w-16 h-0.5 bg-border" />

          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
            <span className={`text-sm font-medium transition-colors ${currentStep === 3 ? "text-card-foreground" : "text-muted-foreground"}`}>
              Selecionar
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo do passo atual */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        {currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : renderStep3()}
      </div>
    </div>
  );
};

export default HeyGenSetupWizard;
