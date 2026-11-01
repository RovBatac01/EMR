import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarClock, Download, FileUp, HeartPulse, Pencil, Pill, Plus, Stethoscope, UserRound } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatDateTime, titleCase } from '../../utils/format';

export default function PatientProfilePage() {
  const { id } = useParams();
  const { can } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('timeline');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => { try { const { data: response } = await api.get(`/patients/${id}`); setData(response.data); setError(''); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, [id]);

  const upload = async (event) => {
    event.preventDefault(); if (!file) return;
    setBusy(true);
    try { const form = new FormData(); form.append('patientId', id); form.append('file', file); form.append('description', description); const { data: response } = await api.post('/attachments', form); setSuccess(response.message); setUploadOpen(false); setFile(null); setDescription(''); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const timeline = useMemo(() => data ? buildTimeline(data) : [], [data]);

  if (!data && !error) return <LoadingScreen compact/>;
  if (!data) return <div><PageHeader title="Patient Profile"/><Alert>{error}</Alert><Link className="btn-secondary mt-4" to="/patients"><ArrowLeft size={17}/>Back to Patients</Link></div>;
  const patient = data.patient || {};

  return <div>
    <PageHeader title={patient.name || 'Patient Profile'} subtitle={`${patient.patient_type || 'PATIENT'} · ${patient.record_number || 'No record number'} · ${patient.age ?? '—'} years old`} actions={<><Link className="btn-secondary" to="/patients"><ArrowLeft size={17}/>Back</Link>{!patient.archived_at && can('visits.write') && <Link className="btn-secondary" to={`/visits/new?patientId=${id}`}><Plus size={17}/>Register Visit</Link>}{!patient.archived_at && can('patients.write') && <Link className="btn-primary" to={`/patients/${id}/edit`}><Pencil size={17}/>Edit Profile</Link>}</>}/>
    {patient.archived_at && <div className="mb-4"><Alert type="warning">This patient is archived and read-only. Historical visits, consultations, medicine transactions, attachments, and reports remain available. Restore the patient from Archives before starting a new visit or editing the profile. Archive reason: {patient.archive_reason || 'No reason provided'}.</Alert></div>}
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}

    {patient.important_alerts && <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/30 dark:bg-red-500/10"><div className="flex items-start gap-3"><AlertTriangle className="shrink-0 text-red-600"/><div><h2 className="font-extrabold text-red-900 dark:text-red-200">Important Medical Alert</h2><p className="mt-1 whitespace-pre-wrap text-sm text-red-800 dark:text-red-200">{patient.important_alerts}</p></div></div></section>}

    <div className="grid gap-5 lg:grid-cols-4">
      <Metric label="Total visits" value={data.summary?.total_visits || 0} icon={Stethoscope}/>
      <Metric label="Last visit" value={formatDate(data.summary?.last_visit)} icon={CalendarClock}/>
      <Metric label="Common complaint" value={data.summary?.common_complaint || '—'} icon={HeartPulse}/>
      <Metric label="Latest consultation" value={formatDateTime(data.summary?.latest_consultation)} icon={UserRound}/>
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[.82fr_1.18fr]">
      <div className="space-y-6">
        <section className="surface p-5"><h2 className="text-lg font-extrabold">Identity & Contact</h2><dl className="mt-4 space-y-3 text-sm">
          <Row label="Patient Type" value={titleCase(patient.patient_type)}/><Row label={patient.patient_type === 'STUDENT' ? 'Student Number' : 'Employee Number'} value={patient.record_number}/><Row label="Birth Date" value={formatDate(patient.birth_date)}/><Row label="Sex" value={titleCase(patient.sex)}/><Row label="Email" value={patient.email}/><Row label="Contact" value={patient.contact_number}/><Row label="Address" value={patient.address}/>
          {patient.patient_type === 'STUDENT' ? <><Row label="Program" value={patient.program}/><Row label="Year / Section" value={`${patient.year_level || '—'}${patient.section ? ` / ${patient.section}` : ''}`}/><Row label="Enrollment" value={patient.enrollment_status}/></> : <><Row label="Employee Category" value={patient.employee_category}/><Row label="Department" value={patient.department}/><Row label="Position" value={patient.position_title}/><Row label="Employment" value={patient.employment_status}/></>}
        </dl></section>
        <section className="surface p-5"><h2 className="text-lg font-extrabold">Guardian & Emergency Contact</h2><div className="mt-4 space-y-3">{(data.guardians || []).map((row) => <ContactCard key={row.id} title="Guardian" row={row}/>)}{(data.emergencyContacts || []).map((row) => <ContactCard key={row.id} title="Emergency Contact" row={row}/>)}{!data.guardians?.length && !data.emergencyContacts?.length && <p className="text-sm text-slate-500">No guardian or emergency contact is recorded.</p>}</div></section>
        <section className="surface p-5"><h2 className="text-lg font-extrabold">Medical Information</h2><div className="mt-4 grid gap-3"><Medical label="Blood Type" value={patient.blood_type}/><Medical label="Allergies" value={patient.allergies}/><Medical label="Existing Conditions" value={patient.existing_conditions}/><Medical label="Current Medications" value={patient.current_medications}/><Medical label="Medical History" value={patient.medical_history}/><Medical label="Immunizations" value={patient.immunizations}/></div></section>
      </div>

      <div className="space-y-5">
        <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-2 dark:border-slate-800 dark:bg-slate-900">{[['timeline','Medical Timeline'],['visits','Visits'],['medicines','Medicines'],['followups','Follow-ups'],['measurements','Measurements'],['attachments','Attachments']].map(([value,label]) => <button key={value} className={tab === value ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab(value)}>{label}</button>)}</div>
        <section className="surface overflow-hidden">
          {tab === 'timeline' && <Timeline items={timeline}/>} 
          {tab === 'visits' && <Visits rows={data.visits || []}/>} 
          {tab === 'medicines' && <Issuances rows={data.issuances || []}/>} 
          {tab === 'followups' && <FollowUps rows={data.followUps || []}/>} 
          {tab === 'measurements' && <Measurements rows={data.measurements || []}/>} 
          {tab === 'attachments' && <Attachments rows={data.attachments || []} canUpload={!patient.archived_at && can('attachments.manage')} onUpload={() => setUploadOpen(true)}/>} 
        </section>
      </div>
    </div>

    <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Medical Attachment" footer={<><button className="btn-secondary" onClick={() => setUploadOpen(false)}>Cancel</button><button className="btn-primary" form="attachment-form" disabled={busy || !file}><FileUp size={17}/>{busy ? 'Uploading…' : 'Upload'}</button></>}><form id="attachment-form" onSubmit={upload} className="space-y-4"><div><label className="label">File *</label><input className="input" type="file" accept="application/pdf,image/png,image/jpeg,image/webp" required onChange={(e) => setFile(e.target.files?.[0] || null)}/><p className="mt-1 text-xs text-slate-500">PDF, PNG, JPG, or WebP, maximum 10 MB.</p></div><div><label className="label">Description</label><textarea className="input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)}/></div></form></Modal>
  </div>;
}

function Metric({ label, value, icon: Icon }) { return <div className="surface p-4"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><Icon size={16} className="text-kld-600"/>{label}</div><div className="mt-2 truncate text-xl font-black">{value}</div></div>; }
function Row({ label, value }) { return <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-0"><dt className="text-slate-500">{label}</dt><dd className="max-w-[65%] whitespace-pre-wrap text-right font-bold">{value || '—'}</dd></div>; }
function Medical({ label, value }) { return <div className="surface-muted p-3"><div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 whitespace-pre-wrap text-sm">{value || 'Not recorded'}</div></div>; }
function ContactCard({ title, row }) { return <div className="rounded-xl border p-4"><div className="text-xs font-bold uppercase tracking-wider text-kld-700 dark:text-kld-300">{title}</div><div className="mt-1 font-extrabold">{row.full_name}</div><div className="text-sm text-slate-500">{row.relationship || 'Relationship not recorded'} · {row.contact_number || 'No contact'}</div>{row.email && <div className="text-xs text-slate-500">{row.email}</div>}</div>; }

function buildTimeline(data) {
  const events = [];
  (data.visits || []).forEach((row) => events.push({ date: row.visit_date, type: 'VISIT', title: `${row.visit_number} · ${row.visit_type}`, description: row.complaint || row.reason_for_visit, link: `/visits/${row.id}`, status: row.status }));
  (data.issuances || []).forEach((row) => events.push({ date: row.issued_at, type: 'MEDICINE', title: row.issuance_number, description: row.medicines, link: `/medicine-issuance/${row.id}`, status: row.status }));
  (data.followUps || []).forEach((row) => events.push({ date: row.target_date, type: 'FOLLOW_UP', title: row.follow_up_number, description: row.reason, status: row.status }));
  return events.sort((a,b) => new Date(b.date) - new Date(a.date));
}
function Timeline({ items }) { return items.length ? <div className="p-5"><div className="relative ml-3 border-l-2 border-kld-200 pl-7 dark:border-kld-800">{items.map((item,index) => <div key={`${item.type}-${index}`} className="relative pb-6 last:pb-0"><span className="absolute -left-[2.15rem] top-1 h-4 w-4 rounded-full border-4 border-white bg-kld-600 dark:border-slate-900"/><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs font-bold uppercase tracking-wider text-kld-700 dark:text-kld-300">{item.type} · {formatDate(item.date)}</div><div className="mt-1 font-extrabold">{item.title}</div><p className="mt-1 text-sm text-slate-500">{item.description || 'No additional description.'}</p></div><StatusBadge value={item.status}/></div>{item.link && <Link className="mt-2 inline-block text-sm font-bold text-kld-700 hover:underline dark:text-kld-300" to={item.link}>Open record</Link>}</div>)}</div></div> : <EmptyState title="No medical timeline events" description="Visits, consultations, medicines, and follow-ups will appear here."/>; }
function Visits({ rows }) { return rows.length ? <div className="overflow-x-auto"><table className="table"><thead><tr><th>Date</th><th>Visit</th><th>Complaint / Diagnosis</th><th>Status</th><th></th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDate(row.visit_date)}<div className="text-xs text-slate-500">{row.visit_time}</div></td><td><div className="font-bold">{row.visit_number}</div><div className="text-xs text-slate-500">{row.visit_type} · {row.priority}</div></td><td><div>{row.complaint || '—'}</div><div className="text-xs text-slate-500">{row.diagnosis || 'No diagnosis recorded'}</div></td><td><StatusBadge value={row.consultation_status || row.status}/></td><td><Link className="btn-secondary px-3 py-2" to={row.consultation_id ? `/consultations/${row.consultation_id}` : `/visits/${row.id}`}>View</Link></td></tr>)}</tbody></table></div> : <EmptyState title="No visits recorded"/>; }
function Issuances({ rows }) { return rows.length ? <div className="divide-y dark:divide-slate-800">{rows.map((row) => <div key={row.id} className="flex items-start justify-between gap-4 p-5"><div><div className="font-extrabold">{row.issuance_number}</div><div className="mt-1 text-sm text-slate-500">{row.medicines}</div><div className="mt-1 text-xs text-slate-500">{formatDateTime(row.issued_at)}</div></div><div className="flex items-center gap-2"><StatusBadge value={row.status}/><Link className="icon-button" to={`/medicine-issuance/${row.id}`}><Pill size={17}/></Link></div></div>)}</div> : <EmptyState title="No medicine issuance history"/>; }
function FollowUps({ rows }) { return rows.length ? <div className="divide-y dark:divide-slate-800">{rows.map((row) => <div key={row.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="font-extrabold">{row.follow_up_number}</div><div className="text-xs text-slate-500">From {row.consultation_number}</div></div><StatusBadge value={row.status}/></div><p className="mt-3 text-sm">{row.reason}</p><div className="mt-2 text-xs text-slate-500">Target {formatDate(row.target_date)}{row.appointment_number ? ` · ${row.appointment_number}` : ''}</div></div>)}</div> : <EmptyState title="No follow-up history"/>; }
function Measurements({ rows }) { return rows.length ? <div className="overflow-x-auto"><table className="table"><thead><tr><th>Date</th><th>Height</th><th>Weight</th><th>Source</th><th>Notes</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDate(row.measured_on)}</td><td>{row.height_cm ? `${row.height_cm} cm` : '—'}</td><td>{row.weight_kg ? `${row.weight_kg} kg` : '—'}</td><td>{titleCase(row.source)}</td><td>{row.notes || '—'}</td></tr>)}</tbody></table></div> : <EmptyState title="No patient-submitted measurements" description="Measurements recorded here are separate from consultation vital signs."/>; }
function Attachments({ rows, canUpload, onUpload }) { return <div>{canUpload && <div className="flex justify-end border-b p-4"><button className="btn-primary" onClick={onUpload}><FileUp size={17}/>Upload Attachment</button></div>}{rows.length ? <div className="divide-y dark:divide-slate-800">{rows.map((row) => <div key={row.id} className="flex items-center justify-between gap-4 p-4"><div><div className="font-extrabold">{row.original_name}</div><div className="text-xs text-slate-500">{row.mime_type} · {Math.ceil(Number(row.file_size || 0)/1024)} KB · {formatDateTime(row.created_at)}</div><div className="text-sm text-slate-500">{row.description || 'No description'}</div></div><a className="btn-secondary" href={`/api/attachments/${row.id}/download`} target="_blank" rel="noreferrer"><Download size={17}/>Download</a></div>)}</div> : <EmptyState title="No medical attachments" description="Authorized PDF or image attachments will be listed here."/>}</div>; }
