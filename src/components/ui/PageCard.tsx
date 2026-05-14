import type { ReactNode } from 'react';

type PageCardProps = {
  title: string;
  text: string;
  children?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
};

export const PageCard = ({ title, text, children, icon, actions }: PageCardProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/70 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
              {icon}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{title}</h1>
            <p className="mt-2 text-slate-600 dark:text-neutral-300">{text}</p>
          </div>
        </div>

        {actions && <div className="flex shrink-0">{actions}</div>}
      </div>

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
};
