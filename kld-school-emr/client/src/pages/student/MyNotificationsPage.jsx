import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import { formatDateTime } from '../../utils/format';

export default function MyNotificationsPage() {
  const [items, setItems] = useState([]); const [error, setError] = useState('');
  useEffect(() => { api.get('/student-portal/notifications').then((response) => setItems(response.data.data)).catch((e) => setError(e.message)); }, []);
  return <div><PageHeader title="My Notifications" subtitle="Clinic, account, form, and released-result updates sent to your student portal."/>{error && <div className="mb-4"><Alert>{error}</Alert></div>}<div className="space-y-3">{items.length ? items.map((item) => <article key={item.id} className={`surface flex items-start gap-4 p-4 ${!item.is_read ? 'border-l-4 border-l-accent' : ''}`}><div className="rounded-xl bg-kld-50 p-2.5 text-kld-700 dark:bg-kld-500/10 dark:text-kld-300"><Bell size={19}/></div><div><h2 className="font-extrabold">{item.title}</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p><p className="mt-2 text-xs text-slate-400">{formatDateTime(item.created_at)}</p></div></article>) : <EmptyState icon={Bell} title="No student notifications"/>}</div></div>;
}
