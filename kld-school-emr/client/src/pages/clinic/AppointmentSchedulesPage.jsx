import { useEffect, useState } from 'react';
import { CalendarOff, Clock3, Pencil, Plus, Settings2, Trash2, X } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';

const serviceInitial = { name: '', description: '', durationMinutes: 30, slotCapacity: 1, dailyBookingLimit: 20, advanceBookingDays: 30, minimumNoticeHours: 1, isPublic: true, isActive: true };
const scheduleInitial = { serviceId: '', dayOfWeek: 1, startTime: '08:00', endTime: '17:00', slotCapacity: 1, bookingLimit: 20, isActive: true };
const unavailableInitial = { serviceId: '', unavailableDate: '', startTime: '', endTime: '', reason: '' };
const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const time = (value) => String(value || '').slice(0, 5);

export default function AppointmentSchedulesPage() {
  const [data, setData] = useState({ services: [], schedules: [], unavailable: [] });
  const [service, setService] = useState(serviceInitial);
  const [serviceId, setServiceId] = useState(null);
  const [schedule, setSchedule] = useState(scheduleInitial);
  const [scheduleId, setScheduleId] = useState(null);
  const [unavailable, setUnavailable] = useState(unavailableInitial);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const { data: response } = await api.get('/appointments/admin/schedules');
      setData(response.data);
      setSchedule((current) => current.serviceId || !response.data.services?.[0] ? current : { ...current, serviceId: response.data.services[0].id });
      setError('');
    } catch (requestError) { setError(requestError.message); }
  };
  useEffect(() => { load(); }, []);

  const submitService = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = serviceId ? await api.patch(`/appointments/admin/services/${serviceId}`, service) : await api.post('/appointments/admin/services', service);
      setSuccess(response.data.message); setService(serviceInitial); setServiceId(null); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const submitSchedule = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = { ...schedule, slotCapacity: schedule.slotCapacity || null, bookingLimit: schedule.bookingLimit || null };
      const response = scheduleId ? await api.patch(`/appointments/admin/schedules/${scheduleId}`, payload) : await api.post('/appointments/admin/schedules', payload);
      setSuccess(response.data.message); setSchedule({ ...scheduleInitial, serviceId: schedule.serviceId }); setScheduleId(null); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  const submitUnavailable = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await api.post('/appointments/admin/unavailable-dates', { ...unavailable, serviceId: unavailable.serviceId || null, startTime: unavailable.startTime || null, endTime: unavailable.endTime || null });
      setSuccess(response.data.message); setUnavailable(unavailableInitial); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const editService = (row) => {
    setServiceId(row.id);
    setService({ name: row.name || '', description: row.description || '', durationMinutes: row.duration_minutes, slotCapacity: row.slot_capacity, dailyBookingLimit: row.daily_booking_limit || '', advanceBookingDays: row.advance_booking_days, minimumNoticeHours: row.minimum_notice_hours, isPublic: Boolean(row.is_public), isActive: Boolean(row.is_active) });
  };
  const editSchedule = (row) => {
    setScheduleId(row.id);
    setSchedule({ serviceId: row.service_id, dayOfWeek: row.day_of_week, startTime: time(row.start_time), endTime: time(row.end_time), slotCapacity: row.slot_capacity || '', bookingLimit: row.booking_limit || '', isActive: Boolean(row.is_active) });
  };
  const removeSchedule = async (row) => {
    if (!confirm(`Deactivate the ${row.service_name} schedule on ${days[row.day_of_week]}?`)) return;
    try { const { data: response } = await api.delete(`/appointments/admin/schedules/${row.id}`); setSuccess(response.message); await load(); }
    catch (requestError) { setError(requestError.message); }
  };
  const removeUnavailable = async (row) => {
    if (!confirm(`Remove the unavailable-date block for ${String(row.unavailable_date).slice(0, 10)}?`)) return;
    try { const { data: response } = await api.delete(`/appointments/admin/unavailable-dates/${row.id}`); setSuccess(response.message); await load(); }
    catch (requestError) { setError(requestError.message); }
  };
  const toggleService = async (row) => {
    try { const { data: response } = await api.patch(`/appointments/admin/services/${row.id}`, { isActive: !Boolean(row.is_active) }); setSuccess(response.message); await load(); }
    catch (requestError) { setError(requestError.message); }
  };

  return <div>
    <PageHeader title="Appointment Schedule Settings" subtitle="Configure services, duration, capacities, recurring clinic schedules, booking limits, and unavailable dates."/>
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}

    <div className="grid gap-6 xl:grid-cols-3">
      <form className="surface p-5" onSubmit={submitService}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Settings2 className="text-kld-700"/><h2 className="font-extrabold">{serviceId ? 'Edit service' : 'New service'}</h2></div>{serviceId && <button type="button" className="icon-button" onClick={() => { setServiceId(null); setService(serviceInitial); }}><X size={17}/></button>}</div><div className="mt-4 space-y-3"><input className="input" placeholder="Service name" required value={service.name} onChange={(event) => setService({ ...service, name: event.target.value })}/><textarea className="input min-h-20" placeholder="Description" value={service.description} onChange={(event) => setService({ ...service, description: event.target.value })}/><div className="grid grid-cols-2 gap-3"><NumberField label="Duration (minutes)" min="5" value={service.durationMinutes} onChange={(value) => setService({ ...service, durationMinutes: value })}/><NumberField label="Slot capacity" min="1" value={service.slotCapacity} onChange={(value) => setService({ ...service, slotCapacity: value })}/><NumberField label="Daily limit" min="1" value={service.dailyBookingLimit} onChange={(value) => setService({ ...service, dailyBookingLimit: value })}/><NumberField label="Advance days" min="1" value={service.advanceBookingDays} onChange={(value) => setService({ ...service, advanceBookingDays: value })}/><NumberField label="Minimum notice (hours)" min="0" value={service.minimumNoticeHours} onChange={(value) => setService({ ...service, minimumNoticeHours: value })}/></div><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={service.isPublic} onChange={(event) => setService({ ...service, isPublic: event.target.checked })}/>Available for portal booking</label>{serviceId && <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={service.isActive} onChange={(event) => setService({ ...service, isActive: event.target.checked })}/>Active service</label>}<button className="btn-primary w-full" disabled={busy}>{serviceId ? <Pencil size={17}/> : <Plus size={17}/>} {serviceId ? 'Save service' : 'Create service'}</button></div></form>

      <form className="surface p-5" onSubmit={submitSchedule}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Clock3 className="text-kld-700"/><h2 className="font-extrabold">{scheduleId ? 'Edit recurring schedule' : 'Recurring schedule'}</h2></div>{scheduleId && <button type="button" className="icon-button" onClick={() => { setScheduleId(null); setSchedule({ ...scheduleInitial, serviceId: schedule.serviceId }); }}><X size={17}/></button>}</div><div className="mt-4 space-y-3"><select className="input" required value={schedule.serviceId} disabled={Boolean(scheduleId)} onChange={(event) => setSchedule({ ...schedule, serviceId: event.target.value })}><option value="">Select service</option>{data.services.filter((row) => row.is_active || row.id === schedule.serviceId).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select><select className="input" value={schedule.dayOfWeek} onChange={(event) => setSchedule({ ...schedule, dayOfWeek: event.target.value })}>{days.slice(1).map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select><div className="grid grid-cols-2 gap-3"><TimeField label="Starts" value={schedule.startTime} onChange={(value) => setSchedule({ ...schedule, startTime: value })}/><TimeField label="Ends" value={schedule.endTime} onChange={(value) => setSchedule({ ...schedule, endTime: value })}/><NumberField label="Slot capacity" min="1" value={schedule.slotCapacity} onChange={(value) => setSchedule({ ...schedule, slotCapacity: value })}/><NumberField label="Booking limit" min="1" value={schedule.bookingLimit} onChange={(value) => setSchedule({ ...schedule, bookingLimit: value })}/></div>{scheduleId && <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={schedule.isActive} onChange={(event) => setSchedule({ ...schedule, isActive: event.target.checked })}/>Active schedule</label>}<button className="btn-primary w-full" disabled={busy}>{scheduleId ? <Pencil size={17}/> : <Plus size={17}/>} {scheduleId ? 'Save schedule' : 'Add schedule'}</button></div></form>

      <form className="surface p-5" onSubmit={submitUnavailable}><div className="flex items-center gap-2"><CalendarOff className="text-kld-700"/><h2 className="font-extrabold">Unavailable date</h2></div><div className="mt-4 space-y-3"><select className="input" value={unavailable.serviceId} onChange={(event) => setUnavailable({ ...unavailable, serviceId: event.target.value })}><option value="">All services</option>{data.services.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select><input className="input" type="date" required value={unavailable.unavailableDate} onChange={(event) => setUnavailable({ ...unavailable, unavailableDate: event.target.value })}/><div className="grid grid-cols-2 gap-3"><input className="input" type="time" value={unavailable.startTime} onChange={(event) => setUnavailable({ ...unavailable, startTime: event.target.value })}/><input className="input" type="time" value={unavailable.endTime} onChange={(event) => setUnavailable({ ...unavailable, endTime: event.target.value })}/></div><textarea className="input min-h-20" required placeholder="Reason" value={unavailable.reason} onChange={(event) => setUnavailable({ ...unavailable, reason: event.target.value })}/><button className="btn-primary w-full" disabled={busy}><Plus size={17}/>Block date</button></div></form>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="surface overflow-hidden"><div className="border-b p-4 font-extrabold">Services</div><div className="divide-y dark:divide-slate-800">{data.services.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 p-4"><div><div className="font-bold">{row.name}</div><div className="text-xs text-slate-500">{row.duration_minutes} min · capacity {row.slot_capacity} · daily {row.daily_booking_limit || 'unlimited'} · {row.is_public ? 'public' : 'staff only'}</div></div><div className="flex items-center gap-2"><StatusBadge value={row.is_active ? 'ACTIVE' : 'DISABLED'}/><button className="icon-button" title="Edit service" onClick={() => editService(row)}><Pencil size={17}/></button><button className="btn-secondary !px-3 !py-2" onClick={() => toggleService(row)}>{row.is_active ? 'Disable' : 'Enable'}</button></div></div>)}</div></section>
      <section className="surface overflow-hidden"><div className="border-b p-4 font-extrabold">Recurring schedules</div><div className="max-h-[34rem] divide-y overflow-auto dark:divide-slate-800">{data.schedules.map((row) => <div key={row.id} className="flex items-center justify-between gap-3 p-4"><div><div className="font-bold">{row.service_name}</div><div className="text-sm text-slate-500">{days[row.day_of_week]} · {time(row.start_time)} to {time(row.end_time)} · capacity {row.slot_capacity || 'default'} · limit {row.booking_limit || 'service default'}</div></div><div className="flex items-center gap-2"><StatusBadge value={row.is_active ? 'ACTIVE' : 'DISABLED'}/><button className="icon-button" title="Edit schedule" onClick={() => editSchedule(row)}><Pencil size={17}/></button>{row.is_active && <button className="icon-button text-red-600" title="Deactivate schedule" onClick={() => removeSchedule(row)}><Trash2 size={17}/></button>}</div></div>)}</div></section>
    </div>

    <section className="surface mt-6 overflow-hidden"><div className="border-b p-4 font-extrabold">Unavailable dates</div><div className="table-wrap border-0 shadow-none"><table className="table"><thead><tr><th>Date</th><th>Service</th><th>Time</th><th>Reason</th><th className="text-right">Action</th></tr></thead><tbody>{data.unavailable.length ? data.unavailable.map((row) => <tr key={row.id}><td>{String(row.unavailable_date).slice(0, 10)}</td><td>{row.service_name || 'All services'}</td><td>{row.start_time ? `${time(row.start_time)} to ${time(row.end_time)}` : 'All day'}</td><td>{row.reason}</td><td><div className="flex justify-end"><button className="icon-button text-red-600" title="Remove block" onClick={() => removeUnavailable(row)}><Trash2 size={17}/></button></div></td></tr>) : <tr><td colSpan="5" className="text-center text-slate-500">No unavailable dates configured.</td></tr>}</tbody></table></div></section>
  </div>;
}

function NumberField({ label, value, onChange, min }) { return <div><label className="label">{label}</label><input className="input" type="number" min={min} value={value} onChange={(event) => onChange(event.target.value)}/></div>; }
function TimeField({ label, value, onChange }) { return <div><label className="label">{label}</label><input className="input" type="time" required value={value} onChange={(event) => onChange(event.target.value)}/></div>; }
