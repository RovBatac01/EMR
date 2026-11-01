import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, Search, ShieldCheck, UserCog } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import { formatDateTime, fullName } from '../../utils/format';

const blank = {
  staffNumber: '', firstName: '', middleName: '', lastName: '', username: '', email: '',
  contactNumber: '', position: '', licenseNumber: '', roleCode: 'CLINIC_STAFF', status: 'ACTIVE', password: '',
  specialization: '', professionalLicenseNumber: '', licenseExpirationDate: '', signatureName: ''
};

export default function StaffPage() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', page: 1 });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [staff, roleList] = await Promise.all([
        api.get('/staff', { params: { ...filters, limit: 15 } }),
        api.get('/staff/roles')
      ]);
      setItems(staff.data.data);
      setMeta(staff.data.meta);
      setRoles(roleList.data.data);
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [filters.page, filters.role, filters.status]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));
  const openCreate = () => { setForm(blank); setModal({ type: 'staff', title: 'Add Staff Account' }); };
  const openEdit = (item) => {
    setForm({
      staffNumber: item.staff_number, firstName: item.first_name, middleName: item.middle_name || '', lastName: item.last_name,
      username: item.username, email: item.email, contactNumber: item.contact_number || '', position: item.position,
      licenseNumber: item.license_number || '', roleCode: item.role_code, status: item.status, password: '',
      specialization: item.specialization || '', professionalLicenseNumber: item.professional_license_number || '',
      licenseExpirationDate: item.license_expiration_date ? String(item.license_expiration_date).slice(0, 10) : '',
      signatureName: item.signature_name || ''
    });
    setModal({ type: 'staff', title: 'Edit Staff Account', item });
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      if (modal.item) {
        const { password, ...payload } = form;
        await api.patch(`/staff/${modal.item.id}`, payload);
      } else await api.post('/staff', form);
      setModal(null); setMessage({ type: 'success', text: modal.item ? 'Staff account updated.' : 'Staff account created.' }); load();
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  };
  const resetPassword = async (item) => {
    const temporaryPassword = prompt(`Enter a temporary password for ${fullName(item)}. It must have at least 10 characters, uppercase, lowercase, and a number.`);
    if (!temporaryPassword) return;
    try { await api.post(`/staff/${item.id}/reset-password`, { temporaryPassword }); setMessage({ type: 'success', text: 'Temporary password saved. Existing sessions were revoked.' }); }
    catch (error) { setMessage({ type: 'error', text: error.message }); }
  };

  const roleOptions = useMemo(() => roles.filter((role) => role.code !== 'STUDENT'), [roles]);
  const field = (label, key, type = 'text', required = true) => <div><label className="label">{label}{required && <span className="text-red-500"> *</span>}</label><input className="input" type={type} required={required} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}/></div>;

  return <div>
    <PageHeader title="Staff Management" subtitle="Provision clinic personnel, assign roles, and maintain secure account access." actions={can('staff.manage') && <button className="btn-primary" onClick={openCreate}><Plus size={17}/>Add Staff</button>}/>
    {message && <div className="mb-4"><Alert type={message.type} onClose={() => setMessage(null)}>{message.text}</Alert></div>}
    <div className="surface mb-5 p-4"><form className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto]" onSubmit={(e) => { e.preventDefault(); load(); }}><div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input pl-9" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} placeholder="Staff number, name, username, or email…"/></div><select className="input" value={filters.role} onChange={(e) => setFilter('role', e.target.value)}><option value="">All roles</option>{roleOptions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select><select className="input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}><option value="">All statuses</option>{['ACTIVE','DISABLED','LOCKED'].map((v) => <option key={v}>{v}</option>)}</select><button className="btn-secondary">Search</button></form></div>
    <div className="table-wrap">{loading ? <div className="p-12 text-center text-sm text-slate-500">Loading staff accounts…</div> : items.length ? <table className="table"><thead><tr><th>Staff Member</th><th>Position</th><th>Role</th><th>Status</th><th>Last Login</th><th className="text-right">Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><div className="font-bold text-slate-950 dark:text-white">{fullName(item)}</div><div className="text-xs text-slate-500">{item.staff_number} · @{item.username}</div><div className="text-xs text-slate-500">{item.email}</div></td><td>{item.position}<div className="text-xs text-slate-500">{item.role_code === 'DOCTOR' ? (item.specialization || 'General practice') : (item.license_number || 'No license number')}</div>{item.role_code === 'DOCTOR' && <div className="text-xs text-slate-500">PRC/License: {item.professional_license_number || '—'}</div>}</td><td><div className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-kld-600"/>{item.role_name}</div></td><td><StatusBadge value={item.status}/></td><td>{formatDateTime(item.last_login_at)}</td><td><div className="flex justify-end gap-1">{can('staff.manage') && <><button className="icon-button" title="Edit" onClick={() => openEdit(item)}><Pencil size={17}/></button><button className="icon-button" title="Reset password" onClick={() => resetPassword(item)}><KeyRound size={17}/></button></>}</div></td></tr>)}</tbody></table> : <EmptyState icon={UserCog} title="No staff accounts found" description="Adjust the filters or add the first clinic staff account."/>}</div>
    <Pagination meta={meta} onPage={(page) => setFilter('page', page)}/>
    <Modal open={modal?.type === 'staff'} onClose={() => setModal(null)} title={modal?.title} maxWidth="max-w-4xl" footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" form="staff-form" disabled={busy}>{busy ? 'Saving…' : 'Save Account'}</button></>}><form id="staff-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{field('Staff Number','staffNumber')}{field('First Name','firstName')}{field('Middle Name','middleName','text',false)}{field('Last Name','lastName')}{field('Username','username')}{field('Email','email','email')}{field('Contact Number','contactNumber','text',false)}{field('Position','position')}{field('General License Number','licenseNumber','text',false)}<div><label className="label">Role *</label><select className="input" value={form.roleCode} onChange={(e) => setForm({ ...form, roleCode: e.target.value })}>{roleOptions.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}</select></div><div><label className="label">Status *</label><select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{['ACTIVE','DISABLED','LOCKED'].map((v) => <option key={v}>{v}</option>)}</select></div>{!modal?.item && field('Temporary Password','password','password')}{form.roleCode === 'DOCTOR' && <><div className="sm:col-span-2 lg:col-span-3 border-t pt-4 dark:border-slate-800"><h3 className="font-extrabold">Doctor Professional Profile</h3><p className="text-sm text-slate-500">Only an active doctor profile can clinically sign off a consultation.</p></div>{field('Specialization','specialization','text',false)}{field('Professional License Number','professionalLicenseNumber','text',true)}{field('License Expiration Date','licenseExpirationDate','date',false)}{field('Signature Name','signatureName','text',false)}</>}</form></Modal>
  </div>;
}
