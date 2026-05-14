import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

type FormInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  icon?: ReactNode;
  endIcon?: ReactNode;
  optional?: boolean;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon, endIcon, optional = false, className = '', ...props }, ref) => {
    return (
      <label className="block">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">
          {label}
          {optional && (
            <span className="rounded-full border border-teal-500/40 px-2 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-300">
              Opcional
            </span>
          )}
        </span>
        <span className={`mt-1.5 flex h-12 items-center rounded-lg border bg-white px-3.5 text-slate-500 transition focus-within:ring-2 dark:bg-neutral-950/50 dark:text-neutral-300 ${error ? 'border-red-400 focus-within:ring-red-400/20' : 'border-slate-300 focus-within:border-teal-500 focus-within:ring-teal-400/20 dark:border-neutral-700 dark:focus-within:border-teal-400'}`}>
          {icon}
          <input
            ref={ref}
            className={`h-full w-full border-0 bg-transparent px-4 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-neutral-500 ${className}`}
            {...props}
          />
          {endIcon}
        </span>
        {error && <p className="mt-1 text-xs font-medium text-red-500 dark:text-red-300">{error}</p>}
      </label>
    );
  },
);

FormInput.displayName = 'FormInput';
