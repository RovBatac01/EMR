import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import SearchSelect from '../../components/SearchSelect';
import Alert from '../../components/Alert';
import LoadingScreen from '../../components/LoadingScreen';
import FormField, { fieldErrors } from '../../components/FormField';

const recommendationOptions = ['REST','RETURN_TO_CLASS','PARENT_NOTIFICATION','REFERRAL','FOLLOW_UP','EMERGENCY_CARE'];
const vitalBlank = { temperature:'', systolic:'', diastolic:'', heartRate:'', respiratoryRate:'', oxygenSaturation:'', weight:'', height:'' };
const assessmentBlank = { generalAppearance:'', heent:'', respiratory:'', cardiovascular:'', abdomen:'', musculoskeletal:'', skin:'', neurological:'' };
const blank = { chiefComplaint:'', symptoms:'', diagnosis:'', findings:'', severity:'MILD', treatmentProvided:'', dosage:'', frequency:'', duration:'', recommendations:[], notes:'', status:'DRAFT', revisionReason:'', vitalSigns:vitalBlank, physicalAssessment:assessmentBlank };

export default function ConsultationFormPage() {
  const { id } = useParams(); const edit = Boolean(id); const [searchParams] = useSearchParams(); const navigate = useNavigate();
  const [visit,setVisit] = useState(null); const [form,setForm] = useState(blank); const [loading,setLoading] = useState(edit || Boolean(searchParams.get('visitId'))); const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [errors,setErrors] = useState({}); const [dirty,setDirty] = useState(false);
  const idempotencyKey = useRef(globalThis.crypto?.randomUUID?.() || `consultation-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const visitId = searchParams.get('visitId');
    if (edit) {
      api.get(`/consultations/${id}`).then(({data}) => { const c = data.data?.consultation; if (!c) throw new Error('The consultation response did not contain a clinical record.'); setVisit({ id:c.visit_id, label:`${c.visit_number} · ${c.patient_name} · ${c.record_number}` }); setForm({ chiefComplaint:c.chief_complaint || '', symptoms:c.symptoms || '', diagnosis:c.diagnosis || '', findings:c.findings || '', severity:c.severity || 'MILD', treatmentProvided:c.treatment_provided || '', dosage:c.dosage || '', frequency:c.frequency || '', duration:c.duration || '', recommendations:Array.isArray(c.recommendations) ? c.recommendations : [], notes:c.notes || '', status:['DRAFT','IN_PROGRESS'].includes(c.status) ? c.status : 'IN_PROGRESS', revisionReason:'', vitalSigns:{ temperature:c.temperature ?? '', systolic:c.systolic ?? '', diastolic:c.diastolic ?? '', heartRate:c.heart_rate ?? '', respiratoryRate:c.respiratory_rate ?? '', oxygenSaturation:c.oxygen_saturation ?? '', weight:c.weight ?? '', height:c.height ?? '' }, physicalAssessment:{ generalAppearance:c.general_appearance || '', heent:c.heent || '', respiratory:c.respiratory || '', cardiovascular:c.cardiovascular || '', abdomen:c.abdomen || '', musculoskeletal:c.musculoskeletal || '', skin:c.skin || '', neurological:c.neurological || '' } }); }).catch((e) => setError(e.message)).finally(() => { setLoading(false); setDirty(false); });
    } else if (visitId) {
      api.get(`/visits/${visitId}`).then(({data}) => { const v = data.data; const name=[v.first_name,v.middle_name,v.last_name].filter(Boolean).join(' '); setVisit({ id:v.id, label:`${v.visit_number} · ${name} · ${v.record_number}` }); setForm((current) => ({ ...current, chiefComplaint:v.complaint || '' })); }).catch((e) => setError(e.message)).finally(() => { setLoading(false); setDirty(false); });
    }
  },[id,edit,searchParams]);

  useEffect(() => {
    const warn = (event) => { if (!dirty || busy) return; event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy]);

  const searchVisits = async (text) => { const { data } = await api.get('/visits',{params:{search:text,limit:20}}); return (data.data || []).filter((row) => !row.consultation_id).map((row) => ({ id:row.id, label:`${row.visit_number} · ${[row.first_name,row.middle_name,row.last_name].filter(Boolean).join(' ')} · ${row.record_number}`, patient_type:row.patient_type, complaint:row.complaint })); };
  const set = (key,value) => { setDirty(true); setForm((current) => ({ ...current,[key]:value })); };
  const setVital = (key,value) => { setDirty(true); setForm((current) => ({ ...current, vitalSigns:{ ...current.vitalSigns,[key]:value } })); };
  const setAssessment = (key,value) => { setDirty(true); setForm((current) => ({ ...current, physicalAssessment:{ ...current.physicalAssessment,[key]:value } })); };
  const toggle = (value) => set('recommendations', form.recommendations.includes(value) ? form.recommendations.filter((item) => item !== value) : [...form.recommendations,value]);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setErrors({});
    try { const payload = { ...form, visitId:visit?.id, ...(!edit ? { idempotencyKey:idempotencyKey.current } : {}) }; const { data } = edit ? await api.patch(`/consultations/${id}`,payload) : await api.post('/consultations',payload); setDirty(false); navigate(`/consultations/${data.data?.id || id}`); }
    catch (e) { setError(e.message); setErrors(fieldErrors(e)); }
    finally { setBusy(false); }
  };
  if (loading) return <LoadingScreen compact/>;
  return <div><PageHeader title={edit ? 'Edit Consultation' : 'Create Consultation'} subtitle="Capture a structured clinical draft. Completion is a separate doctor-only sign-off action." actions={<Link className="btn-secondary" to={edit ? `/consultations/${id}` : '/consultations'} onClick={(event) => { if (dirty && !confirm('Discard unsaved consultation changes?')) event.preventDefault(); }}><ArrowLeft size={17}/>Cancel</Link>}/>
    {error && <div className="mb-5"><Alert>{error}</Alert></div>}
    <form onSubmit={submit} className="space-y-6">
      <section className="surface p-5"><h2 className="text-lg font-extrabold">Encounter & Clinical Summary</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="md:col-span-2"><FormField label="Clinic Visit" name="visitId" required error={errors}><SearchSelect label="" required value={visit} onChange={(value) => { setVisit(value); setDirty(true); }} search={searchVisits} placeholder="Search an open visit…" renderItem={(row) => <div><div className="font-bold">{row.label}</div><div className="text-xs text-slate-500">{row.patient_type} · {row.complaint}</div></div>}/></FormField></div><div className="md:col-span-2"><Area label="Chief Complaint" name="chiefComplaint" required value={form.chiefComplaint} onChange={(v) => set('chiefComplaint',v)} errors={errors}/></div><Area label="Symptoms" name="symptoms" value={form.symptoms} onChange={(v) => set('symptoms',v)} errors={errors}/><div><label className="label">Severity</label><select className="input" value={form.severity} onChange={(e) => set('severity',e.target.value)}>{['MILD','MODERATE','SEVERE','CRITICAL'].map((v) => <option key={v}>{v}</option>)}</select></div><Area label="Diagnosis" name="diagnosis" value={form.diagnosis} onChange={(v) => set('diagnosis',v)} errors={errors}/><Area label="Clinical Findings" name="findings" value={form.findings} onChange={(v) => set('findings',v)} errors={errors}/><Area label="Treatment Provided" name="treatmentProvided" value={form.treatmentProvided} onChange={(v) => set('treatmentProvided',v)} errors={errors}/><div><label className="label">Draft Status</label><select className="input" value={form.status} onChange={(e) => set('status',e.target.value)}><option>DRAFT</option><option>IN_PROGRESS</option></select><p className="mt-1 text-xs text-slate-500">A doctor must use Sign Off to mark it clinically completed.</p></div></div></section>
      <section className="surface p-5"><h2 className="text-lg font-extrabold">Vital Signs</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Temperature °C','temperature'],['Systolic','systolic'],['Diastolic','diastolic'],['Heart Rate bpm','heartRate'],['Respiratory Rate','respiratoryRate'],['Oxygen Saturation %','oxygenSaturation'],['Weight kg','weight'],['Height cm','height']].map(([label,key]) => <div key={key}><label className="label">{label}</label><input className="input" type="number" step="0.1" value={form.vitalSigns[key]} onChange={(e) => setVital(key,e.target.value)}/></div>)}</div></section>
      <section className="surface p-5"><h2 className="text-lg font-extrabold">Physical Assessment</h2><div className="mt-5 grid gap-4 md:grid-cols-2">{[['General Appearance','generalAppearance'],['HEENT','heent'],['Respiratory','respiratory'],['Cardiovascular','cardiovascular'],['Abdomen','abdomen'],['Musculoskeletal','musculoskeletal'],['Skin','skin'],['Neurological','neurological']].map(([label,key]) => <Area key={key} label={label} value={form.physicalAssessment[key]} onChange={(v) => setAssessment(key,v)}/>)}</div></section>
      <section className="surface p-5"><h2 className="text-lg font-extrabold">Treatment Instructions & Recommendations</h2><div className="mt-5 grid gap-4 md:grid-cols-3"><Field label="Dosage" value={form.dosage} onChange={(v) => set('dosage',v)}/><Field label="Frequency" value={form.frequency} onChange={(v) => set('frequency',v)}/><Field label="Duration" value={form.duration} onChange={(v) => set('duration',v)}/></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{recommendationOptions.map((value) => <label key={value} className="flex items-center gap-3 rounded-xl border p-3 text-sm font-bold"><input type="checkbox" checked={form.recommendations.includes(value)} onChange={() => toggle(value)}/>{value.replaceAll('_',' ')}</label>)}</div><div className="mt-5"><Area label="Medical Notes" value={form.notes} onChange={(v) => set('notes',v)} large/></div>{edit && <div className="mt-5"><label className="label">Correction Reason</label><input className="input" value={form.revisionReason} onChange={(e) => set('revisionReason',e.target.value)} placeholder="Required only when amending a completed or released record"/></div>}</section>
      <div className="flex justify-end"><button className="btn-primary px-6" disabled={busy || !visit}><Save size={18}/>{busy ? 'Saving…' : edit ? 'Save Consultation' : 'Create Consultation Draft'}</button></div>
    </form>
  </div>;
}
function Area({ label, name, required, value, onChange, errors={}, large }) { return <FormField label={label} name={name} required={required} error={errors}><textarea className={`input ${large ? 'min-h-40' : 'min-h-24'}`} required={required} value={value || ''} onChange={(e) => onChange(e.target.value)}/></FormField>; }
function Field({label,value,onChange}) { return <div><label className="label">{label}</label><input className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}/></div>; }
