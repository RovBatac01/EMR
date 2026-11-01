import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import { formatDate } from '../../utils/format';

export default function MyVisitsPage() {
  const [items, setItems] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/student-portal/visits').then((response) => setItems(response.data.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  return <div><PageHeader title="My Clinic Visits" subtitle="Chronological clinic-visit history connected to your verified student account."/>{error && <div className="mb-4"><Alert>{error}</Alert></div>}<div className="table-wrap">{loading ? <div className="p-12 text-center text-sm text-slate-500">Loading your visit history…</div> : items.length ? <table className="table"><thead><tr><th>Date</th><th>Visit ID</th><th>Type</th><th>Complaint</th><th>Attending Staff</th><th>Consultation</th><th>Status</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{formatDate(item.visit_date)}<div className="text-xs text-slate-500">{item.visit_time}</div></td><td className="font-mono text-xs font-bold">{item.visit_number}</td><td>{item.visit_type}</td><td>{item.complaint || '—'}</td><td>{item.attending_staff || '—'}</td><td>{item.consultation_status ? <StatusBadge value={item.consultation_status}/> : <span className="text-xs text-slate-400">Not released</span>}</td><td><StatusBadge value={item.status}/></td></tr>)}</tbody></table> : <EmptyState icon={History} title="No clinic visits recorded"/>}</div></div>;
}
