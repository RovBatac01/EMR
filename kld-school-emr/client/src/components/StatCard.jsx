import { motion } from 'framer-motion';
export default function StatCard({ label, value, icon: Icon, detail, tone='green' }) {
  const tones={green:'bg-kld-600 text-white',yellow:'bg-accent text-kld-950',blue:'bg-blue-600 text-white',red:'bg-red-600 text-white',slate:'bg-slate-800 text-white'};
  return <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} className="surface relative overflow-hidden p-5">
    <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p><p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{value ?? '—'}</p>{detail&&<p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p>}</div><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]||tones.green}`}><Icon size={23}/></div></div>
  </motion.div>;
}
