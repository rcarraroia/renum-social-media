import React from "react";
import { X, Sparkles } from "lucide-react";
import type { ProactiveTrigger } from "@/hooks/useProactiveAssistant";

interface Props {
  trigger: ProactiveTrigger;
  onDismiss: () => void;
  onAction: (action: string) => void;
}

const ProactiveAssistantNotification: React.FC<Props> = ({ trigger, onDismiss, onAction }) => {
  return (
    <div className="fixed bottom-24 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <div className={`bg-white rounded-lg shadow-2xl border-2 border-indigo-200 overflow-hidden ${trigger.pulse ? "animate-pulse" : ""}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-white font-bold">Rena</div>
              <div className="text-white/80 text-xs">Sua assistente de IA</div>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {trigger.message}
          </div>

          {/* Actions */}
          {trigger.actions && trigger.actions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {trigger.actions.map((action) => (
                <button
                  key={action}
                  onClick={() => onAction(action)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Celebration */}
          {trigger.celebration && (
            <div className="mt-4 text-center">
              <div className="text-4xl animate-bounce">🎉</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProactiveAssistantNotification;
