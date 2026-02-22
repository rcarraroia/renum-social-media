import React from "react";
import { ExternalLink, RefreshCw, Camera, Upload, Sparkles, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HeyGenCloneGuideProps {
  onClose: () => void;
  onRefresh: () => void;
}

/**
 * Modal com guia passo a passo para criar um clone no HeyGen
 */
const HeyGenCloneGuide: React.FC<HeyGenCloneGuideProps> = ({ onClose, onRefresh }) => {
  const handleGoToHeyGen = () => {
    window.open("https://app.heygen.com/avatars", "_blank", "noopener,noreferrer");
  };

  const handleRefreshAndClose = () => {
    onRefresh();
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Como Criar Seu Clone Digital</DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para criar um avatar personalizado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Passo 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">1</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary" />
                Acesse o HeyGen
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Clique no botão abaixo para abrir a plataforma HeyGen em uma nova aba.
              </p>
              <Button onClick={handleGoToHeyGen} variant="default">
                Ir para HeyGen
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">2</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                grave ou Envie seu Vídeo
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                No HeyGen, vá para a seção "Avatars" e clique em "Create Avatar" ou "Instant Avatar".
              </p>
              <div className="bg-muted border border-border rounded-md p-4 space-y-2">
                <p className="text-sm text-card-foreground font-medium">Requisitos do vídeo:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  <li>Duração: 2-5 minutos</li>
                  <li>Qualidade: HD (1080p recomendado)</li>
                  <li>Iluminação: Boa iluminação frontal</li>
                  <li>Fundo: Neutro e sem distrações</li>
                  <li>Áudio: Claro e sem ruídos</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">3</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Envie e Processe
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Faça upload do seu vídeo e aguarde o processamento. Isso pode levar de alguns minutos a algumas horas, dependendo da fila.
              </p>
              <div className="bg-accent border border-border rounded-md p-3">
                <p className="text-sm text-accent-foreground">
                  💡 <strong>Dica:</strong> Você receberá um email quando seu clone estiver pronto!
                </p>
              </div>
            </div>
          </div>

          {/* Passo 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">4</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Clone Criado!
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Quando seu clone estiver pronto, volte aqui e clique em "Atualizar lista" para vê-lo disponível.
              </p>
            </div>
          </div>

          {/* Passo 5 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground mb-2 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Atualizar Lista
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Depois que seu clone estiver pronto no HeyGen, clique no botão abaixo para atualizar a lista de avatares.
              </p>
              <Button onClick={handleRefreshAndClose} variant="default">
                <RefreshCw className="w-4 h-4" />
                Atualizar Lista de Avatares
              </Button>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="bg-muted border border-border rounded-md p-4">
            <h4 className="font-semibold text-card-foreground mb-2">Informações Importantes</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>O processo de criação do clone é feito diretamente na plataforma HeyGen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Clones podem levar de 30 minutos a 24 horas para serem processados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Você pode criar múltiplos clones com diferentes estilos e roupas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Clones premium oferecem melhor qualidade e mais expressões faciais</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
          <Button onClick={handleGoToHeyGen} variant="default">
            Ir para HeyGen
            <ExternalLink className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HeyGenCloneGuide;
