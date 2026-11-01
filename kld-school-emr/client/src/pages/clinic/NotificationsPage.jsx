import { useEffect, useState } from 'react';
import { Bell, CheckCheck, CircleAlert, Info, TriangleAlert } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import { formatDateTime } from '../../utils/format';

const iconMap = { INFO: Info, WARNING: TriangleAlert, CRITICAL: CircleAlert };
export default function NotificationsPage() {
  const [items, setItems] = useState([]); const [unread, setUnread] = useState(0); const [error, setError] = useState('');
  const load = async () => { try { const response = await api.get('/notifications'); setItems(response.data.data.items); setUnread(response.data.data.unread); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, []);
  const read = async (item) => { if (item.is_read) return; await api.patch(`/notifications/${item.id}/read`); load(); };
  const readAll = async () => { await api.post('/notifications/read-all'); load(); };
  return <div><PageHeader title="Notifications" subtitle={`${unread} unread clinic and system notification${unread === 1 ? '' : 's'}.`} actions={unread > 0 && <button className="btn-secondary" onClick={readAll}><CheckCheck size={17}/>Mark All Read</button>}/>{error && <div className="mb-4"><Alert>{error}</Alert></div>}<div className="space-y-3">{items.length ? items.map((item) => { const Icon = iconMap[item.severity] || Bell; return <button key={item.id} onClick={() => read(item)} className={`surface flex w-full items-start gap-4 p-4 text-left transition hover:-translate-y-0.5 ${!item.is_read ? 'border-l-4 border-l-accent' : 'opacity-80'}`}><div className={`rounded-xl p-2.5 ${item.severity === 'CRITICAL' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : item.severity === 'WARNING' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' : 'bg-kld-50 text-kld-700 dark:bg-kld-500/10 dark:text-kld-300'}`}><Icon size={20}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold">{item.title}</h2>{!item.is_read && <span className="h-2.5 w-2.5 rounded-full bg-accent"/>}</div><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p><p className="mt-2 text-xs text-slate-400">{formatDateTime(item.created_at)}</p></div></button>; }) : <EmptyState icon={Bell} title="No notifications" description="Important clinic and system alerts will appear here."/>}</div></div>;
}
