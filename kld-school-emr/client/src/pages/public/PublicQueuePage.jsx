import { useEffect, useState } from 'react';
import { Clock3, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import LogoMark from '../../components/LogoMark';
import StatusBadge from '../../components/StatusBadge';
import Alert from '../../components/Alert';

export default function PublicQueuePage() {
  const { settings } = useSettings();
  const [data, setData] = useState({ queue: [] });
  const [error, setError] = useState('');
  const date = new URLSearchParams(location.search).get('date') || new Date().toISOString().slice(0, 10);
  const load = () => api.get('/queue/public', { params: { date } }).then(({ data: response }) => { setData(response.data); setError(''); }).catch((requestError) => setError(requestError.message));
  useEffect(() => { load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, [date]);
  return <main className="min-h-screen bg-kld-950 p-5 text-white sm:p-8"><div className="mx-auto max-w-6xl"><header className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><LogoMark className="h-14 w-14"/><div><h1 className="text-2xl font-black sm:text-4xl">{settings.clinic_name} Queue</h1><p className="mt-1 text-white/65">Queue numbers only. No medical information is displayed.</p></div></div><button className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 font-bold" onClick={load}><RefreshCw size={18}/>Refresh</button></header>{error && <div className="mt-6"><Alert>{error}</Alert></div>}<section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.queue?.map((row) => <article key={row.queue_number} className={`rounded-3xl border p-6 ${row.status === 'CALLED' ? 'border-accent bg-accent text-kld-950 shadow-glow' : 'border-white/10 bg-white/5'}`}><div className="text-sm font-bold uppercase tracking-[.18em] opacity-70">Queue number</div><div className="mt-2 text-6xl font-black">#{row.queue_number}</div><div className="mt-5 flex items-center justify-between gap-3"><StatusBadge value={row.status}/><span className="inline-flex items-center gap-1 text-sm font-bold"><Clock3 size={16}/>{row.priority === 'EMERGENCY' || row.priority === 'URGENT' ? 'Priority' : 'Standard'}</span></div></article>)}{!data.queue?.length && <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-white/65 sm:col-span-2 lg:col-span-3">No active queue entries.</div>}</section></div></main>;
}
