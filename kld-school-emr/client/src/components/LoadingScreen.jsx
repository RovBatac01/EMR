import { motion } from 'framer-motion';
import { HeartPulse } from 'lucide-react';

export default function LoadingScreen({ label = 'Loading clinic workspace…', compact = false }) {
  return <div className={compact ? 'flex items-center justify-center py-12' : 'flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950'}>
    <div className="text-center">
      <motion.div animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-kld-600 text-white shadow-glow">
        <HeartPulse size={28} />
      </motion.div>
      <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  </div>;
}
