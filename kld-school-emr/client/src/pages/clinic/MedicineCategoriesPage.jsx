import { useEffect, useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

const blank = { name: '', description: '', isActive: true };

export default function MedicineCategoriesPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/medicines/categories').then(({ data }) => setRows(data.data || [])).catch((e) => setError(e.message));
 	useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(blank); setModal({ title: 'Add Medicine Category' }); };
  const openEdit = (row) => { setForm({ name: row.name || '', description: row.description || '', isActive: Boolean(row.is_active) }); setModal({ title: 'Edit Medicine Category', row }); };
  const save = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const response = modal.row ? await api.patch(`/medicines/categories/${modal.row.id}`, form) : await api.post('/medicines/categories', form);
      setSuccess(response.data.message); setModal(null); await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const remove = async (row) => {
    if (!confirm(`Remove ${row.name}? Categories already used by medicines will be safely deactivated instead of deleted.`)) return;
    try { const { data } = await api.delete(`/medicines/categories/${row.id}`); setSuccess(data.message); await load(); } catch (e) { setError(e.message); }
  };

  return <div>
    <PageHeader title="Medicine Categories" subtitle="Maintain reusable medicine classifications without breaking existing inventory records." actions={can('medicines.write') && <button className="btn-primary" onClick={openCreate}><Plus size={17}/>Add Category</button>}/>
    {error && <div className="mb-4"><Alert onClose={() => setError('')}>{error}</Alert></div>}
    {success && <div className="mb-4"><Alert type="success" onClose={() => setSuccess('')}>{success}</Alert></div>}
    <div className="table-wrap">
      {rows.length ? <table className="table"><thead><tr><th>Category</th><th>Description</th><th>Medicines</th><th>Status</th><th className="text-right">Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><div className="flex items-center gap-2 font-extrabold"><Tags size={16} className="text-kld-600"/>{row.name}</div></td><td className="max-w-xl">{row.description || '—'}</td><td>{row.medicine_count ?? 0}</td><td><StatusBadge value={row.is_active ? 'ACTIVE' : 'DISABLED'}/></td><td><div className="flex justify-end gap-1">{can('medicines.write') && <><button className="icon-button" title="Edit" onClick={() => openEdit(row)}><Pencil size={17}/></button><button className="icon-button text-red-600" title="Delete or deactivate" onClick={() => remove(row)}><Trash2 size={17}/></button></>}</div></td></tr>)}</tbody></table> : <EmptyState title="No medicine categories" description="Create a category before adding categorized medicines."/>}
    </div>
    <Modal open={Boolean(modal)} onClose={() => setModal(null)} title={modal?.title} footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" form="medicine-category-form" disabled={busy}>{busy ? 'Saving…' : 'Save Category'}</button></>}>
      <form id="medicine-category-form" onSubmit={save} className="space-y-4"><div><label className="label">Category name *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div><div><label className="label">Description</label><textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></div><label className="flex items-center gap-3 rounded-xl border p-3 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}/>Active and available for new medicines</label></form>
    </Modal>
  </div>;
}
