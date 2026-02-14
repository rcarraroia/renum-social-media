import React, { createContext, useContext, useEffect, useMemo } from "react";
import { create } from "zustand";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  ts: number;
};

type AssistantContextShape = {
  open: boolean;
  setOpen: (v: boolean) => void;
  sendMessage: (text: string, extraContext?: any) => Promise<void>;
  addMessage: (m: Message) => void;
  clear: () => void;
  getMessages: () => Message[];
  setContext: (ctx: Record<string, any>) => void;
  getContext: () => Record<string, any>;
  // action listeners
  onAction: (fn: (action: any) => void) => () => void;
  executeAction: (action: any) => Promise<void>;
};

const AssistantContext = createContext<AssistantContextShape | null>(null);

// zustand store for messages (keeps last 50)
type Store = {
  messages: Message[];
  addMessage: (m: Message) => void;
  clear: () => void;
};
export const useAssistantStore = create<Store>((set, get) => ({
  messages: [],
  addMessage: (m) =>
    set((s) => {
      const next = [...s.messages, m].slice(-50);
      return { messages: next };
    }),
  clear: () => set({ messages: [] }),
}));

export const AIAssistantProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const [context, setContextState] = React.useState<Record<string, any>>({});
  const listenersRef = React.useRef<Array<(action: any) => void>>([]);

  const addMessage = (m: Message) => {
    useAssistantStore.getState().addMessage(m);
  };

  const clear = () => {
    useAssistantStore.getState().clear();
  };

  const getMessages = () => {
    return useAssistantStore.getState().messages;
  };

  const setContext = (ctx: Record<string, any>) => {
    setContextState((prev) => ({ ...prev, ...ctx }));
  };

  const getContext = () => context;

  // sendMessage: send to backend /api/assistant/chat
  const sendMessage = async (text: string, extraContext?: any) => {
    const userMsg: Message = { id: String(Date.now()), role: "user", content: text, ts: Date.now() };
    addMessage(userMsg);

    try {
      const payload = {
        message: text,
        context: { ...(context ?? {}), ...(extraContext ?? {}) },
        conversationHistory: getMessages().map((m) => ({ role: m.role, content: m.content })),
      };

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const textErr = await res.text();
        const assistantErr: Message = { id: String(Date.now() + 1), role: "assistant", content: `Erro: ${textErr || res.statusText}`, ts: Date.now() };
        addMessage(assistantErr);
        return;
      }

      const j = await res.json();

      // j.message (assistant reply) and optional j.action
      const assistantMsg: Message = { id: String(Date.now() + 2), role: "assistant", content: j.message ?? "Sem resposta", ts: Date.now() };
      addMessage(assistantMsg);

      if (j.action) {
        // notify listeners
        listenersRef.current.forEach((l) => {
          try {
            l(j.action);
          } catch (e) {
            // ignore
          }
        });
      }
    } catch (e: any) {
      const assistantErr: Message = { id: String(Date.now() + 3), role: "assistant", content: `Erro ao conectar ao assistente: ${e?.message ?? e}`, ts: Date.now() };
      addMessage(assistantErr);
    }
  };

  const onAction = (fn: (action: any) => void) => {
    listenersRef.current.push(fn);
    return () => {
      const idx = listenersRef.current.indexOf(fn);
      if (idx >= 0) listenersRef.current.splice(idx, 1);
    };
  };

  const executeAction = async (action: any) => {
    // default behavior: put an assistant system message about execution and dispatch
    const systemMsg: Message = { id: String(Date.now()), role: "system", content: `Executando ação: ${action.type}`, ts: Date.now() };
    addMessage(systemMsg);
    // dispatch to listeners (same as above)
    listenersRef.current.forEach((l) => {
      try {
        l(action);
      } catch (e) {}
    });
  };

  const value = useMemo(
    () => ({
      open,
      setOpen,
      sendMessage,
      addMessage,
      clear,
      getMessages,
      setContext,
      getContext,
      onAction,
      executeAction,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, context],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
};

export function useAIAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAIAssistant must be used within AIAssistantProvider");
  }
  return ctx;
}