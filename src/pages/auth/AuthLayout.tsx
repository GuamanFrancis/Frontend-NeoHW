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
      <section className="grid min-h-screen grid-cols-1 lg:h-screen lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="lg:col-span-5 h-full"
        >
          <AuthSidePanel />
        </motion.div>

        <section className="lg:col-span-7 flex items-center justify-center bg-white px-5 py-6 dark:bg-neutral-950 sm:px-8 lg:h-full lg:overflow-y-auto lg:px-6 lg:py-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: 'easeOut' }}
            className={`my-auto w-full max-w-[540px] ${cardClassName}`}
          >
            {children}
          </motion.div>
        </section>
      </section>
    </main>
  );
};
