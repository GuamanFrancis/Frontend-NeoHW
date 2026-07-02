import type { ReactNode } from 'react';

type PageCardProps = {
  title?: string;
  text?: string;
  children?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
};

export const PageCard = ({ title, text, children, icon, actions }: PageCardProps) => {
  const hasHeader = title || text || icon || actions;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm shadow-slate-200/70 dark:bg-neutral-900 dark:shadow-black/20">
      {hasHeader && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            {icon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
                {icon}
              </div>
            )}

            {(title || text) && (
              <div>
                {title && (
                  <h1 className="text-2xl font-light tracking-wide text-slate-950 dark:text-white uppercase border-l-4 border-blue-600 pl-3">
                    {title}
                  </h1>
                )}
                {text && (
                  <p className="mt-1.5 text-sm font-normal text-slate-955 dark:text-white">
                    {text}
                  </p>
                )}
              </div>
            )}
          </div>

          {actions && <div className="flex shrink-0">{actions}</div>}
        </div>
      )}

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
};
