import { BrainCircuit } from 'lucide-react';
import { PageCard } from '../../components/ui/PageCard';

export const SimulatorPage = () => {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950 dark:bg-neutral-950 dark:text-white">
      <PageCard
        title="Simulador de compatibilidad"
        text="Aqui se preparara la experiencia publica para probar componentes antes de registrarse."
        icon={<BrainCircuit className="h-6 w-6" />}
      />
    </main>
  );
};
