import React from 'react';
import { Send, Loader2, X, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../../../services/aiService';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  aiLoading: boolean;
  chatInput: string;
  setChatInput: (input: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  chatBottomRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  aiLoading,
  chatInput,
  setChatInput,
  onSubmit,
  chatBottomRef,
}) => {
  const [showSuggestion, setShowSuggestion] = React.useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-[380px] h-[520px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-teal-500 dark:bg-teal-600 text-slate-950 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-slate-950" />
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-950">Asistente de Hardware IA</h4>
            <p className="text-[9px] font-semibold text-slate-950/60 -mt-0.5">En línea</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-955 hover:bg-black/10 p-1.5 rounded-lg transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-955/10 scrollbar-hide">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex max-w-[98%] ${msg.role === 'user' ? 'ml-auto' : ''}`}
          >
            <div
              className={`rounded-2xl px-3 py-2 text-sm font-medium leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-teal-500 text-slate-955 rounded-tr-none font-semibold'
                  : 'bg-white border border-slate-205 dark:bg-neutral-900 dark:border-neutral-850 text-slate-800 dark:text-neutral-205 rounded-tl-none'
              }`}
            >
              {msg.content.split('\n').map((line, idx) => {
                const parts: React.ReactNode[] = [];
                let lastIdx = 0;
                const boldRe = /\*\*(.*?)\*\*/g;
                let match;
                while ((match = boldRe.exec(line)) !== null) {
                  parts.push(line.substring(lastIdx, match.index));
                  parts.push(
                    <strong key={match.index} className="font-semibold text-slate-950 dark:text-white">
                      {match[1]}
                    </strong>
                  );
                  lastIdx = boldRe.lastIndex;
                }
                parts.push(line.substring(lastIdx));
                return (
                  <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                    {parts.length > 1 ? parts : line}
                  </p>
                );
              })}
            </div>
          </div>
        ))}
        {aiLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex max-w-[98%]">
            <div className="bg-white border border-slate-250 dark:bg-neutral-900 dark:border-neutral-850 rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500 dark:text-teal-400" />
              <span className="text-xs text-slate-400 font-semibold animate-pulse">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {showSuggestion && messages.length === 0 && (
        <div className="p-2 bg-slate-100 dark:bg-neutral-900/50 border-t border-slate-205 dark:border-neutral-800/60 flex justify-center shrink-0">
          <button
            type="button"
            onClick={() => {
              setChatInput('Analizar compatibilidad y rendimiento de mi ensamble actual');
              setShowSuggestion(false);
            }}
            className="w-full bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-850 text-slate-800 dark:text-neutral-200 hover:text-teal-500 dark:hover:text-teal-400 hover:border-teal-500/40 dark:hover:border-teal-500/40 transition text-xs font-semibold px-4 py-2 rounded-xl text-center cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-teal-500" /> Analizar compatibilidad y rendimiento de mi ensamble actual
          </button>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Preguntar..."
          disabled={aiLoading}
          className="flex-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-teal-500 transition font-medium"
        />
        <button
          type="submit"
          disabled={aiLoading || !chatInput.trim()}
          className="h-9 w-9 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 flex items-center justify-center transition shrink-0 disabled:opacity-50 cursor-pointer border-none"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
