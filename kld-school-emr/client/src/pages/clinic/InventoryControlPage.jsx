import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCheck, PackageSearch, Plus, Scale, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { formatDate, formatDateTime } from '../../utils/format';

const adjustmentBlank = { batchId: '', adjustmentType: 'DAMAGED', quantityChange: 1, reason: '', supportingNotes: '' };
const countBlank = { title: '', storageLocation: '', notes: '' };

export default function InventoryControlPage() {
  const { can } = useAuth();
  const [tab, setTab] = useState('adjustments');
  const [adjustments, setAdjustments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [counts, setCounts] = useState([]);
  const [countDetail, setCountDetail] = useState(null);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [adjustment, setAdjustment] = useState(adjustmentBlank);
  const [countForm, setCountForm] = useState(countBlank);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAdjustments = async () => {
    try { const { data } = await api.get('/inventory-control/adjustments', { params: { page, limit: 15, status: status || undefined } }); setAdjustments(data.data || []); setMeta(data.meta || null); } catch (e) { setError(e.message); }
  };
  const loadCounts = async () => { try { const { data } = await api.get('/inventory-control/stock-counts'); setCounts(data.data || []); } catch (e) { setError(e.message); } };
  const loadBatches = async (query = '') => { try { const { data } = await api.get('/inventory-control/batches', { params: { search: query || undefined, active: true } }); setBatches(data.data || []); } catch (e) { setError(e.message); } };
  useEffect(() => { loadAdjustments(); }, [page, status]);
  useEffect(() => { loadCounts(); }, []);

  const openAdjustment = async () => { setAdjustment(adjustmentBlank); setSearch(''); await loadBatches(); setModal({ type: 'adjustment', title: 'Request Stock Adjustment' }); };
  const submitAdjustment = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const { data } = await api.post('/inventory-control/adjustments', { ...adjustment, quantityChange: Number(adjustment.quantityChange) }); setSuccess(data.message); setModal(null); await loadAdjustments(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const review = async (row, decision) => {
    const reviewNotes = prompt(`${decision === 'approve' ? 'Approval' : 'Rejection'} notes${decision === 'reject' ? ' (required)' : ' (optional)'}:`) || '';
    if (decision === 'reject' && reviewNotes.trim().length < 3) return;
    if (!confirm(`${decision === 'approve' ? 'Apply' : 'Reject'} adjustment ${row.adjustment_number}?`)) return;
    setBusy(true);
    try { const { data } = await api.post(`/inventory-control/adjustments/${row.id}/${decision}`, { reviewNotes }); setSuccess(data.message); await loadAdjustments(); await loadCounts(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const createCount = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post('/inventory-control/stock-counts', countForm); setSuccess(data.message); setModal(null); setCountForm(countBlank); await loadCounts(); await openCount(data.data.id); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const openCount = async (id) => { try { const { data } = await api.get(`/inventory-control/stock-counts/${id}`); setCountDetail(data.data); setTab('counts'); } catch (e) { setError(e.message); } };
  const saveCountItem = async (item, value) => {
    setBusy(true);
    try { await api.patch(`/inventory-control/stock-counts/${countDetail.session.id}/items/${item.id}`, { countedQuantity: Number(value), notes: item.notes || '' }); await openCount(countDetail.session.id); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const submitCount = async () => {
    if (!confirm('Submit this physical count? Any variance will create a pending reconciliation adjustment requiring approval.')) return;
    setBusy(true);
    try { const { data } = await api.post(`/inventory-control/stock-counts/${countDetail.session.id}/submit`); setSuccess(data.message); await openCount(countDetail.session.id); await loadCounts(); await loadAdjustments(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const filteredBatches = useMemo(() => batches.filter((batch) => `${batch.generic_name} ${batch.brand_name || ''} ${batch.batch_number}`.toLowerCase().includes(search.toLowerCase())), [batches, search]);

  return <div>
    <PageHeader title="Inventory Controls" subtitle="Use approval-based stock corrections and physical count reconciliation. Every before-and-after quantity is audited." actions={<div className="flex gap-2">{can('inventory.adjust.request') && <button className="btn-secondary" onClick={openAdjustment}><Scale size={17}/>Request Adjustment</button>}{can('inventory.count') && <button className="btn-primary" onClick={() => setModal({ type: 'count', title: 'Open Physical Stock Count' })}><ClipboardCheck size={17}/>New Stock Count</button>}</div>}/>
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}
    <div className="mb-5 flex gap-2 rounded-2xl border bg-white p-2 dark:border-slate-800 dark:bg-slate-900"><button className={tab === 'adjustments' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('adjustments')}>Adjustment Requests</button><button className={tab === 'counts' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('counts')}>Physical Stock Counts</button></div>

    {tab === 'adjustments' ? <>
      <section className="surface mb-4 p-4"><label className="label">Status</label><select className="input max-w-xs" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option>{['PENDING','APPLIED','REJECTED','CANCELLED'].map((value) => <option key={value}>{value}</option>)}</select></section>
      <div className="table-wrap">{adjustments.length ? <table className="table"><thead><tr><th>Request</th><th>Medicine / Batch</th><th>Adjustment</th><th>Quantities</th><th>Status</th><th>Audit</th><th className="text-right">Actions</th></tr></thead><tbody>{adjustments.map((row) => <tr key={row.id}><td><div className="font-extrabold">{row.adjustment_number}</div><div className="text-xs text-slate-500">{formatDateTime(row.requested_at)}</div>{row.count_number && <div className="mt-1 text-xs font-bold text-kld-700">From {row.count_number}</div>}</td><td><div className="font-bold">{row.generic_name}</div><div className="text-xs text-slate-500">{row.brand_name || 'Generic'} · Batch {row.batch_number}</div><div className="text-xs text-slate-500">Expires {formatDate(row.expiration_date)}</div></td><td><div className="font-bold">{row.adjustment_type}</div><div className={`text-sm font-black ${Number(row.quantity_change) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{Number(row.quantity_change) > 0 ? '+' : ''}{row.quantity_change} {row.unit}</div><div className="mt-1 max-w-xs text-xs text-slate-500">{row.reason}</div></td><td><div>Before: <strong>{row.before_quantity}</strong></div><div>After: <strong>{row.after_quantity ?? 'Pending'}</strong></div></td><td><StatusBadge value={row.status}/></td><td className="text-xs"><div>Requested by {row.requested_by_username}</div>{row.approved_by_username && <div>Reviewed by {row.approved_by_username}</div>}{row.reviewed_at && <div>{formatDateTime(row.reviewed_at)}</div>}</td><td><div className="flex justify-end gap-1">{row.status === 'PENDING' && can('inventory.adjust.approve') && <><button className="icon-button text-emerald-600" disabled={busy} title="Approve and apply" onClick={() => review(row, 'approve')}><Check size={17}/></button><button className="icon-button text-red-600" disabled={busy} title="Reject" onClick={() => review(row, 'reject')}><X size={17}/></button></>}</div></td></tr>)}</tbody></table> : <EmptyState title="No adjustment requests" description="No stock adjustments match the selected status."/>}</div><Pagination meta={meta} onPage={setPage}/>
    </> : <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
      <section className="surface overflow-hidden"><div className="border-b p-4"><h2 className="font-extrabold">Count Sessions</h2></div>{counts.length ? <div className="divide-y dark:divide-slate-800">{counts.map((row) => <button key={row.id} onClick={() => openCount(row.id)} className={`block w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 ${countDetail?.session?.id === row.id ? 'bg-kld-50 dark:bg-kld-500/10' : ''}`}><div className="flex items-center justify-between gap-3"><div><div className="font-extrabold">{row.count_number}</div><div className="text-sm text-slate-500">{row.title}</div></div><StatusBadge value={row.status}/></div><div className="mt-2 text-xs text-slate-500">{row.item_count} batches · {row.variance_count || 0} variance(s) · Opened {formatDateTime(row.opened_at)}</div></button>)}</div> : <EmptyState title="No physical counts" description="Open a count session to compare expected and actual batch quantities."/>}</section>
      <section className="surface overflow-hidden">{countDetail ? <><div className="flex flex-wrap items-start justify-between gap-3 border-b p-5"><div><h2 className="text-lg font-extrabold">{countDetail.session.count_number} · {countDetail.session.title}</h2><p className="mt-1 text-sm text-slate-500">{countDetail.session.storage_location || 'All storage locations'}</p></div><div className="flex items-center gap-2"><StatusBadge value={countDetail.session.status}/>{countDetail.session.status === 'OPEN' && <button className="btn-primary" disabled={busy} onClick={submitCount}>Submit Count</button>}</div></div><div className="overflow-x-auto"><table className="table"><thead><tr><th>Medicine / Batch</th><th>Expected</th><th>Counted</th><th>Variance</th><th>Reconciliation</th></tr></thead><tbody>{countDetail.items.map((item) => <CountRow key={item.id} item={item} open={countDetail.session.status === 'OPEN'} disabled={busy} onSave={saveCountItem}/>)}</tbody></table></div></> : <EmptyState title="Select a count session" description="Choose a session to enter quantities or inspect its reconciliation status."/>}</section>
    </div>}

    <Modal open={modal?.type === 'adjustment'} onClose={() => setModal(null)} title={modal?.title} maxWidth="max-w-3xl" footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" form="adjustment-form" disabled={busy}>{busy ? 'Submitting…' : 'Submit for Approval'}</button></>}><form id="adjustment-form" onSubmit={submitAdjustment} className="space-y-4"><div><label className="label">Search batch</label><div className="relative"><PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Medicine, brand, or batch number"/></div></div><div><label className="label">Medicine batch *</label><select className="input" required value={adjustment.batchId} onChange={(e) => setAdjustment({ ...adjustment, batchId: e.target.value })}><option value="">Select a batch</option>{filteredBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.generic_name} · {batch.batch_number} · {batch.quantity} {batch.unit} · exp. {String(batch.expiration_date).slice(0,10)}</option>)}</select></div><div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Adjustment type *</label><select className="input" value={adjustment.adjustmentType} onChange={(e) => setAdjustment({ ...adjustment, adjustmentType: e.target.value })}>{['DAMAGED','LOST','EXPIRED','CORRECTION','RECONCILIATION'].map((value) => <option key={value}>{value}</option>)}</select></div><div><label className="label">Quantity change *</label><input className="input" type="number" required value={adjustment.quantityChange} onChange={(e) => setAdjustment({ ...adjustment, quantityChange: e.target.value })}/><p className="mt-1 text-xs text-slate-500">Damage, loss, and expiry are automatically treated as deductions. Use a negative or positive value for corrections.</p></div></div><div><label className="label">Reason *</label><textarea className="input min-h-20" required value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}/></div><div><label className="label">Supporting notes</label><textarea className="input min-h-20" value={adjustment.supportingNotes} onChange={(e) => setAdjustment({ ...adjustment, supportingNotes: e.target.value })}/></div></form></Modal>
    <Modal open={modal?.type === 'count'} onClose={() => setModal(null)} title={modal?.title} footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" form="stock-count-form" disabled={busy}>{busy ? 'Opening…' : 'Open Count Session'}</button></>}><form id="stock-count-form" onSubmit={createCount} className="space-y-4"><div><label className="label">Count title *</label><input className="input" required value={countForm.title} onChange={(e) => setCountForm({ ...countForm, title: e.target.value })} placeholder="Example: Monthly main cabinet count"/></div><div><label className="label">Storage location</label><input className="input" value={countForm.storageLocation} onChange={(e) => setCountForm({ ...countForm, storageLocation: e.target.value })} placeholder="Leave blank to include all active batches"/></div><div><label className="label">Notes</label><textarea className="input min-h-20" value={countForm.notes} onChange={(e) => setCountForm({ ...countForm, notes: e.target.value })}/></div></form></Modal>
  </div>;
}

function CountRow({ item, open, disabled, onSave }) {
  const [value, setValue] = useState(item.counted_quantity ?? '');
  useEffect(() => setValue(item.counted_quantity ?? ''), [item.counted_quantity]);
  return <tr><td><div className="font-bold">{item.generic_name}</div><div className="text-xs text-slate-500">{item.brand_name || 'Generic'} · Batch {item.batch_number} · exp. {formatDate(item.expiration_date)}</div></td><td>{item.expected_quantity} {item.unit}</td><td>{open ? <div className="flex min-w-40 gap-2"><input className="input w-24" type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)}/><button className="btn-secondary px-3" disabled={disabled || value === ''} onClick={() => onSave(item, value)}>Save</button></div> : `${item.counted_quantity ?? '—'} ${item.unit}`}</td><td className={Number(item.variance) === 0 ? '' : Number(item.variance) < 0 ? 'font-extrabold text-red-600' : 'font-extrabold text-emerald-600'}>{item.variance == null ? '—' : `${Number(item.variance) > 0 ? '+' : ''}${item.variance}`}</td><td>{item.adjustment_number ? <div><div className="font-bold">{item.adjustment_number}</div><StatusBadge value={item.adjustment_status}/></div> : item.variance === 0 ? <span className="text-emerald-600">Balanced</span> : '—'}</td></tr>;
}
