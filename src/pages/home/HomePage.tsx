import { motion } from 'framer-motion';
import { ArrowRight, Box, UserPlus } from 'lucide-react';
import { Link } from 'react-router';

export const HomePage = () => {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <div className="mb-8 inline-flex items-center gap-3">
            <Box className="h-12 w-12 text-blue-500" strokeWidth={2.6} />
            <span className="text-4xl font-extrabold">
              Neo<span className="text-blue-500">HW</span>
            </span>
          </div>

          <h1 className="text-5xl font-extrabold leading-tight tracking-normal sm:text-6xl">
            Ensambla tu PC con compatibilidad inteligente.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Vista publica inicial para presentar NeoHW y llevar a los usuarios hacia el acceso o el registro.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-lg bg-blue-600 px-7 text-base font-bold text-white transition hover:bg-blue-700"
            >
              Ir a login
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/registro"
              className="inline-flex h-14 items-center justify-center gap-3 rounded-lg border border-white/20 px-7 text-base font-bold text-white transition hover:border-blue-400 hover:text-blue-300"
            >
              Registrarse
              <UserPlus className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
};
