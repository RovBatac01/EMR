import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ClipboardEdit, HeartPulse, Phone, Plus, Ruler, ShieldPlus, UserRound, UsersRound } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import LoadingScreen from '../../components/LoadingScreen';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatDateTime, fullName, titleCase } from '../../utils/format';

const today = () => new Date().toISOString().slice(0, 10);

export default function MyProfilePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editor, setEditor] = useState(null);
  const [measurement, setMeasurement] = useState({ heightCm: '', weightKg: '', measuredOn: today(), notes: '' });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const response = await api.get('/student-portal/profile');
      setData(response.data.data);
      setError('');
    } catch (requestError) { setError(requestError.message); }
  };
  useEffect(() => { load(); }, []);

  const student = data?.student || {};
  const guardian = data?.guardians?.[0] || {};
  const emergency = data?.emergencyContacts?.[0] || {};
  const pendingTypes = useMemo(() => new Set((data?.corrections || []).filter((row) => row.status === 'PENDING').map((row) => row.request_type)), [data]);

  const openRequest = (type) => {
    const forms = {
      CONTACT: {
        title: 'Request Contact Information Update',
        type,
        values: { contactNumber: student.contact_number || '', address: student.address || '', registeredEmail: student.registered_email || '' }
      },
      GUARDIAN: {
        title: 'Request Guardian Information Update',
        type,
        values: { fullName: guardian.full_name || '', relationship: guardian.relationship || '', contactNumber: guardian.contact_number || '', email: guardian.email || '' }
      },
      EMERGENCY_CONTACT: {
        title: 'Request Emergency Contact Update',
        type,
        values: { fullName: emergency.full_name || '', relationship: emergency.relationship || '', contactNumber: emergency.contact_number || '' }
      },
      HEALTH_INFORMATION: {
        title: 'Request Health Information Update',
        type,
        values: {
          bloodType: student.blood_type || '', allergies: student.allergies || '', existingConditions: student.existing_conditions || '',
          currentMedications: student.current_medications || '', medicalHistory: student.medical_history || '',
          immunizations: student.immunizations || '', importantAlerts: student.important_alerts || ''
        }
      }
    };
    setEditor(forms[type]);
  };

  const submitRequest = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await api.post('/patient-corrections', { requestType: editor.type, proposedValues: editor.values });
      setSuccess(response.data.message); setEditor(null); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const saveMeasurement = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await api.post('/student-portal/measurements', {
        heightCm: measurement.heightCm === '' ? null : Number(measurement.heightCm),
        weightKg: measurement.weightKg === '' ? null : Number(measurement.weightKg),
        measuredOn: measurement.measuredOn,
        notes: measurement.notes || null
      });
      setSuccess(response.data.message); setMeasurement({ heightCm: '', weightKg: '', measuredOn: today(), notes: '' }); await load();
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  if (!data && !error) return <LoadingScreen compact/>;
  return <div>
    <PageHeader title="My Medical Profile" subtitle="Review your official information and submit changes for authorized clinic approval."/>
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}
    {data && <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <div className="space-y-6">
          <section className="surface p-5">
            <SectionTitle icon={UserRound} title="Student Identity" subtitle="Verified KLD registry information"/>
            <dl className="mt-5 space-y-3 text-sm"><Row label="Full Name" value={fullName(student)}/><Row label="Student Number" value={student.student_number}/><Row label="Birth Date" value={formatDate(student.birth_date)}/><Row label="Sex" value={titleCase(student.sex)}/><Row label="Program" value={student.program}/><Row label="Year / Section" value={`${student.year_level || '—'}${student.section ? ` / ${student.section}` : ''}`}/><Row label="Enrollment" value={student.enrollment_status}/></dl>
          </section>
          <EditableCard icon={Phone} title="Contact Information" pending={pendingTypes.has('CONTACT')} onEdit={() => openRequest('CONTACT')}>
            <Row label="Email" value={student.registered_email}/><Row label="Contact" value={student.contact_number}/><Row label="Address" value={student.address}/>
          </EditableCard>
          <EditableCard icon={UsersRound} title="Guardian" pending={pendingTypes.has('GUARDIAN')} onEdit={() => openRequest('GUARDIAN')}>
            <Row label="Name" value={guardian.full_name}/><Row label="Relationship" value={guardian.relationship}/><Row label="Contact" value={guardian.contact_number}/><Row label="Email" value={guardian.email}/>
          </EditableCard>
          <EditableCard icon={Phone} title="Emergency Contact" pending={pendingTypes.has('EMERGENCY_CONTACT')} onEdit={() => openRequest('EMERGENCY_CONTACT')}>
            <Row label="Name" value={emergency.full_name}/><Row label="Relationship" value={emergency.relationship}/><Row label="Contact" value={emergency.contact_number}/>
          </EditableCard>
        </div>

        <div className="space-y-6">
          <section className="surface p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><SectionTitle icon={HeartPulse} title="Medical Information"/><button className="btn-secondary" disabled={pendingTypes.has('HEALTH_INFORMATION')} onClick={() => openRequest('HEALTH_INFORMATION')}><ClipboardEdit size={17}/>{pendingTypes.has('HEALTH_INFORMATION') ? 'Review Pending' : 'Request Correction'}</button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><Medical label="Blood Type" value={student.blood_type}/><Medical label="Allergies" value={student.allergies}/><Medical label="Existing Conditions" value={student.existing_conditions}/><Medical label="Current Medications" value={student.current_medications}/><Medical label="Medical History" value={student.medical_history} wide/><Medical label="Immunization Information" value={student.immunizations} wide/></div>
          </section>
          {student.important_alerts && <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/30 dark:bg-red-500/10"><div className="flex items-start gap-3"><AlertTriangle className="shrink-0 text-red-600"/><div><h2 className="font-extrabold text-red-900 dark:text-red-200">Important Medical Alert</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-800 dark:text-red-200">{student.important_alerts}</p></div></div></section>}
          <section className="surface p-5">
            <SectionTitle icon={Ruler} title="Height and Weight" subtitle="Self-reported measurements remain separate from clinic vital signs."/>
            <form onSubmit={saveMeasurement} className="mt-5 grid gap-4 sm:grid-cols-2"><div><label className="label">Height (cm)</label><input className="input" type="number" min="50" max="260" step="0.1" value={measurement.heightCm} onChange={(e) => setMeasurement({ ...measurement, heightCm: e.target.value })}/></div><div><label className="label">Weight (kg)</label><input className="input" type="number" min="2" max="500" step="0.1" value={measurement.weightKg} onChange={(e) => setMeasurement({ ...measurement, weightKg: e.target.value })}/></div><div><label className="label">Measurement date *</label><input className="input" type="date" required max={today()} value={measurement.measuredOn} onChange={(e) => setMeasurement({ ...measurement, measuredOn: e.target.value })}/></div><div><label className="label">Notes</label><input className="input" maxLength={1000} value={measurement.notes} onChange={(e) => setMeasurement({ ...measurement, notes: e.target.value })}/></div><div className="sm:col-span-2"><button className="btn-primary" disabled={busy || (!measurement.heightCm && !measurement.weightKg)}><Plus size={17}/>{busy ? 'Saving…' : 'Add Measurement'}</button></div></form>
            <div className="mt-6 overflow-x-auto"><table className="table"><thead><tr><th>Date</th><th>Height</th><th>Weight</th><th>Source</th></tr></thead><tbody>{data.measurements?.length ? data.measurements.map((row) => <tr key={row.id}><td>{formatDate(row.measured_on)}</td><td>{row.height_cm ? `${row.height_cm} cm` : '—'}</td><td>{row.weight_kg ? `${row.weight_kg} kg` : '—'}</td><td><StatusBadge value={row.source}/></td></tr>) : <tr><td colSpan="4" className="text-center text-slate-500">No measurements have been submitted.</td></tr>}</tbody></table></div>
          </section>
          <section className="surface p-5"><SectionTitle icon={ShieldPlus} title="Privacy and Review"/><p className="mt-3 text-sm leading-6 text-slate-500">Your portal derives ownership from your authenticated session. Contact, guardian, emergency-contact, and health changes become official only after clinic review. Historical measurements are retained.</p></section>
        </div>
      </div>

      <section className="surface overflow-hidden"><div className="border-b p-5"><h2 className="text-lg font-extrabold">Correction Request History</h2><p className="mt-1 text-sm text-slate-500">Current and proposed values are preserved for audit and conflict review.</p></div><div className="table-wrap border-0 shadow-none"><table className="table"><thead><tr><th>Reference</th><th>Type</th><th>Status</th><th>Submitted</th><th>Reviewer comments</th></tr></thead><tbody>{data.corrections?.length ? data.corrections.map((row) => <tr key={row.id}><td className="font-bold">{row.request_number}</td><td>{titleCase(row.request_type)}</td><td><StatusBadge value={row.status}/></td><td>{formatDateTime(row.submitted_at)}</td><td>{row.reviewer_comments || '—'}</td></tr>) : <tr><td colSpan="5" className="text-center text-slate-500">No correction requests have been submitted.</td></tr>}</tbody></table></div></section>
    </div>}

    <Modal open={Boolean(editor)} onClose={() => !busy && setEditor(null)} title={editor?.title || 'Request Update'} maxWidth="max-w-3xl" footer={<><button className="btn-secondary" onClick={() => setEditor(null)} disabled={busy}>Cancel</button><button className="btn-primary" form="correction-form" disabled={busy}>{busy ? 'Submitting…' : 'Submit for Review'}</button></>}>
      {editor && <form id="correction-form" onSubmit={submitRequest} className="grid gap-4 sm:grid-cols-2"><RequestFields editor={editor} setEditor={setEditor}/><div className="sm:col-span-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">Submitting this form does not immediately change the official record. Authorized clinic personnel will compare the current and proposed values and notify you of the outcome.</div></form>}
    </Modal>
  </div>;
}

