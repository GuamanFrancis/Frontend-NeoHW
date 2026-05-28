import React from 'react';
import { Send, Loader2, X } from 'lucide-react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40 w-[380px] h-[520px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-8rem)] rounded-2xl bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-teal-500 dark:bg-teal-600 text-slate-950 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Arquitecto AI</h4>
            <p className="text-[9px] font-bold text-slate-900/60 -mt-0.5">En línea</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-950 hover:bg-black/10 p-1.5 rounded-lg transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-neutral-950/30 scrollbar-hide">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div
              className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 border text-[10px] ${
                msg.role === 'user'
                  ? 'bg-slate-200 border-slate-300 text-slate-700 dark:bg-neutral-850 dark:border-neutral-800 dark:text-neutral-300'
                  : 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400'
              }`}
            >
              {msg.role === 'user' ? '👤' : '🧠'}
            </div>
            <div
              className={`rounded-2xl px-3 py-2 text-[11px] font-medium leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-teal-500 text-slate-950 rounded-tr-none font-semibold'
                  : 'bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-850 text-slate-800 dark:text-neutral-200 rounded-tl-none'
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
                    <strong key={match.index} className="font-extrabold">
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
        {aiLoading && (
          <div className="flex gap-2.5 max-w-[85%]">
            <div className="h-6 w-6 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 text-[10px] animate-pulse">
              🧠
            </div>
            <div className="bg-white border border-slate-200 dark:bg-neutral-900/100 dark:border-neutral-850 rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-500 dark:text-teal-400" />
              <span className="text-[10px] text-slate-400 font-semibold animate-pulse">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      <div className="p-2 bg-slate-100 dark:bg-neutral-900/50 border-t border-slate-200 dark:border-neutral-800/60 overflow-x-auto whitespace-nowrap flex gap-1.5 shrink-0 scrollbar-none">
        {[
          '¿Qué motherboard me recomiendas para un Ryzen 5 7600X?',
          '¿Es compatible DDR5 con la placa MSI PRO B760-P?',
          '¿Cuántos Watts de fuente necesito para i5 + RTX 4070?',
          'Verifica mi ensamble de hardware actual.',
        ].map((text, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setChatInput(text)}
            className="inline-block bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-850 text-slate-650 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 hover:border-slate-300 dark:hover:border-neutral-700 transition text-[9px] font-bold px-2.5 py-1.5 rounded-lg whitespace-normal text-left max-w-[150px] cursor-pointer shadow-sm"
          >
            {text}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="p-3 border-t border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Pregúntale al Arquitecto de Hardware..."
          disabled={aiLoading}
          className="flex-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-[11px] text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-teal-500 transition font-medium"
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
