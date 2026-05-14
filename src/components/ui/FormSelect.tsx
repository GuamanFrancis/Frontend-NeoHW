import type { SelectHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

type SelectOption = {
  label: string;
  value: string;
};

type FormSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  options: SelectOption[];
};

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <label className="block">
        <span className="text-sm font-semibold text-slate-950 dark:text-white">{label}</span>
        <span className={`mt-1.5 flex h-12 items-center rounded-lg border bg-white px-3.5 text-slate-500 transition focus-within:ring-2 dark:bg-neutral-950/50 dark:text-neutral-300 ${error ? 'border-red-400 focus-within:ring-red-400/20' : 'border-slate-300 focus-within:border-teal-500 focus-within:ring-teal-400/20 dark:border-neutral-700 dark:focus-within:border-teal-400'}`}>
          <select
            ref={ref}
            className={`h-full w-full appearance-none border-0 bg-transparent text-sm font-medium text-slate-900 outline-none dark:text-neutral-200 ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="h-5 w-5 flex-none text-slate-500 dark:text-neutral-300" />
        </span>
        {error && <p className="mt-1 text-xs font-medium text-red-500 dark:text-red-300">{error}</p>}
      </label>
    );
  },
);

FormSelect.displayName = 'FormSelect';
