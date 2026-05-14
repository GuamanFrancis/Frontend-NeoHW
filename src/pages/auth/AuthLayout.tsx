import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AuthSidePanel } from './AuthSidePanel';

type AuthLayoutProps = {
  children: ReactNode;
  cardClassName?: string;
};

export const AuthLayout = ({ children, cardClassName = '' }: AuthLayoutProps) => {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-neutral-950 dark:text-white lg:h-screen lg:overflow-hidden">
      <section className="grid min-h-screen grid-cols-1 lg:h-screen lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full"
        >
          <AuthSidePanel />
        </motion.div>

        <section className="flex items-center justify-center bg-slate-50 px-5 py-8 dark:bg-neutral-950 sm:px-8 lg:h-full lg:px-6 lg:py-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: 'easeOut' }}
            className={`w-full max-w-[600px] rounded-3xl border border-slate-200 bg-white px-7 shadow-xl shadow-slate-200/80 ring-1 ring-black/5 dark:border-teal-400/35 dark:bg-neutral-900/85 dark:shadow-teal-950/30 dark:ring-white/10 sm:px-10 ${cardClassName}`}
          >
            {children}
          </motion.div>
        </section>
      </section>
    </main>
  );
};
