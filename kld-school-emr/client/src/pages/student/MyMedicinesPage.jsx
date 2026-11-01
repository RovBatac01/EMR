import { useEffect, useState } from 'react';
import { Pill } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Alert from '../../components/Alert';
import { formatDateTime } from '../../utils/format';

export default function MyMedicinesPage() {
  const [items, setItems] = useState([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/student-portal/medicines').then((response) => setItems(response.data.data)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  return <div><PageHeader title="My Medicines" subtitle="Medicines formally issued to you through completed clinic transactions."/>{error && <div className="mb-4"><Alert>{error}</Alert></div>}<div className="table-wrap">{loading ? <div className="p-12 text-center text-sm text-slate-500">Loading medicine history…</div> : items.length ? <table className="table"><thead><tr><th>Issued</th><th>Issuance ID</th><th>Medicine</th><th>Quantity</th><th>Dosage</th><th>Schedule</th><th>Instructions</th><th>Issued By</th></tr></thead><tbody>{items.map((item, index) => <tr key={`${item.issuance_number}-${index}`}><td>{formatDateTime(item.issued_at)}</td><td className="font-mono text-xs font-bold">{item.issuance_number}</td><td><div className="font-bold">{item.generic_name}</div><div className="text-xs text-slate-500">{item.brand_name || 'Generic'} · {item.dosage_form}</div></td><td>{item.quantity} {item.unit}</td><td>{item.dosage || '—'}</td><td>{[item.frequency,item.duration].filter(Boolean).join(' · ') || '—'}</td><td className="min-w-56">{item.instructions || '—'}</td><td>{item.issued_by}</td></tr>)}</tbody></table> : <EmptyState icon={Pill} title="No medicines issued" description="Completed medicine-issuance transactions will appear here."/>}</div></div>;
}
