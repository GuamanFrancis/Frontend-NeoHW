import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  title: string;
  text?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
};

export const Modal = ({ open, title, text, children, footer, onClose, className = 'max-w-xl p-6' }: ModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-neutral-800 dark:bg-neutral-950 dark:shadow-black/50 ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">{title}</h2>
            {text && <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">{text}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/10"
            aria-label="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">{children}</div>
        {footer && <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
};
