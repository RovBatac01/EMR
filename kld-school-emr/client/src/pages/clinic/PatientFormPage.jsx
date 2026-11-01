import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, TriangleAlert } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import LoadingScreen from '../../components/LoadingScreen';
import FormField, { fieldErrors } from '../../components/FormField';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

const studentBlank = { studentNumber:'', firstName:'', middleName:'', lastName:'', birthDate:'', sex:'', program:'', yearLevel:'', section:'', registeredEmail:'', contactNumber:'', address:'', enrollmentStatus:'ACTIVE', academicYear:'2026-2027', semester:'1st Semester', portalEligible:true };
const employeeBlank = { employeeNumber:'', categoryId:'', firstName:'', middleName:'', lastName:'', birthDate:'', sex:'', department:'', positionTitle:'', employmentStatus:'ACTIVE', email:'', contactNumber:'', address:'' };
const medicalBlank = { bloodType:'', allergies:'', existingConditions:'', currentMedications:'', medicalHistory:'', immunizations:'', importantAlerts:'' };
const contactBlank = { fullName:'', relationship:'', contactNumber:'', email:'' };

export default function PatientFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [patientType, setPatientType] = useState(searchParams.get('patientType') === 'EMPLOYEE' ? 'EMPLOYEE' : 'STUDENT');
  const [identity, setIdentity] = useState(studentBlank);
  const [medical, setMedical] = useState(medicalBlank);
  const [guardian, setGuardian] = useState(contactBlank);
  const [emergencyContact, setEmergencyContact] = useState(contactBlank);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(edit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => { api.get('/patients/employee-categories').then(({ data }) => setCategories((data.data || []).filter((row) => row.is_active))).catch(() => {}); }, []);
  useEffect(() => {
    if (!edit) return;
    api.get(`/patients/${id}`).then(({ data }) => {
      const p = data.data.patient || {};
      setPatientType(p.patient_type);
      setIdentity(p.patient_type === 'STUDENT' ? {
        studentNumber:p.student_number || p.record_number || '', firstName:p.first_name || '', middleName:p.middle_name || '', lastName:p.last_name || '', birthDate:String(p.birth_date || '').slice(0,10), sex:p.sex || '', program:p.program || '', yearLevel:p.year_level || '', section:p.section || '', registeredEmail:p.email || '', contactNumber:p.contact_number || '', address:p.address || '', enrollmentStatus:p.enrollment_status || 'ACTIVE', academicYear:p.academic_year || '', semester:p.semester || '', portalEligible:Boolean(p.portal_eligible)
      } : {
        employeeNumber:p.employee_number || p.record_number || '', categoryId:p.employee_category_id || '', firstName:p.first_name || '', middleName:p.middle_name || '', lastName:p.last_name || '', birthDate:String(p.birth_date || '').slice(0,10), sex:p.sex || '', department:p.department || '', positionTitle:p.position_title || '', employmentStatus:p.employment_status || 'ACTIVE', email:p.email || '', contactNumber:p.contact_number || '', address:p.address || ''
      });
      setMedical({ bloodType:p.blood_type || '', allergies:p.allergies || '', existingConditions:p.existing_conditions || '', currentMedications:p.current_medications || '', medicalHistory:p.medical_history || '', immunizations:p.immunizations || '', importantAlerts:p.important_alerts || '' });
      const g = data.data.guardians?.[0]; const c = data.data.emergencyContacts?.[0];
      if (g) setGuardian({ fullName:g.full_name || '', relationship:g.relationship || '', contactNumber:g.contact_number || '', email:g.email || '' });
      if (c) setEmergencyContact({ fullName:c.full_name || '', relationship:c.relationship || '', contactNumber:c.contact_number || '', email:'' });
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id, edit]);

  const switchType = (type) => { if (edit) return; setPatientType(type); setIdentity(type === 'STUDENT' ? studentBlank : employeeBlank); setErrors({}); };
  const persist = async (payload) => {
    setBusy(true); setError(''); setErrors({});
    try {
      const { data } = edit
        ? await api.patch(`/patients/${id}`, { identity, medical, guardian: payload.guardian, emergencyContact: payload.emergencyContact })
        : await api.post('/patients', payload);
      navigate(`/patients/${data.data?.id || id}`);
    } catch (e) { setError(e.message); setErrors(fieldErrors(e)); }
    finally { setBusy(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    const payload = { patientType, identity, medical, guardian: guardian.fullName && guardian.contactNumber ? guardian : null, emergencyContact: emergencyContact.fullName && emergencyContact.contactNumber ? emergencyContact : null };
    if (edit) return persist(payload);
    setBusy(true); setError(''); setErrors({});
    try {
      const officialNumber = patientType === 'STUDENT' ? identity.studentNumber : identity.employeeNumber;
      const { data } = await api.get('/patients/duplicate-check', { params: { patientType, recordNumber: officialNumber, firstName: identity.firstName, lastName: identity.lastName, birthDate: identity.birthDate } });
      if ((data.data || []).length) {
        setDuplicateMatches(data.data); setPendingPayload(payload); return;
      }
    } catch (e) { setError(e.message); return; }
    finally { setBusy(false); }
    return persist(payload);
  };
  if (loading) return <LoadingScreen compact/>;

  return <div>
    <PageHeader title={edit ? `Edit ${patientType === 'STUDENT' ? 'Student' : 'Employee'} Patient` : 'Register Patient'} subtitle="Maintain identity, guardian or emergency contacts, and clinical baseline information without linking employee patient status to system permissions." actions={<Link className="btn-secondary" to={edit ? `/patients/${id}` : '/patients'}><ArrowLeft size={17}/>Cancel</Link>}/>
    {error && <div className="mb-5"><Alert>{error}</Alert></div>}
    {!edit && <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border bg-white p-2 dark:border-slate-800 dark:bg-slate-900"><button type="button" className={patientType === 'STUDENT' ? 'btn-primary' : 'btn-secondary'} onClick={() => switchType('STUDENT')}>Student Patient</button><button type="button" className={patientType === 'EMPLOYEE' ? 'btn-primary' : 'btn-secondary'} onClick={() => switchType('EMPLOYEE')}>Employee Patient</button></div>}
    <form onSubmit={submit} className="space-y-6">
      <section className="surface p-5"><h2 className="text-lg font-extrabold">{patientType === 'STUDENT' ? 'Student Identity & Enrollment' : 'Employee Identity & Employment'}</h2><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {patientType === 'STUDENT' ? <StudentFields form={identity} setForm={setIdentity} errors={errors}/> : <EmployeeFields form={identity} setForm={setIdentity} errors={errors} categories={categories}/>} 
      </div></section>
      <section className="grid gap-6 xl:grid-cols-2"><ContactSection title="Guardian / Parent" form={guardian} setForm={setGuardian} errors={errors} optional/><ContactSection title="Emergency Contact" form={emergencyContact} setForm={setEmergencyContact} errors={errors} hideEmail/></section>
      <section className="surface p-5"><h2 className="text-lg font-extrabold">Medical Information</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><TextInput label="Blood Type" value={medical.bloodType} onChange={(value) => setMedical({ ...medical, bloodType:value })}/>{['allergies','existingConditions','currentMedications','medicalHistory','immunizations','importantAlerts'].map((key) => <div key={key} className={['medicalHistory','immunizations','importantAlerts'].includes(key) ? 'md:col-span-2' : ''}><label className="label">{labelFor(key)}</label><textarea className="input min-h-24" value={medical[key]} onChange={(e) => setMedical({ ...medical, [key]:e.target.value })}/></div>)}</div></section>
      <div className="flex justify-end"><button className="btn-primary min-w-40" disabled={busy}><Save size={17}/>{busy ? 'Saving…' : 'Save Patient'}</button></div>
    </form>
    <Modal open={duplicateMatches.length > 0} onClose={() => { setDuplicateMatches([]); setPendingPayload(null); }} title="Potential Duplicate Patient" footer={<><button type="button" className="btn-secondary" onClick={() => { setDuplicateMatches([]); setPendingPayload(null); }}>Review Form</button><button type="button" className="btn-primary" disabled={busy} onClick={() => { const payload = pendingPayload; setDuplicateMatches([]); setPendingPayload(null); if (payload) persist(payload); }}>Continue Registration</button></>}>
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-500/10 dark:text-amber-200"><TriangleAlert className="mt-0.5 shrink-0"/><p className="text-sm leading-6">The system found possible active or archived matches. Review them before registering another patient. Continuing never merges or overwrites an existing record, and unique identifiers may still block the save.</p></div>
      <div className="mt-4 space-y-3">{duplicateMatches.map((match) => <div key={match.patient_id} className="rounded-xl border p-4 dark:border-slate-700"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-black">{[match.first_name, match.middle_name, match.last_name].filter(Boolean).join(' ')}</div><StatusBadge value={match.archived_at ? 'ARCHIVED' : match.status}/></div><div className="mt-1 text-sm text-slate-500">{match.record_number} · {match.official_number} · Birth date {String(match.birth_date || '').slice(0,10)}</div>{match.archived_at && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Archived record: {match.archive_reason || 'No archive reason provided'}</p>}</div>)}</div>
    </Modal>
  </div>;
}

function StudentFields({ form, setForm, errors }) {
  const set = (key, value) => setForm({ ...form, [key]:value });
  return <><TextInput label="Student Number" name="studentNumber" required value={form.studentNumber} onChange={(v) => set('studentNumber',v)} errors={errors}/><NameFields form={form} set={set} errors={errors}/><TextInput label="Birth Date" name="birthDate" type="date" required value={form.birthDate} onChange={(v) => set('birthDate',v)} errors={errors}/><SexField value={form.sex} onChange={(v) => set('sex',v)}/><TextInput label="Program / Course" name="program" required value={form.program} onChange={(v) => set('program',v)} errors={errors}/><TextInput label="Year Level" name="yearLevel" required value={form.yearLevel} onChange={(v) => set('yearLevel',v)} errors={errors}/><TextInput label="Section" name="section" value={form.section} onChange={(v) => set('section',v)} errors={errors}/><TextInput label="Registered Email" name="registeredEmail" type="email" required value={form.registeredEmail} onChange={(v) => set('registeredEmail',v)} errors={errors}/><TextInput label="Contact Number" name="contactNumber" value={form.contactNumber} onChange={(v) => set('contactNumber',v)} errors={errors}/><div><label className="label">Enrollment Status</label><select className="input" value={form.enrollmentStatus} onChange={(e) => set('enrollmentStatus',e.target.value)}>{['ACTIVE','INACTIVE','GRADUATED','TRANSFERRED','SUSPENDED'].map((v) => <option key={v}>{v}</option>)}</select></div><TextInput label="Academic Year" name="academicYear" required value={form.academicYear} onChange={(v) => set('academicYear',v)} errors={errors}/><TextInput label="Semester" name="semester" required value={form.semester} onChange={(v) => set('semester',v)} errors={errors}/><div className="md:col-span-2"><label className="label">Address</label><textarea className="input min-h-24" value={form.address} onChange={(e) => set('address',e.target.value)}/></div><label className="flex items-center gap-3 self-end rounded-xl border p-3 text-sm font-bold"><input type="checkbox" checked={form.portalEligible} onChange={(e) => set('portalEligible',e.target.checked)}/>Eligible for Student Portal activation</label></>;
}
function EmployeeFields({ form, setForm, errors, categories }) {
  const set = (key, value) => setForm({ ...form, [key]:value });
  return <><TextInput label="Employee Number" name="employeeNumber" required value={form.employeeNumber} onChange={(v) => set('employeeNumber',v)} errors={errors}/><NameFields form={form} set={set} errors={errors}/><TextInput label="Birth Date" name="birthDate" type="date" required value={form.birthDate} onChange={(v) => set('birthDate',v)} errors={errors}/><SexField value={form.sex} onChange={(v) => set('sex',v)}/><FormField label="Employee Category" name="categoryId" required error={errors}><select className="input" required value={form.categoryId} onChange={(e) => set('categoryId',e.target.value)}><option value="">Select category</option>{categories.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></FormField><TextInput label="Department" name="department" required value={form.department} onChange={(v) => set('department',v)} errors={errors}/><TextInput label="Position Title" name="positionTitle" value={form.positionTitle} onChange={(v) => set('positionTitle',v)} errors={errors}/><div><label className="label">Employment Status</label><select className="input" value={form.employmentStatus} onChange={(e) => set('employmentStatus',e.target.value)}>{['ACTIVE','INACTIVE','ON_LEAVE','SEPARATED'].map((v) => <option key={v}>{v}</option>)}</select></div><TextInput label="Email" name="email" type="email" value={form.email} onChange={(v) => set('email',v)} errors={errors}/><TextInput label="Contact Number" name="contactNumber" value={form.contactNumber} onChange={(v) => set('contactNumber',v)} errors={errors}/><div className="md:col-span-2"><label className="label">Address</label><textarea className="input min-h-24" value={form.address} onChange={(e) => set('address',e.target.value)}/></div></>;
}
function NameFields({ form, set, errors }) { return <><TextInput label="First Name" name="firstName" required value={form.firstName} onChange={(v) => set('firstName',v)} errors={errors}/><TextInput label="Middle Name" name="middleName" value={form.middleName} onChange={(v) => set('middleName',v)} errors={errors}/><TextInput label="Last Name" name="lastName" required value={form.lastName} onChange={(v) => set('lastName',v)} errors={errors}/></>; }
function SexField({ value, onChange }) { return <div><label className="label">Sex *</label><select className="input" required value={value} onChange={(e) => onChange(e.target.value)}><option value="">Select sex</option>{['MALE','FEMALE','OTHER','PREFER_NOT_TO_SAY'].map((v) => <option key={v}>{v}</option>)}</select></div>; }
function TextInput({ label, name, type='text', required=false, value, onChange, errors={} }) { return <FormField label={label} name={name} required={required} error={errors}><input id={name} className="input" type={type} required={required} value={value ?? ''} onChange={(e) => onChange(e.target.value)}/></FormField>; }
function ContactSection({ title, form, setForm, hideEmail, optional }) { const set=(key,value)=>setForm({...form,[key]:value}); return <section className="surface p-5"><h2 className="text-lg font-extrabold">{title}</h2>{optional && <p className="mt-1 text-xs text-slate-500">Optional for employee records and adult patients.</p>}<div className="mt-5 grid gap-4 sm:grid-cols-2"><TextInput label="Full Name" value={form.fullName} onChange={(v)=>set('fullName',v)}/><TextInput label="Relationship" value={form.relationship} onChange={(v)=>set('relationship',v)}/><TextInput label="Contact Number" value={form.contactNumber} onChange={(v)=>set('contactNumber',v)}/>{!hideEmail && <TextInput label="Email" type="email" value={form.email} onChange={(v)=>set('email',v)}/>}</div></section>; }
function labelFor(value) { return value.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()); }
