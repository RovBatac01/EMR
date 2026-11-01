import { useEffect, useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import { formatDateTime, titleCase } from '../../utils/format';

export default function EmailLogsPage() {
  const [items, setItems] = useState([]); const [meta, setMeta] = useState(null); const [page, setPage] = useState(1); const [loading, setLoading] = useState(true); const [message, setMessage] = useState(null);
  const load = async () => { setLoading(true); try { const response = await api.get('/email-logs', { params: { page, limit: 20 } }); setItems(response.data.data); setMeta(response.data.meta); } catch (e) { setMessage({ type: 'error', text: e.message }); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [page]);
  const retry = async (item) => { try { await api.post(`/email-logs/${item.id}/retry`); setMessage({ type: 'success', text: 'Email queued for retry.' }); load(); } catch (e) { setMessage({ type: 'error', text: e.message }); } };
  return <div><PageHeader title="Email Delivery Monitoring" subtitle="Monitor queued account, consultation, and form notifications without exposing SMTP credentials." actions={<button className="btn-secondary" onClick={load}><RefreshCw size={17}/>Refresh</button>}/>{message && <div className="mb-4"><Alert type={message.type} onClose={() => setMessage(null)}>{message.text}</Alert></div>}<div className="table-wrap">{loading ? <div className="p-12 text-center text-sm text-slate-500">Loading email delivery records…</div> : items.length ? <table className="table"><thead><tr><th>Queued</th><th>Recipient</th><th>Type / Subject</th><th>Attempts</th><th>Status</th><th>Last Attempt</th><th>Error</th><th className="text-right">Action</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{formatDateTime(item.created_at)}</td><td>{item.recipient}</td><td><div className="font-bold">{item.subject}</div><div className="text-xs text-slate-500">{titleCase(item.template)}</div></td><td>{item.attempts} / 3</td><td><StatusBadge value={item.status}/>{item.delivery_status && <div className="mt-1 text-xs text-slate-500">Delivery: {item.delivery_status}</div>}</td><td>{formatDateTime(item.attempted_at)}</td><td className="max-w-72"><div className="line-clamp-3 text-xs text-red-600 dark:text-red-300">{item.error_message || '—'}</div></td><td><div className="flex justify-end">{item.status === 'FAILED' && <button className="btn-secondary !px-3" onClick={() => retry(item)}><RefreshCw size={15}/>Retry</button>}</div></td></tr>)}</tbody></table> : <EmptyState icon={Mail} title="No email records" description="Queued email notifications will appear here."/>}</div><Pagination meta={meta} onPage={setPage}/></div>;
}