function SectionTitle({ icon: Icon, title, subtitle }) { return <div className="flex items-center gap-3"><div className="rounded-xl bg-kld-50 p-3 text-kld-700 dark:bg-kld-500/10 dark:text-kld-300"><Icon size={21}/></div><div><h2 className="text-lg font-extrabold">{title}</h2>{subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}</div></div>; }
function EditableCard({ icon, title, pending, onEdit, children }) { return <section className="surface p-5"><div className="flex items-center justify-between gap-3"><SectionTitle icon={icon} title={title}/><button className="btn-secondary" disabled={pending} onClick={onEdit}><ClipboardEdit size={16}/>{pending ? 'Pending' : 'Request Edit'}</button></div><dl className="mt-5 space-y-3 text-sm">{children}</dl></section>; }
function Row({ label, value }) { return <div className="flex items-start justify-between gap-4 border-b pb-2 last:border-0 dark:border-slate-800"><dt className="text-slate-500">{label}</dt><dd className="max-w-[65%] whitespace-pre-wrap text-right font-bold">{value || '—'}</dd></div>; }
function Medical({ label, value, wide }) { return <div className={`surface-muted p-4 ${wide ? 'sm:col-span-2' : ''}`}><div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-2 whitespace-pre-wrap text-sm leading-6">{value || 'Not recorded'}</div></div>; }
function RequestFields({ editor, setEditor }) {
  const set = (key, value) => setEditor({ ...editor, values: { ...editor.values, [key]: value } });
  const field = (label, key, type = 'text', required = false, span = '') => <div className={span}><label className="label">{label}{required && <span className="text-red-500"> *</span>}</label><input className="input" type={type} required={required} minLength={key === 'contactNumber' ? 7 : undefined} value={editor.values[key] ?? ''} onChange={(e) => set(key, e.target.value)}/></div>;
  const area = (label, key, span = 'sm:col-span-2') => <div className={span}><label className="label">{label}</label><textarea className="input min-h-24" maxLength={20000} value={editor.values[key] ?? ''} onChange={(e) => set(key, e.target.value)}/></div>;
  if (editor.type === 'CONTACT') return <>{field('Contact number', 'contactNumber', 'tel', true)}{field('Registered email', 'registeredEmail', 'email', true)}{area('Address', 'address')}</>;
  if (editor.type === 'GUARDIAN') return <>{field('Guardian name', 'fullName', 'text', true)}{field('Relationship', 'relationship', 'text', true)}{field('Contact number', 'contactNumber', 'tel', true)}{field('Email', 'email', 'email') }</>;
  if (editor.type === 'EMERGENCY_CONTACT') return <>{field('Emergency contact name', 'fullName', 'text', true)}{field('Relationship', 'relationship', 'text', true)}{field('Contact number', 'contactNumber', 'tel', true, 'sm:col-span-2')}</>;
  return <>{field('Blood type', 'bloodType')}{area('Allergies', 'allergies')}{area('Existing conditions', 'existingConditions')}{area('Current medications', 'currentMedications')}{area('Medical history', 'medicalHistory')}{area('Immunizations', 'immunizations')}{area('Important medical alerts', 'importantAlerts')}</>;
}
