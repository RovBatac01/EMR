import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Link2, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { formatDate, formatDateTime } from '../../utils/format';

const statuses = ['PENDING', 'SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED'];
const activeAppointmentStatuses = new Set(['PENDING', 'PROPOSED', 'CONFIRMED', 'CHECKED_IN', 'IN_QUEUE', 'IN_CONSULTATION']);

export default function FollowUpsPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ page: 1, status: '', dateFrom: '', dateTo: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState('');
  const [linking, setLinking] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentId, setAppointmentId] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/follow-ups', { params: { ...filters, limit: 15, status: filters.status || undefined, dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined } });
      setRows(data.data || []);
      setMeta(data.meta || null);
      setError('');
    } catch (requestError) { setError(requestError.message); }
  };

  useEffect(() => { load(); }, [filters.page, filters.status, filters.dateFrom, filters.dateTo]);

  const updateStatus = async (row, status) => {
    if (!confirm(`Mark follow-up ${row.follow_up_number} as ${status.toLowerCase()}?`)) return;
    setBusy(row.id + status);
    try {
      const { data } = await api.patch(`/follow-ups/${row.id}`, { status });
      setSuccess(data.message);
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(''); }
  };

  const openLinkDialog = async (row) => {
    setLinking(row);
    setAppointmentId('');
    setAppointments([]);
    setBusy(row.id + 'load');
    try {
      const { data } = await api.get('/appointments', { params: { patientId: row.patient_id, limit: 100 } });
      setAppointments((data.data || []).filter((appointment) => activeAppointmentStatuses.has(appointment.status)));
    } catch (requestError) { setError(requestError.message); setLinking(null); }
    finally { setBusy(''); }
  };

  const linkAppointment = async () => {
    if (!linking || !appointmentId) return;
    setBusy(linking.id + 'link');
    try {
      const { data } = await api.post(`/follow-ups/${linking.id}/link-appointment`, { appointmentId });
      setSuccess(data.message);
      setLinking(null);
      setAppointmentId('');
      await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(''); }
  };

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, ...(key === 'page' ? {} : { page: 1 }) }));

  return <div>
    <PageHeader title="Follow-up Management" subtitle="Track return visits from the original consultation, assign providers, monitor reminders, and prevent duplicate follow-up workflows." actions={<button className="btn-secondary" onClick={load}><RefreshCw size={17}/>Refresh</button>}/>
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}

    <section className="surface mb-5 p-4"><div className="grid gap-3 sm:grid-cols-3">
      <div><label className="label">Status</label><select className="input" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}><option value="">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select></div>
      <div><label className="label">Target date from</label><input className="input" type="date" value={filters.dateFrom} onChange={(event) => setFilter('dateFrom', event.target.value)}/></div>
      <div><label className="label">Target date to</label><input className="input" type="date" value={filters.dateTo} onChange={(event) => setFilter('dateTo', event.target.value)}/></div>
    </div></section>

    <div className="table-wrap">{rows.length ? <table className="table"><thead><tr><th>Follow-up</th><th>Patient</th><th>Reason / Target</th><th>Assignment</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>
      <td><div className="font-extrabold">{row.follow_up_number}</div><div className="text-xs text-slate-500">From {row.consultation_number}</div><div className="text-xs text-slate-500">Created {formatDateTime(row.created_at)}</div></td>
      <td><div className="font-bold">{row.patient_name}</div><div className="text-xs text-slate-500">{row.patient_type} · {row.record_number}</div></td>
      <td className="max-w-sm"><div className="font-semibold">{row.reason}</div><div className="mt-1 text-xs text-slate-500">Target: {formatDate(row.target_date)}</div>{row.notes && <div className="mt-1 line-clamp-2 text-xs text-slate-500">{row.notes}</div>}</td>
      <td><div>{row.assigned_doctor_name || row.assigned_staff_name || 'Unassigned'}</div>{row.appointment_number && <div className="mt-1 text-xs font-bold text-kld-700 dark:text-kld-300"><Link2 className="mr-1 inline" size={13}/>{row.appointment_number} · {row.appointment_status}</div>}</td>
      <td><StatusBadge value={row.status}/></td>
      <td><div className="flex flex-wrap justify-end gap-1">
        {!row.appointment_number && !['COMPLETED','CANCELLED'].includes(row.status) && <button className="icon-button" title="Link appointment" disabled={Boolean(busy)} onClick={() => openLinkDialog(row)}><Link2 size={17}/></button>}
        {!['COMPLETED','CANCELLED'].includes(row.status) && <button className="icon-button text-emerald-600" title="Complete" disabled={Boolean(busy)} onClick={() => updateStatus(row, 'COMPLETED')}><CheckCircle2 size={17}/></button>}
        {!['COMPLETED','MISSED','CANCELLED'].includes(row.status) && <button className="icon-button text-amber-600" title="Mark missed" disabled={Boolean(busy)} onClick={() => updateStatus(row, 'MISSED')}><CalendarClock size={17}/></button>}
        {!['COMPLETED','CANCELLED'].includes(row.status) && <button className="icon-button text-red-600" title="Cancel" disabled={Boolean(busy)} onClick={() => updateStatus(row, 'CANCELLED')}><XCircle size={17}/></button>}
      </div></td>
    </tr>)}</tbody></table> : <EmptyState title="No follow-ups found" description="No clinical follow-ups match the selected filters."/>}</div>
    <Pagination meta={meta} onPage={(nextPage) => setFilter('page', nextPage)}/>

    <Modal open={Boolean(linking)} onClose={() => !busy && setLinking(null)} title={`Link Appointment to ${linking?.follow_up_number || 'Follow-up'}`} footer={<><button className="btn-secondary" onClick={() => setLinking(null)} disabled={Boolean(busy)}>Cancel</button><button className="btn-primary" disabled={!appointmentId || Boolean(busy)} onClick={linkAppointment}>{busy?.endsWith('link') ? 'Linking…' : 'Link Appointment'}</button></>}>
      <p className="mb-4 text-sm text-slate-500">Only active appointments for {linking?.patient_name} are shown. Linking is blocked when the appointment belongs to a different patient or another follow-up.</p>
      <label className="label">Matching appointment *</label>
      <select className="input" value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)}>
        <option value="">Select an appointment</option>
        {appointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.appointment_number} · {appointment.service_name} · {formatDateTime(appointment.confirmed_start || appointment.proposed_start || appointment.requested_start)} · {appointment.status}</option>)}
      </select>
      {!busy && !appointments.length && <div className="mt-4"><EmptyState title="No active appointments found" description="Create an appointment for this patient first, then return to link it."/></div>}
    </Modal>
  </div>;
}
