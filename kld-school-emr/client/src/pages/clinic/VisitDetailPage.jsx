import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Stethoscope } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import LoadingScreen from '../../components/LoadingScreen';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, titleCase } from '../../utils/format';

export default function VisitDetailPage() {
  const { id } = useParams(); const { can } = useAuth(); const [data,setData] = useState(null); const [error,setError] = useState('');
  useEffect(() => { api.get(`/visits/${id}`).then(({data}) => setData(data.data)).catch((e) => setError(e.message)); },[id]);
  if (!data && !error) return <LoadingScreen compact/>;
  if (!data) return <div><PageHeader title="Visit Record"/><Alert>{error}</Alert><Link className="btn-secondary mt-4" to="/visits"><ArrowLeft size={17}/>History</Link></div>;
  const patientName = [data.first_name,data.middle_name,data.last_name].filter(Boolean).join(' ');
  return <div><PageHeader title={data.visit_number || 'Clinic Visit'} subtitle={`${patientName || 'Unknown patient'} · ${data.patient_type || 'PATIENT'} · ${data.record_number || '—'}`} actions={<><Link className="btn-secondary" to="/visits"><ArrowLeft size={17}/>History</Link>{can('visits.write') && <Link className="btn-secondary" to={`/visits/${id}/edit`}><Pencil size={17}/>Edit Visit</Link>}{data.consultation_id ? <Link className="btn-primary" to={`/consultations/${data.consultation_id}`}><Stethoscope size={17}/>View Consultation</Link> : can('consultations.write') && <Link className="btn-primary" to={`/consultations/new?visitId=${id}`}><Stethoscope size={17}/>Start Consultation</Link>}</>}/>
    {error && <div className="mb-4"><Alert>{error}</Alert></div>}
    <div className="grid gap-6 lg:grid-cols-3"><section className="surface p-5 lg:col-span-2"><div className="flex flex-wrap gap-2"><StatusBadge value={data.status}/><StatusBadge value={data.priority}/><StatusBadge value={data.visit_type}/></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><Info label="Visit Date" value={formatDate(data.visit_date)}/><Info label="Visit Time" value={String(data.visit_time || '').slice(0,5)}/><Info label="Reason" value={data.reason}/><Info label="Chief Complaint" value={data.complaint}/><Info label="Accompanied By" value={data.accompanied_by}/><Info label="Registered By" value={data.registered_by_name}/><div className="sm:col-span-2"><Info label="Notes" value={data.notes}/></div></div></section><section className="surface p-5"><h2 className="text-lg font-extrabold">Patient Snapshot</h2><div className="mt-5 space-y-4"><Info label="Record Number" value={data.record_number}/><Info label="Patient Type" value={titleCase(data.patient_type)}/>{data.patient_type === 'STUDENT' ? <><Info label="Program" value={data.program}/><Info label="Year / Section" value={`${data.year_level || '—'}${data.section ? ` / ${data.section}` : ''}`}/></> : <><Info label="Department" value={data.department}/><Info label="Position" value={data.position_title}/></>}<Info label="Sex" value={titleCase(data.sex)}/><Info label="Birth Date" value={formatDate(data.birth_date || data.student_birth_date || data.employee_birth_date)}/><Link className="btn-secondary w-full" to={`/patients/${data.patient_id}`}>Open Full Profile</Link></div></section></div>
  </div>;
}
function Info({label,value}) { return <div><div className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="mt-1 whitespace-pre-wrap text-sm font-semibold">{value || '—'}</div></div>; }
