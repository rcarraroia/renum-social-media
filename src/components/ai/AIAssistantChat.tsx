import React from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAIAssistant } from "./AIAssistantProvider";
import { useDebouncedCallback } from "use-debounce";

type LocalMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
};

const ChatMessage: React.FC<{ m: LocalMessage }> = ({ m }) => {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-3 py-1`}>
      <div className={`${isUser ? "bg-indigo-600 text-white" : "bg-gray-100 text-slate-900"} rounded-md p-3 max-w-[80%]`}>
        <div className="text-sm whitespace-pre-wrap">{m.content}</div>
        <div className="text-[10px] text-slate-400 mt-2 text-right">{new Date(m.ts).toLocaleTimeString()}</div>
      </div>
    </div>
  );
};

const WelcomeMessage = ({ page }: { page: string }) => {
  const examples =
    page.indexOf("module-1") >= 0
      ? ["Melhore este script", "Torne mais informal", "Reduza para 30 segundos"]
      : page.indexOf("module-2") >= 0
      ? ["Reescreva a descrição para LinkedIn", "Agende para terça 18h", "Mudar estilo de legenda"]
      : page.indexOf("analytics") >= 0
      ? ["Resuma meu desempenho", "Qual meu melhor post?"]
      : ["Como posso ajudar você hoje?", "Me mostre atalhos úteis"];

  return (
    <div className="p-4">
      <div className="text-sm text-slate-700">Olá! Sou o assistente do RENUM. Posso ajudar com tarefas na página atual.</div>
      <div className="mt-3 flex gap-2 overflow-auto">
        {examples.slice(0, 3).map((ex) => (
          <button
            key={ex}
            onClick={() => {
              // dispatch outside via custom event; simplified: user will click chip to populate
              const ev = new CustomEvent("assistant-suggestion", { detail: ex });
              window.dispatchEvent(ev);
            }}
            className="text-xs px-3 py-1 rounded border hover:bg-slate-100"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
};

const AIAssistantChat: React.FC = () => {
  const assistant = useAIAssistant();
  const location = useLocation();
  const messages = (assistant.getMessages() ?? []) as LocalMessage[];
  const [localOpen, setLocalOpen] = React.useState<boolean>(assistant.open);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [unread, setUnread] = React.useState(0);

  // sync open with provider
  React.useEffect(() => {
    setLocalOpen(assistant.open);
  }, [assistant.open]);

  React.useEffect(() => {
    const onSuggestion = (e: any) => {
      const text = e.detail as string;
      setInput(text);
      // optionally send
      handleSend(text);
    };
    window.addEventListener("assistant-suggestion", onSuggestion as EventListener);
    return () => window.removeEventListener("assistant-suggestion", onSuggestion as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // register action handler: pages can subscribe by useAIAssistant().onAction(...)
  React.useEffect(() => {
    const unsub = assistant.onAction((action) => {
      // basic handling for navigation and notifications
      if (action.type === "navigate" && action.params?.to) {
        window.location.href = action.params.to;
      }
      // further action handling is done by pages that register listeners to provider
      // show assistant confirmation message
      assistant.addMessage({ id: String(Date.now()), role: "assistant", content: `Ação recebida: ${action.type}`, ts: Date.now() });
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // track unread when closed
  React.useEffect(() => {
    const handle = setInterval(() => {
      // pulse / suggestions logic; not implemented server-side here
    }, 60000);
    return () => clearInterval(handle);
  }, []);

  React.useEffect(() => {
    if (!localOpen) {
      // count unread (messages after last open)
      setUnread((assistant.getMessages() ?? []).filter(Boolean).length);
    } else {
      setUnread(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localOpen]);

  const pageContext = React.useMemo(() => {
    return {
      currentPage: (() => {
        const p = location.pathname;
        if (p.includes("/module-1")) return "script-ai";
        if (p.includes("/module-2")) return "post-rapido";
        if (p.includes("/module-3")) return "avatar-ai";
        if (p.includes("/analytics")) return "analytics";
        if (p.includes("/calendar")) return "calendar";
        if (p.includes("/settings")) return "settings";
        return "dashboard";
      })(),
      pathname: location.pathname,
    };
  }, [location.pathname]);

  const handleSend = useDebouncedCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) return;
      setSending(true);
      try {
        await assistant.sendMessage(text, pageContext);
        setInput("");
        setSending(false);
      } catch {
        setSending(false);
      }
    },
    300,
    { leading: true },
  );

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => {
          assistant.setOpen(!assistant.open);
          assistant.setOpen(!assistant.open);
          setLocalOpen((s) => !s);
        }}
        aria-label="Abrir assistente"
        className="fixed bottom-[calc(24px+env(safe-area-inset-bottom))] right-6 z-[60] w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg"
      >
        <MessageSquare className="w-6 h-6" />
        {unread > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{unread}</span>}
      </button>

      {/* Chat panel */}
      {assistant.open && (
        <div className="fixed bottom-24 right-6 z-[61] w-[92vw] max-w-[400px] md:w-[400px] md:h-[600px] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700">🤖</div>
              <div>
                <div className="font-medium">Assistente RENUM</div>
                <div className="text-xs text-slate-500">{pageContext.currentPage}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => assistant.clear()} className="text-sm text-slate-500">Limpar</button>
              <button
                onClick={() => {
                  assistant.setOpen(false);
                  setLocalOpen(false);
                }}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-2" id="assistant-messages">
            {messages.length === 0 ? (
              <WelcomeMessage page={pageContext.currentPage} />
            ) : (
              messages.map((m: any) => <ChatMessage key={m.id} m={m as LocalMessage} />)
            )}
          </div>

          <div className="p-2 border-t">
            <div className="flex items-center gap-2">
              <textarea
                placeholder={`Pergunte sobre ${pageContext.currentPage}...`}
                className="flex-1 rounded border p-2 resize-none max-h-24"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistantChat;