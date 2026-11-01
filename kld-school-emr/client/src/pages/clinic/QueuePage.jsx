import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, CheckCircle2, Clock3, Plus, RotateCcw, Search, Siren, Stethoscope, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import SearchSelect from '../../components/SearchSelect';
import StatusBadge from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/format';

const today = () => new Date().toISOString().slice(0, 10);
const blankWalkIn = { patient: null, visitType: 'WALK_IN', reason: '', complaint: '', priority: 'NORMAL', accompaniedBy: '', notes: '' };

export default function QueuePage() {
  const { can } = useAuth();
  const [date, setDate] = useState(today());
  const [data, setData] = useState({ queue: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState(false);
  const [walkIn, setWalkIn] = useState(blankWalkIn);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get('/queue', { params: { date } });
      setData(response.data.data || { queue: [] });
      setError('');
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [date]);

  const groups = useMemo(() => {
    const result = { WAITING: [], CALLED: [], IN_CONSULTATION: [], COMPLETED: [], CANCELLED: [] };
    for (const row of data.queue || []) (result[row.status] ||= []).push(row);
    return result;
  }, [data.queue]);

  const searchPatient = async (search) => {
    const response = await api.get('/patients/search', { params: { search } });
    return (response.data.data || []).map((patient) => ({ ...patient, label: `${patient.name} · ${patient.record_number}` }));
  };

  const submitWalkIn = async (event) => {
    event.preventDefault();
    if (!walkIn.patient) { setError('Select a patient.'); return; }
    setBusy(true); setError('');
    try {
      const response = await api.post('/queue/walk-in', {
        patientId: walkIn.patient.id,
        visitType: walkIn.visitType,
        reason: walkIn.reason,
        complaint: walkIn.complaint,
        priority: walkIn.priority,
        accompaniedBy: walkIn.accompaniedBy || null,
        notes: walkIn.notes || null,
        idempotencyKey: `walkin-${crypto.randomUUID?.() || Date.now()}`
      });
      setSuccess(`${response.data.message} Queue #${response.data.data.queueNumber}.`);
      setWalkIn(blankWalkIn); setModal(false); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const updateStatus = async (row, status) => {
    let notes = null;
    if (status === 'CANCELLED') {
      notes = prompt('Reason for cancelling this queue entry:');
      if (!notes) return;
    }
    setBusy(true); setError('');
    try {
      const response = await api.patch(`/queue/${row.id}/status`, { status, notes });
      setSuccess(response.data.message); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const updatePriority = async (row, priority) => {
    const reason = prompt(`Reason for changing queue #${row.queue_number} to ${priority}:`);
    if (!reason) return;
    setBusy(true);
    try { await api.patch(`/queue/${row.id}/priority`, { priority, reason }); await load(); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  return <div>
    <PageHeader title="Clinic Queue" subtitle="Coordinate walk-ins and checked-in appointments without exposing medical details on public displays." actions={<>
      <Link className="btn-secondary" to={`/queue/public?date=${date}`} target="_blank"><Clock3 size={17}/>Public display</Link>
      {can('queue.manage') && <button className="btn-primary" onClick={() => setModal(true)}><Plus size={17}/>Register walk-in</button>}
    </>}/>
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}
    <div className="surface mb-6 flex flex-wrap items-end gap-3 p-4"><div><label className="label">Queue date</label><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)}/></div><button className="btn-secondary" onClick={load}><RotateCcw size={17}/>Refresh</button><div className="ml-auto text-sm text-slate-500">{data.queue?.length || 0} queue entr{data.queue?.length === 1 ? 'y' : 'ies'}</div></div>
    {loading ? <div className="surface p-14 text-center text-sm text-slate-500">Loading clinic queue…</div> : !data.queue?.length ? <div className="surface"><EmptyState title="The queue is empty" description="Check in a confirmed appointment or register a walk-in patient."/></div> : <div className="grid gap-5 xl:grid-cols-3">
      <QueueColumn title="Waiting" icon={Clock3} rows={groups.WAITING} busy={busy} onStatus={updateStatus} onPriority={updatePriority}/>
      <QueueColumn title="Called" icon={Activity} rows={groups.CALLED} busy={busy} onStatus={updateStatus} onPriority={updatePriority}/>
      <QueueColumn title="In consultation" icon={Stethoscope} rows={groups.IN_CONSULTATION} busy={busy} onStatus={updateStatus} onPriority={updatePriority}/>
      <QueueColumn title="Completed" icon={CheckCircle2} rows={groups.COMPLETED} busy={busy} onStatus={updateStatus} onPriority={updatePriority}/>
      {groups.CANCELLED.length > 0 && <QueueColumn title="Cancelled" icon={XCircle} rows={groups.CANCELLED} busy={busy} onStatus={updateStatus} onPriority={updatePriority}/>} 
    </div>}

    <Modal open={modal} onClose={() => !busy && setModal(false)} title="Register walk-in patient" maxWidth="max-w-3xl" footer={<><button className="btn-secondary" onClick={() => setModal(false)} disabled={busy}>Cancel</button><button className="btn-primary" form="walk-in-form" disabled={busy}>{busy ? 'Registering…' : 'Add to queue'}</button></>}>
      <form id="walk-in-form" className="grid gap-4 md:grid-cols-2" onSubmit={submitWalkIn}>
        <div className="md:col-span-2"><SearchSelect label="Patient" required value={walkIn.patient} onChange={(patient) => setWalkIn({ ...walkIn, patient })} search={searchPatient} placeholder="Search student or employee patient…"/></div>
        <div><label className="label">Visit type</label><select className="input" value={walkIn.visitType} onChange={(e) => setWalkIn({ ...walkIn, visitType: e.target.value })}>{['WALK_IN','FOLLOW_UP','EMERGENCY','REFERRAL','MEDICAL_CLEARANCE','OTHER'].map((value) => <option key={value}>{value}</option>)}</select></div>
        <div><label className="label">Priority</label><select className="input" value={walkIn.priority} onChange={(e) => setWalkIn({ ...walkIn, priority: e.target.value })}>{['NORMAL','MODERATE','URGENT','EMERGENCY'].map((value) => <option key={value}>{value}</option>)}</select></div>
        <div><label className="label">Reason *</label><input className="input" required value={walkIn.reason} onChange={(e) => setWalkIn({ ...walkIn, reason: e.target.value })}/></div>
        <div><label className="label">Accompanied by</label><input className="input" value={walkIn.accompaniedBy} onChange={(e) => setWalkIn({ ...walkIn, accompaniedBy: e.target.value })}/></div>
        <div className="md:col-span-2"><label className="label">Chief complaint *</label><textarea className="input min-h-24" required value={walkIn.complaint} onChange={(e) => setWalkIn({ ...walkIn, complaint: e.target.value })}/></div>
        <div className="md:col-span-2"><label className="label">Notes</label><textarea className="input min-h-20" value={walkIn.notes} onChange={(e) => setWalkIn({ ...walkIn, notes: e.target.value })}/></div>
      </form>
    </Modal>
  </div>;
}

function QueueColumn({ title, icon: Icon, rows, busy, onStatus, onPriority }) {
  return <section className="surface overflow-hidden"><div className="flex items-center justify-between border-b p-4"><div className="flex items-center gap-2 font-extrabold"><Icon size={18} className="text-kld-700 dark:text-kld-300"/>{title}</div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold dark:bg-slate-800">{rows.length}</span></div><div className="divide-y dark:divide-slate-800">{rows.length ? rows.map((row) => <article key={row.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><div className="text-2xl font-black text-kld-700 dark:text-accent">#{row.queue_number}</div><div className="mt-1 font-extrabold">{row.patient_name}</div><div className="text-xs text-slate-500">{row.record_number} · {row.patient_type}</div></div><div className="space-y-2 text-right"><StatusBadge value={row.status}/><StatusBadge value={row.priority}/></div></div><div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/60"><div className="font-semibold">{row.complaint}</div><div className="mt-1 text-xs text-slate-500">Checked in {formatDateTime(row.checked_in_at)}</div></div><div className="mt-3 flex flex-wrap gap-2"><select className="input !w-auto !py-2" value={row.priority} disabled={busy || ['COMPLETED','CANCELLED'].includes(row.status)} onChange={(e) => onPriority(row, e.target.value)}>{['NORMAL','MODERATE','URGENT','EMERGENCY'].map((value) => <option key={value}>{value}</option>)}</select>{row.status === 'WAITING' && <button className="btn-primary !px-3 !py-2" disabled={busy} onClick={() => onStatus(row, 'CALLED')}><Siren size={15}/>Call</button>}{row.status === 'CALLED' && <><button className="btn-secondary !px-3 !py-2" disabled={busy} onClick={() => onStatus(row, 'WAITING')}><RotateCcw size={15}/>Return</button><button className="btn-primary !px-3 !py-2" disabled={busy} onClick={() => onStatus(row, 'IN_CONSULTATION')}><ArrowRight size={15}/>Start</button></>}{row.status === 'IN_CONSULTATION' && <button className="btn-primary !px-3 !py-2" disabled={busy} onClick={() => onStatus(row, 'COMPLETED')}><CheckCircle2 size={15}/>Complete queue</button>}{!['COMPLETED','CANCELLED'].includes(row.status) && <button className="btn-secondary !px-3 !py-2 text-red-600" disabled={busy} onClick={() => onStatus(row, 'CANCELLED')}><XCircle size={15}/>Cancel</button>}{row.visit_id && <Link className="btn-secondary !px-3 !py-2" to={`/visits/${row.visit_id}`}>Visit</Link>}</div></article>) : <div className="p-8 text-center text-sm text-slate-500">No {title.toLowerCase()} entries.</div>}</div></section>;
}
