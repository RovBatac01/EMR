import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Check, Clock3, LogIn, Plus, RefreshCw, X, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import SearchSelect from '../../components/SearchSelect';
import { formatDateTime } from '../../utils/format';

const localToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const emptyRequest = { patient: null, serviceId: '', date: '', requestedStart: '', reason: '' };

export default function AppointmentsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(localToday());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [requestForm, setRequestForm] = useState(emptyRequest);

  const load = async () => {
    try {
      const { data } = await api.get('/appointments', {
        params: { page, limit: 15, status: status || undefined, dateFrom: date || undefined, dateTo: date || undefined }
      });
      setRows(data.data || []);
      setMeta(data.meta || null);
      setError('');
    } catch (requestError) { setError(requestError.message); }
  };

  const loadServices = async () => {
    try {
      const { data } = await api.get('/appointments/services');
      setServices(data.data || []);
    } catch (requestError) { setError(requestError.message); }
  };

  useEffect(() => { load(); }, [page, status, date]);
  useEffect(() => { loadServices(); }, []);

  useEffect(() => {
    if (!createOpen || !requestForm.serviceId || !requestForm.date) {
      setSlots([]);
      return;
    }
    api.get('/appointments/availability', { params: { serviceId: requestForm.serviceId, date: requestForm.date } })
      .then(({ data }) => setSlots(data.data?.slots || []))
      .catch((requestError) => { setSlots([]); setError(requestError.message); });
  }, [createOpen, requestForm.serviceId, requestForm.date]);

  const searchPatients = async (query) => {
    const { data } = await api.get('/patients/search', { params: { search: query } });
    return (data.data || []).map((row) => ({
      ...row,
      label: `${row.name || row.record_number} · ${row.record_number}`
    }));
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    if (!requestForm.patient) { setError('Select a patient.'); return; }
    if (!requestForm.requestedStart) { setError('Select an available time slot.'); return; }
    setBusy('create');
    setError('');
    try {
      const idempotencyKey = `staff-${Date.now()}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
      const { data } = await api.post('/appointments', {
        patientId: requestForm.patient.id,
        serviceId: requestForm.serviceId,
        requestedStart: requestForm.requestedStart,
        reason: requestForm.reason,
        idempotencyKey
      });
      setSuccess(data.message);
      setRequestForm(emptyRequest);
      setSlots([]);
      setCreateOpen(false);
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(''); }
  };

  const act = async (row, action) => {
    const payload = { action };
    if (action === 'PROPOSE') {
      const value = prompt('Proposed date/time (YYYY-MM-DDTHH:MM):', String(row.requested_start || '').replace(' ', 'T').slice(0, 16));
      if (!value) return;
      payload.proposedStart = value;
      payload.notes = prompt('Optional staff note:', '') || null;
    }
    if (['DECLINE', 'CANCEL', 'NO_SHOW'].includes(action)) {
      const reason = prompt(`Reason for ${action.toLowerCase()}:`);
      if (!reason) return;
      payload.reason = reason;
    }
    if (!confirm(`${action.replaceAll('_', ' ')} appointment ${row.appointment_number}?`)) return;
    setBusy(row.id + action);
    setError('');
    try {
      const { data } = await api.patch(`/appointments/${row.id}/status`, payload);
      setSuccess(data.message);
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(''); }
  };

  const checkIn = async (row) => {
    if (!confirm(`Check in ${row.patient_name} and create or link the clinic visit?`)) return;
    setBusy(row.id + 'checkin');
    try {
      const { data } = await api.post(`/appointments/${row.id}/check-in`);
      setSuccess(`${data.message} Queue #${data.data?.queueNumber || '—'}.`);
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(''); }
  };

  const upcoming = useMemo(() => rows.filter((row) => !['COMPLETED', 'CANCELLED', 'DECLINED', 'NO_SHOW'].includes(row.status)).length, [rows]);

  return <div>
    <PageHeader
      title="Appointments"
      subtitle="Create or review requests, propose alternatives, check patients in, and maintain a separate appointment lifecycle."
      actions={<div className="flex gap-2"><button className="btn-secondary" onClick={load}><RefreshCw size={17}/>Refresh</button><button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={17}/>New Appointment</button></div>}
    />
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}

    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      <div className="surface p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Visible requests</div><div className="mt-2 text-3xl font-black">{rows.length}</div></div>
      <div className="surface p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Active / upcoming</div><div className="mt-2 text-3xl font-black text-kld-700 dark:text-kld-300">{upcoming}</div></div>
      <div className="surface p-4"><div className="text-xs font-bold uppercase tracking-wider text-slate-500">Schedule date</div><div className="mt-2 font-extrabold">{date || 'All dates'}</div></div>
    </div>

    <div className="surface mb-5 p-4"><div className="grid gap-3 sm:grid-cols-2">
      <div><label className="label">Schedule date</label><input className="input" type="date" value={date} onChange={(event) => { setDate(event.target.value); setPage(1); }}/></div>
      <div><label className="label">Status</label><select className="input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{['PENDING','PROPOSED','CONFIRMED','IN_QUEUE','IN_CONSULTATION','COMPLETED','DECLINED','CANCELLED','NO_SHOW'].map((value) => <option key={value}>{value}</option>)}</select></div>
    </div></div>

    <div className="table-wrap">{rows.length ? <table className="table"><thead><tr><th>Appointment</th><th>Patient</th><th>Service & schedule</th><th>Status</th><th>Reason</th><th className="text-right">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>
      <td><div className="font-extrabold">{row.appointment_number}</div><div className="text-xs text-slate-500">Requested {formatDateTime(row.created_at)}</div></td>
      <td><div className="font-bold">{row.patient_name}</div><div className="text-xs text-slate-500">{row.patient_type} · {row.record_number}</div></td>
      <td><div className="font-bold">{row.service_name}</div><div className="text-xs text-slate-500">{formatDateTime(row.confirmed_start || row.proposed_start || row.requested_start)}</div></td>
      <td><StatusBadge value={row.status}/>{row.queue_number && <div className="mt-1 text-xs font-bold">Queue #{row.queue_number}</div>}</td>
      <td className="max-w-xs"><div className="line-clamp-2">{row.reason}</div>{row.cancellation_reason && <div className="mt-1 text-xs text-red-600">{row.cancellation_reason}</div>}</td>
      <td><div className="flex flex-wrap justify-end gap-1">
        {row.status === 'PENDING' && <><button className="icon-button text-emerald-600" title="Confirm" disabled={busy} onClick={() => act(row, 'CONFIRM')}><Check size={17}/></button><button className="icon-button text-amber-600" title="Propose another schedule" disabled={busy} onClick={() => act(row, 'PROPOSE')}><Clock3 size={17}/></button><button className="icon-button text-red-600" title="Decline" disabled={busy} onClick={() => act(row, 'DECLINE')}><X size={17}/></button></>}
        {row.status === 'PROPOSED' && <button className="icon-button text-red-600" title="Cancel" disabled={busy} onClick={() => act(row, 'CANCEL')}><XCircle size={17}/></button>}
        {row.status === 'CONFIRMED' && <><button className="btn-primary px-3 py-2 text-xs" disabled={busy} onClick={() => checkIn(row)}><LogIn size={15}/>Check in</button><button className="icon-button text-red-600" title="Cancel" disabled={busy} onClick={() => act(row, 'CANCEL')}><XCircle size={17}/></button><button className="icon-button text-amber-600" title="No show" disabled={busy} onClick={() => act(row, 'NO_SHOW')}><CalendarCheck size={17}/></button></>}
      </div></td>
    </tr>)}</tbody></table> : <EmptyState title="No appointments found" description="No appointment records match the selected date and status."/>}</div>
    <Pagination meta={meta} onPage={setPage}/>

    <Modal open={createOpen} onClose={() => !busy && setCreateOpen(false)} title="Create Appointment" maxWidth="max-w-3xl" footer={<><button className="btn-secondary" onClick={() => setCreateOpen(false)} disabled={Boolean(busy)}>Cancel</button><button className="btn-primary" form="staff-appointment-form" disabled={busy === 'create' || !requestForm.requestedStart}>{busy === 'create' ? 'Submitting…' : 'Submit Appointment'}</button></>}>
      <form id="staff-appointment-form" onSubmit={submitRequest} className="space-y-4">
        <SearchSelect label="Patient" required value={requestForm.patient} onChange={(patient) => setRequestForm((current) => ({ ...current, patient }))} search={searchPatients} placeholder="Search student or employee patient…" renderItem={(row) => <div><div className="font-bold">{row.name}</div><div className="text-xs text-slate-500">{row.patient_type} · {row.record_number}{row.program ? ` · ${row.program}` : ''}{row.department ? ` · ${row.department}` : ''}</div></div>}/>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Clinic service *</label><select className="input" required value={requestForm.serviceId} onChange={(event) => setRequestForm((current) => ({ ...current, serviceId: event.target.value, requestedStart: '' }))}><option value="">Select a service</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} min</option>)}</select></div>
          <div><label className="label">Preferred date *</label><input className="input" type="date" min={localToday()} required value={requestForm.date} onChange={(event) => setRequestForm((current) => ({ ...current, date: event.target.value, requestedStart: '' }))}/></div>
        </div>
        <div><label className="label">Available time *</label><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{slots.map((slot) => <button type="button" key={slot.start} disabled={!slot.available} onClick={() => setRequestForm((current) => ({ ...current, requestedStart: slot.start }))} className={`rounded-xl border px-3 py-2 text-sm font-bold ${requestForm.requestedStart === slot.start ? 'border-kld-600 bg-kld-600 text-white' : slot.available ? 'bg-white hover:border-kld-500 dark:bg-slate-900' : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>{slot.start.slice(11,16)}<span className="block text-[10px] font-medium">{slot.available} left</span></button>)}</div>{requestForm.date && requestForm.serviceId && !slots.length && <p className="mt-2 text-xs text-slate-500">No configured slots are available for this date.</p>}</div>
        <div><label className="label">Reason *</label><textarea className="input min-h-28" required minLength={3} maxLength={2000} value={requestForm.reason} onChange={(event) => setRequestForm((current) => ({ ...current, reason: event.target.value }))}/></div>
      </form>
    </Modal>
  </div>;
}
