import { useEffect, useState } from 'react';
import { BarChart3, Download, FileDown, Printer, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/format';

const today = new Date().toISOString().slice(0, 10);
const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

export default function ReportsPage() {
  const [range, setRange] = useState({ dateFrom: firstDay, dateTo: today, patientType: '' });
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await api.get('/reports/summary', { params: range });
      setData(response.data.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  const download = async (type) => {
    try {
      const response = await api.get(`/reports/visits.${type}`, {
        params: range,
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `kld-visits-${range.dateFrom}-to-${range.dateTo}.${type}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return <div>
    <PageHeader
      title="Reports & Analytics"
      subtitle="Generate permission-controlled clinic, attendance, medicine-consumption, expiry, and personnel reports from live database records."
      actions={<>
        <button className="btn-secondary" onClick={() => window.print()}><Printer size={17}/>Print</button>
        <button className="btn-secondary" onClick={() => download('csv')}><Download size={17}/>CSV</button>
        <button className="btn-primary" onClick={() => download('pdf')}><FileDown size={17}/>PDF</button>
      </>}
    />
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}

    <div className="surface mb-6 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><label className="label" htmlFor="report-date-from">Date From</label><input id="report-date-from" className="input" type="date" value={range.dateFrom} onChange={(event) => setRange({ ...range, dateFrom: event.target.value })}/></div>
        <div><label className="label" htmlFor="report-date-to">Date To</label><input id="report-date-to" className="input" type="date" value={range.dateTo} onChange={(event) => setRange({ ...range, dateTo: event.target.value })}/></div>
        <div><label className="label" htmlFor="report-patient-type">Patient Type</label><select id="report-patient-type" className="input" value={range.patientType} onChange={(event) => setRange({ ...range, patientType: event.target.value })}><option value="">Students and employees</option><option value="STUDENT">Students only</option><option value="EMPLOYEE">Employees only</option></select></div>
        <div className="flex items-end"><button className="btn-primary w-full" disabled={busy} onClick={load}><RefreshCw size={17} className={busy ? 'animate-spin' : ''}/>{busy ? 'Loading…' : 'Apply Filters'}</button></div>
      </div>
    </div>

    {data && <>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface p-5">
          <h2 className="font-extrabold">Staff Workload</h2>
          <p className="text-sm text-slate-500">Visits and consultations handled during the selected period</p>
          <div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.staff}><CartesianGrid strokeDasharray="3 3" opacity={.25}/><XAxis dataKey="name" tick={{ fontSize: 10 }}/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="visits_handled" name="Visits" fill="#0A5C36" radius={[6,6,0,0]}/><Bar dataKey="consultations_handled" name="Consultations" fill="#FCD116" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
        </section>
        <section className="surface p-5">
          <h2 className="font-extrabold">Report Totals</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="surface-muted p-4"><div className="text-3xl font-extrabold text-kld-700 dark:text-kld-300">{data.visits.length}</div><div className="text-sm text-slate-500">Clinic visits</div></div>
            <div className="surface-muted p-4"><div className="text-3xl font-extrabold text-kld-700 dark:text-kld-300">{data.medicine.length}</div><div className="text-sm text-slate-500">Medicine items</div></div>
            <div className="surface-muted p-4"><div className="text-3xl font-extrabold text-kld-700 dark:text-kld-300">{data.appointments.reduce((sum, row) => sum + Number(row.total), 0)}</div><div className="text-sm text-slate-500">Appointments</div></div>
            <div className="surface-muted p-4"><div className="text-3xl font-extrabold text-kld-700 dark:text-kld-300">{data.expiry.length}</div><div className="text-sm text-slate-500">Expiry rows</div></div>
          </div>
          <div className="mt-5 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-slate-700 dark:text-slate-200"><BarChart3 className="mb-2 text-kld-600"/>CSV and PDF exports use the same date and patient-type filters. Every export is recorded in the backend audit log.</div>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-extrabold">Clinic Visit Report</h2>
        <div className="table-wrap">{data.visits.length ? <table className="table"><thead><tr><th>Date</th><th>Patient</th><th>Type / Details</th><th>Visit Type</th><th>Complaint</th><th>Diagnosis</th><th>Staff</th><th>Status</th></tr></thead><tbody>{data.visits.slice(0,200).map((row,index) => <tr key={`${row.visit_number}-${index}`}><td>{formatDate(row.visit_date)}</td><td><div className="font-bold">{row.first_name} {row.middle_name || ''} {row.last_name}</div><div className="text-xs text-slate-500">{row.record_number}</div></td><td>{row.patient_type}<div className="text-xs text-slate-500">{row.program || row.department || '—'}{row.year_level ? ` · Year ${row.year_level}` : ''}</div></td><td>{row.visit_type}<div className="text-xs text-slate-500">{row.priority}</div></td><td>{row.complaint || '—'}</td><td>{row.diagnosis || '—'}</td><td>{row.staff_name || '—'}</td><td><StatusBadge value={row.status}/></td></tr>)}</tbody></table> : <EmptyState title="No report records" description="No clinic visits fall within the selected filters."/>}</div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-extrabold">Appointment Attendance</h2>
        <div className="table-wrap">{data.appointments.length ? <table className="table"><thead><tr><th>Date</th><th>Service</th><th>Status</th><th>Total</th></tr></thead><tbody>{data.appointments.map((row,index) => <tr key={`${row.appointment_date}-${row.service_name}-${row.status}-${index}`}><td>{formatDate(row.appointment_date)}</td><td>{row.service_name}</td><td><StatusBadge value={row.status}/></td><td className="font-black">{row.total}</td></tr>)}</tbody></table> : <EmptyState title="No appointment records" description="No appointment attendance records fall within the selected filters."/>}</div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-extrabold">Medicine Consumption</h2>
        <div className="table-wrap">{data.medicine.length ? <table className="table"><thead><tr><th>Date</th><th>Issuance</th><th>Patient</th><th>Medicine</th><th>Quantity</th><th>Issued By</th></tr></thead><tbody>{data.medicine.slice(0,200).map((row,index) => <tr key={`${row.issuance_number}-${index}`}><td>{formatDate(row.issued_date)}</td><td>{row.issuance_number}</td><td>{row.first_name} {row.middle_name || ''} {row.last_name}<div className="text-xs text-slate-500">{row.record_number} · {row.patient_type}</div></td><td>{row.generic_name}</td><td>{row.quantity} {row.unit}</td><td>{row.issued_by}</td></tr>)}</tbody></table> : <EmptyState title="No medicine usage" description="No completed medicine issuance falls within the selected filters."/>}</div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-extrabold">Medicine Expiration Report</h2>
        <div className="table-wrap">{data.expiry.length ? <table className="table"><thead><tr><th>Expiration</th><th>Medicine</th><th>Batch</th><th>Quantity</th><th>Status</th><th>Record</th></tr></thead><tbody>{data.expiry.map((row,index) => <tr key={`${row.batch_number}-${index}`}><td>{formatDate(row.expiration_date)}</td><td><div className="font-bold">{row.generic_name}</div><div className="text-xs text-slate-500">{row.brand_name || 'Generic'} · {row.medicine_code}</div></td><td>{row.batch_number}</td><td>{row.quantity} {row.unit}</td><td><StatusBadge value={row.stock_status}/></td><td>{row.archived_at ? <StatusBadge value="ARCHIVED"/> : <StatusBadge value="ACTIVE"/>}</td></tr>)}</tbody></table> : <EmptyState title="No expiration records" description="No medicine batches expire within the selected date range."/>}</div>
      </section>
    </>}
  </div>;
}
