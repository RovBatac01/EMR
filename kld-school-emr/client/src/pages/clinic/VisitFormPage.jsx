import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import SearchSelect from '../../components/SearchSelect';
import Alert from '../../components/Alert';
import LoadingScreen from '../../components/LoadingScreen';
import FormField, { fieldErrors } from '../../components/FormField';

const now = new Date();
const blank = { visitDate:now.toISOString().slice(0,10), visitTime:now.toTimeString().slice(0,5), visitType:'WALK_IN', reason:'', complaint:'', accompaniedBy:'', priority:'NORMAL', notes:'', status:'REGISTERED' };

export default function VisitFormPage() {
  const { id } = useParams(); const edit = Boolean(id); const [searchParams] = useSearchParams(); const navigate = useNavigate();
  const [patient, setPatient] = useState(null); const [form, setForm] = useState(blank); const [loading, setLoading] = useState(edit || Boolean(searchParams.get('patientId'))); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [errors, setErrors] = useState({});

  useEffect(() => {
    const patientId = searchParams.get('patientId');
    if (edit) {
      api.get(`/visits/${id}`).then(({ data }) => { const v = data.data; setPatient({ id:v.patient_id, label:`${[v.first_name,v.middle_name,v.last_name].filter(Boolean).join(' ')} · ${v.record_number}`, patient_type:v.patient_type, record_number:v.record_number }); setForm({ visitDate:String(v.visit_date).slice(0,10), visitTime:String(v.visit_time).slice(0,5), visitType:v.visit_type, reason:v.reason || '', complaint:v.complaint || '', accompaniedBy:v.accompanied_by || '', priority:v.priority, notes:v.notes || '', status:v.status }); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
    } else if (patientId) {
      api.get(`/patients/${patientId}`).then(({ data }) => { const p = data.data.patient; setPatient({ id:p.patient_id, label:`${p.name} · ${p.record_number}`, patient_type:p.patient_type, record_number:p.record_number }); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
    }
  }, [id, edit, searchParams]);

  const search = async (text) => { const { data } = await api.get('/patients/search', { params:{ search:text } }); return (data.data || []).map((row) => ({ ...row, id:row.patient_id, label:`${row.name} · ${row.record_number}` })); };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setErrors({});
    try { const payload = { ...form, patientId:patient?.id }; const { data } = edit ? await api.patch(`/visits/${id}`, payload) : await api.post('/visits', payload); navigate(`/visits/${data.data?.id || id}`); }
    catch (e) { setError(e.message); setErrors(fieldErrors(e)); }
    finally { setBusy(false); }
  };
  if (loading) return <LoadingScreen compact/>;
  return <div>
    <PageHeader title={edit ? 'Edit Clinic Visit' : 'Register Clinic Visit'} subtitle="Register a student or employee encounter, prioritize urgent needs, and continue to consultation without creating duplicate patient records." actions={<Link className="btn-secondary" to={edit ? `/visits/${id}` : '/visits'}><ArrowLeft size={17}/>Cancel</Link>}/>
    {error && <div className="mb-5"><Alert>{error}</Alert></div>}
    <form onSubmit={submit} className="space-y-6"><section className="surface p-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="md:col-span-2"><FormField label="Patient" name="patientId" required error={errors}><SearchSelect label="" required value={patient} onChange={setPatient} search={search} placeholder="Search student or employee record…" renderItem={(row) => <div><div className="font-bold">{row.label}</div><div className="text-xs text-slate-500">{row.patient_type}{row.program ? ` · ${row.program}` : ''}{row.department ? ` · ${row.department}` : ''}</div></div>}/></FormField></div>
      <Field label="Visit Date" name="visitDate" type="date" required value={form.visitDate} setForm={setForm} form={form} errors={errors}/><Field label="Visit Time" name="visitTime" type="time" required value={form.visitTime} setForm={setForm} form={form} errors={errors}/>
      <Select label="Visit Type" name="visitType" value={form.visitType} setForm={setForm} form={form} options={['WALK_IN','FOLLOW_UP','EMERGENCY','REFERRAL','MEDICAL_CLEARANCE','OTHER']}/><Select label="Priority" name="priority" value={form.priority} setForm={setForm} form={form} options={['NORMAL','MODERATE','URGENT','EMERGENCY']}/>{edit && <Select label="Status" name="status" value={form.status} setForm={setForm} form={form} options={['REGISTERED','IN_PROGRESS','COMPLETED','CANCELLED']}/>}<Field label="Accompanied By" name="accompaniedBy" value={form.accompaniedBy} setForm={setForm} form={form} errors={errors}/>
      <div className="md:col-span-2"><Field label="Reason for Visit" name="reason" required value={form.reason} setForm={setForm} form={form} errors={errors}/></div><div className="md:col-span-2"><FormField label="Chief Complaint" name="complaint" required error={errors}><textarea className="input min-h-24" required value={form.complaint} onChange={(e) => setForm({ ...form, complaint:e.target.value })}/></FormField></div><div className="md:col-span-2 xl:col-span-4"><label className="label">Additional Notes</label><textarea className="input min-h-28" value={form.notes} onChange={(e) => setForm({ ...form, notes:e.target.value })}/></div>
    </div></section><div className="flex justify-end"><button className="btn-primary px-6" disabled={busy || !patient}><Save size={18}/>{busy ? 'Saving…' : edit ? 'Save Visit Changes' : 'Register Visit'}</button></div></form>
  </div>;
}
function Field({ label, name, type='text', required, value, setForm, form, errors }) { return <FormField label={label} name={name} required={required} error={errors}><input className="input" type={type} required={required} value={value} onChange={(e) => setForm({ ...form, [name]:e.target.value })}/></FormField>; }
function Select({ label, name, value, setForm, form, options }) { return <div><label className="label">{label} *</label><select className="input" value={value} onChange={(e) => setForm({ ...form, [name]:e.target.value })}>{options.map((option) => <option key={option}>{option}</option>)}</select></div>; }
