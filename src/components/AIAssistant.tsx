import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api, Message, ChatRequest, PageContext, ToolCall } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const AIAssistant: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pageContext, setPageContext] = useState<PageContext>({ 
    page_name: 'dashboard', 
    page_path: '/dashboard' 
  });
  
  // Estados para confirmação de ações destrutivas
  const [pendingAction, setPendingAction] = useState<ToolCall | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Mapa de contexto das páginas
  const contextMap: Record<string, PageContext> = {
    '/dashboard': { page_name: 'dashboard', page_path: '/dashboard' },
    '/module-1/script-ai': { page_name: 'scriptai', page_path: '/module-1/script-ai' },
    '/module-2/post-rapido': { page_name: 'postrapido', page_path: '/module-2/post-rapido' },
    '/module-3/avatar-ai': { page_name: 'avatarai', page_path: '/module-3/avatar-ai' },
    '/calendar': { page_name: 'calendar', page_path: '/calendar' },
    '/analytics': { page_name: 'analytics', page_path: '/analytics' },
    '/settings': { page_name: 'settings', page_path: '/settings' },
  };

  // Detectar contexto da página
  useEffect(() => {
    const path = location.pathname;
    const context = contextMap[path] || { page_name: 'dashboard', page_path: '/dashboard' };
    setPageContext(context);
  }, [location.pathname]);

  // Carregar histórico do sessionStorage
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('ai_assistant_history');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  }, []);

  // Salvar histórico no sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      // Limitar a 50 mensagens
      const limitedMessages = messages.slice(-50);
      sessionStorage.setItem('ai_assistant_history', JSON.stringify(limitedMessages));
    }
  }, [messages]);

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToolCalls = (toolCalls: ToolCall[]) => {
    toolCalls.forEach((tool) => {
      // Navegação
      if (tool.tool_name === 'navigate' && tool.executed) {
        const targetPage = tool.arguments?.page;
        if (targetPage) {
          const routeMap: Record<string, string> = {
            dashboard: '/dashboard',
            scriptai: '/module-1/script-ai',
            postrapido: '/module-2/post-rapido',
            avatarai: '/module-3/avatar-ai',
            calendar: '/calendar',
            analytics: '/analytics',
            settings: '/settings',
          };
          
          const route = routeMap[targetPage];
          if (route) {
            setIsOpen(false);
            navigate(route);
            toast({
              title: 'Navegação',
              description: `Redirecionando para ${targetPage}`,
            });
          }
        }
      }

      // Ações que requerem confirmação (verificar no ChatResponse, não no ToolCall individual)
      // O campo requires_confirmation está no ChatResponse, não no ToolCall
    });
  };

  const handleConfirmAction = () => {
    if (pendingAction) {
      toast({
        title: 'Ação confirmada',
        description: `Executando: ${pendingAction.tool_name}`,
      });
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const handleCancelAction = () => {
    toast({
      title: 'Ação cancelada',
      description: 'A ação não foi executada',
    });
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const clearHistory = () => {
    setMessages([]);
    sessionStorage.removeItem('ai_assistant_history');
    toast({
      title: 'Histórico limpo',
      description: 'Todas as mensagens foram removidas',
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const request: ChatRequest = {
        message: input.trim(),
        context: pageContext,
        history: messages,
      };

      const response = await api.assistant.chat(request);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Processar tool calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        handleToolCalls(response.tool_calls);
      }

      // Verificar se requer confirmação
      if (response.requires_confirmation && response.tool_calls && response.tool_calls.length > 0) {
        setPendingAction(response.tool_calls[0]);
        setShowConfirmDialog(true);
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao processar mensagem',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* FAB - Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 z-50 flex items-center justify-center"
        aria-label="Abrir AI Assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Drawer Lateral */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:w-[500px] flex flex-col p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle>🤖 AI Assistant</SheetTitle>
            <SheetDescription>
              Seu assistente inteligente para gerenciar redes sociais
            </SheetDescription>
          </SheetHeader>

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 mt-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Olá! Como posso ajudar você hoje?</p>
                <p className="text-sm mt-2">
                  Estou aqui para ajudar com scripts, agendamentos, analytics e muito mais.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))
            )}

            {isProcessing && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Área de Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2 mb-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isProcessing}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {messages.length > 0 && (
              <Button
                onClick={clearHistory}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar histórico
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Confirmação para Ações Destrutivas */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction && (
                <>
                  Você está prestes a executar: <strong>{pendingAction.tool_name}</strong>
                  <br />
                  <br />
                  Esta ação não pode ser desfeita. Deseja continuar?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Componente de Mensagem
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
          }`}
        >
          {isUser ? '👤' : '🤖'}
        </div>

        {/* Conteúdo */}
        <div>
          <div
            className={`rounded-lg p-3 ${
              isUser
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-900'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>

          {/* Timestamp */}
          <div className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Indicador de Digitação
const TypingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start">
      <div className="flex gap-2">
        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
          🤖
        </div>
        <div className="bg-slate-100 rounded-lg p-3">
          <div className="flex gap-1">
            <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
