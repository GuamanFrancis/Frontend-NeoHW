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

const parseInlineMarkdown = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  const regex = /(\*\*(.*?)\*\*|`(.*?)`)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    if (match[2] !== undefined) {
      parts.push(
        <strong key={match.index} className="font-bold text-slate-950 dark:text-white">
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-medium whitespace-nowrap">
          {match[3]}
        </code>
      );
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }
  return parts.length > 0 ? parts : text;
};

const renderMessageContent = (content: string): React.ReactNode[] => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = (key: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  const flushTable = (key: number) => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      elements.push(
        <div key={`table-wrapper-${key}`} className="overflow-x-auto my-2 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-sm scrollbar-thin">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-neutral-800 text-xs">
            {tableHeaders.length > 0 && (
              <thead className="bg-slate-100 dark:bg-neutral-800/80">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-bold text-slate-800 dark:text-neutral-200 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-slate-150 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
              {tableRows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-neutral-900' : 'bg-slate-50/50 dark:bg-neutral-950/20'}>
                  {row.map((val, i) => (
                    <td key={i} className="px-3 py-2 text-slate-700 dark:text-neutral-300 font-medium">
                      {parseInlineMarkdown(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (inList) flushList(i);
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const isSeparator = cells.every(c => c.startsWith(':') || c.startsWith('-') || c.endsWith(':'));
      if (isSeparator) {
        inTable = true;
        continue;
      }
      if (!inTable) {
        tableHeaders = cells;
        inTable = true;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      if (inTable) flushTable(i);
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      inList = true;
      const text = line.substring(2);
      listItems.push(
        <li key={`li-${i}`} className="text-slate-700 dark:text-neutral-300">
          {parseInlineMarkdown(text)}
        </li>
      );
      continue;
    } else {
      if (inList) flushList(i);
    }

    if (line === '') {
      continue;
    }
    elements.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed text-slate-700 dark:text-neutral-300">
        {parseInlineMarkdown(line)}
      </p>
    );
  }

  if (inTable) flushTable(lines.length);
  if (inList) flushList(lines.length);
  return elements;
};

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
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border-b border-indigo-500/20 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Asistente de Compatibilidad IA</h4>
            <p className="text-[9px] font-semibold text-indigo-300/80 -mt-0.5">En línea</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-neutral-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-neutral-900/40 scrollbar-hide">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex max-w-[98%] ${msg.role === 'user' ? 'ml-auto' : ''}`}
          >
            <div
              className={`rounded-2xl px-3 py-2 text-sm font-medium leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none font-semibold'
                  : 'bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 text-slate-800 dark:text-white rounded-tl-none'
              }`}
            >
              {renderMessageContent(msg.content)}
            </div>
          </div>
        ))}
        {aiLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex max-w-[98%]">
            <div className="bg-white border border-slate-200 dark:bg-neutral-900 dark:border-neutral-800 rounded-2xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-2 shadow-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500 dark:text-indigo-400" />
              <span className="text-xs text-slate-400 font-semibold animate-pulse">Pensando...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {showSuggestion && messages.length <= 1 && (
        <div className="p-3 bg-slate-100 dark:bg-neutral-900/50 border-t border-slate-200 dark:border-neutral-800/60 flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block mb-1">
            Preguntas sugeridas / FAQs:
          </span>
          <button
            type="button"
            onClick={() => {
              setChatInput('¿Qué procesadores tienen en inventario actualmente?');
              setShowSuggestion(false);
            }}
            className="w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition text-xs font-semibold px-3 py-2 rounded-xl text-left cursor-pointer shadow-sm flex items-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> ¿Qué procesadores tienen en inventario?
          </button>
          
          <button
            type="button"
            onClick={() => {
              setChatInput('¿Qué gabinetes tienen disponibles en inventario?');
              setShowSuggestion(false);
            }}
            className="w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition text-xs font-semibold px-3 py-2 rounded-xl text-left cursor-pointer shadow-sm flex items-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> ¿Qué gabinetes tienen en inventario?
          </button>

          <button
            type="button"
            onClick={() => {
              setChatInput('Recomiéndame una configuración de PC gamer compatible');
              setShowSuggestion(false);
            }}
            className="w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition text-xs font-semibold px-3 py-2 rounded-xl text-left cursor-pointer shadow-sm flex items-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> Recomiéndame una PC gamer
          </button>

          <button
            type="button"
            onClick={() => {
              setChatInput('¿Cómo funciona la verificación de compatibilidad de componentes?');
              setShowSuggestion(false);
            }}
            className="w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-800 dark:text-neutral-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition text-xs font-semibold px-3 py-2 rounded-xl text-left cursor-pointer shadow-sm flex items-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" /> ¿Cómo analizo la compatibilidad?
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
          className="flex-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500 transition font-medium"
        />
        <button
          type="submit"
          disabled={aiLoading || !chatInput.trim()}
          className="h-9 w-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shrink-0 disabled:opacity-50 cursor-pointer border-none"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
