import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  fullWidth?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
};

const variants = {
  primary: 'bg-teal-500 text-white shadow-lg shadow-teal-950/20 hover:bg-teal-400 dark:shadow-teal-950/40',
  outline: 'border border-teal-500/45 text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-white/10',
  ghost: 'text-slate-700 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/10',
};

export const Button = ({
  children,
  className = '',
  fullWidth = false,
  variant = 'primary',
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`inline-flex h-12 items-center justify-center gap-3 rounded-lg px-6 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
