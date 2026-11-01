import { useEffect, useState } from 'react';
import { Pencil, Plus, UserRoundCog } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

const blank = { name: '', description: '', isActive: true };

export default function EmployeeCategoriesPage() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients/employee-categories');
      setItems(data.data || []);
      setMessage(null);
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = () => { setEditing(null); setForm(blank); setOpen(true); };
  const edit = (row) => {
    setEditing(row);
    setForm({ name: row.name || '', description: row.description || '', isActive: Boolean(row.is_active) });
    setOpen(true);
  };
  const save = async (event) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const response = editing
        ? await api.patch(`/patients/employee-categories/${editing.id}`, form)
        : await api.post('/patients/employee-categories', form);
      setOpen(false); setForm(blank); setEditing(null);
      setMessage({ type: 'success', text: response.data.message });
      await load();
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  };
  const deactivate = async (row) => {
    if (!confirm(`Deactivate ${row.name}? Existing employee records will remain linked to it.`)) return;
    try {
      const { data } = await api.delete(`/patients/employee-categories/${row.id}`);
      setMessage({ type: 'success', text: data.message }); await load();
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
  };

  return <div>
    <PageHeader title="Employee Patient Categories" subtitle="Maintain configurable personnel groups without granting clinic-system access to employee patients." actions={can('employees.manage') && <button className="btn-primary" onClick={create}><Plus size={17}/>Add Category</button>}/>
    {message && <div className="mb-4"><Alert type={message.type} onClose={() => setMessage(null)}>{message.text}</Alert></div>}
    <section className="surface overflow-hidden">
      {loading ? <div className="p-12 text-center text-sm text-slate-500">Loading employee categories…</div> : items.length ? <div className="table-wrap border-0 shadow-none"><table className="table"><thead><tr><th>Category</th><th>Description</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{items.map((row) => <tr key={row.id}><td className="font-extrabold">{row.name}</td><td>{row.description || '—'}</td><td><StatusBadge value={row.is_active ? 'ACTIVE' : 'DISABLED'}/></td><td><div className="flex justify-end gap-2">{can('employees.manage') && <><button className="icon-button" title="Edit category" onClick={() => edit(row)}><Pencil size={17}/></button>{row.is_active ? <button className="btn-secondary !px-3 !py-2 text-red-600" onClick={() => deactivate(row)}>Deactivate</button> : null}</>}</div></td></tr>)}</tbody></table></div> : <EmptyState icon={UserRoundCog} title="No employee categories" description="Create categories such as Faculty, Maintenance, Security, or University Administration."/>}
    </section>
    <Modal open={open} onClose={() => !busy && setOpen(false)} title={editing ? 'Edit Employee Category' : 'Add Employee Category'} footer={<><button className="btn-secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</button><button className="btn-primary" form="employee-category-form" disabled={busy}>{busy ? 'Saving…' : 'Save Category'}</button></>}>
      <form id="employee-category-form" onSubmit={save} className="space-y-4"><div><label className="label">Category name *</label><input className="input" required minLength={2} maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div><div><label className="label">Description</label><textarea className="input min-h-24" maxLength={500} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></div><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}/>Active for new employee records</label></form>
    </Modal>
  </div>;
}
