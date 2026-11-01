import { useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { formatDateTime, titleCase } from '../../utils/format';

export default function CorrectionRequestsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ page: 1, status: '', type: '' });
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => { try { const { data } = await api.get('/patient-corrections', { params: { ...filters, limit: 15, status: filters.status || undefined, type: filters.type || undefined } }); setRows(data.data || []); setMeta(data.meta || null); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, [filters.page, filters.status, filters.type]);
  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, ...(key === 'page' ? {} : { page: 1 }) }));
  const review = async (decision) => {
    if (comments.trim().length < 3) { setError('Reviewer comments must contain at least three characters.'); return; }
    if (!confirm(`${decision === 'APPROVE' ? 'Approve and apply' : 'Reject'} request ${selected.request_number}?`)) return;
    setBusy(true);
    try { const { data } = await api.post(`/patient-corrections/${selected.id}/review`, { decision, comments }); setSuccess(data.message); setSelected(null); setComments(''); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return <div>
    <PageHeader title="Patient Information Corrections" subtitle="Compare official and proposed values. Approved requests update records; conflicts are detected when the source changed after submission." actions={<button className="btn-secondary" onClick={load}><RefreshCw size={17}/>Refresh</button>}/>
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}
    <section className="surface mb-5 p-4"><div className="grid gap-3 sm:grid-cols-2"><div><label className="label">Status</label><select className="input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><option value="">All statuses</option>{['PENDING','APPROVED','REJECTED','CONFLICT','CANCELLED'].map((value) => <option key={value}>{value}</option>)}</select></div><div><label className="label">Request type</label><select className="input" value={filters.type} onChange={(e) => setFilter('type', e.target.value)}><option value="">All request types</option>{['CONTACT','GUARDIAN','EMERGENCY_CONTACT','HEALTH_INFORMATION'].map((value) => <option key={value}>{value}</option>)}</select></div></div></section>
    <div className="table-wrap">{rows.length ? <table className="table"><thead><tr><th>Request</th><th>Patient</th><th>Type</th><th>Submitted</th><th>Status</th><th>Reviewer</th><th className="text-right">Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><div className="font-extrabold">{row.request_number}</div><div className="text-xs text-slate-500">by @{row.requested_by_username}</div></td><td><div className="font-bold">{row.patient_name}</div><div className="text-xs text-slate-500">{row.patient_type} · {row.record_number}</div></td><td>{titleCase(row.request_type)}</td><td>{formatDateTime(row.submitted_at)}</td><td><StatusBadge value={row.status}/></td><td><div className="text-xs">{row.reviewed_by_username || 'Not reviewed'}</div>{row.reviewed_at && <div className="text-xs text-slate-500">{formatDateTime(row.reviewed_at)}</div>}</td><td className="text-right"><button className="btn-secondary px-3 py-2" onClick={() => { setSelected(row); setComments(row.reviewer_comments || ''); }}>Compare</button></td></tr>)}</tbody></table> : <EmptyState title="No correction requests" description="No patient information requests match the selected filters."/>}</div>
    <Pagination meta={meta} onPage={(page) => setFilter('page', page)}/>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? `${selected.request_number} · ${titleCase(selected.request_type)}` : ''} maxWidth="max-w-5xl" footer={selected?.status === 'PENDING' ? <><button className="btn-danger" disabled={busy} onClick={() => review('REJECT')}><X size={17}/>Reject</button><button className="btn-primary" disabled={busy} onClick={() => review('APPROVE')}><Check size={17}/>Approve & Apply</button></> : <button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>}>
      {selected && <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><ValueCard title="Current official values" values={selected.current_values}/><ValueCard title="Proposed values" values={selected.proposed_values} highlight/></div><div><label className="label">Reviewer comments *</label><textarea className="input min-h-24" value={comments} onChange={(e) => setComments(e.target.value)} disabled={selected.status !== 'PENDING'} placeholder="Explain the approval, rejection, or required correction."/></div>{selected.status === 'CONFLICT' && <Alert>The official source changed after this request was submitted. Review the current record and ask the patient to submit an updated request.</Alert>}</div>}
    </Modal>
  </div>;
}

function ValueCard({ title, values = {}, highlight }) {
  return <section className={`rounded-2xl border p-4 ${highlight ? 'border-kld-300 bg-kld-50/60 dark:border-kld-700 dark:bg-kld-500/10' : 'bg-slate-50 dark:bg-slate-950'}`}><h3 className="font-extrabold">{title}</h3><dl className="mt-4 space-y-2 text-sm">{Object.entries(values || {}).map(([key, value]) => <div key={key} className="grid grid-cols-[140px_1fr] gap-3 border-b pb-2 last:border-0"><dt className="font-semibold text-slate-500">{titleCase(key)}</dt><dd className="whitespace-pre-wrap break-words">{String(value ?? '—')}</dd></div>)}</dl></section>;
}
