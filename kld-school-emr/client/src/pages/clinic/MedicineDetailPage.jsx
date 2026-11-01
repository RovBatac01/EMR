import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import LoadingScreen from '../../components/LoadingScreen';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { formatDate } from '../../utils/format';

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold">
      {value === '' || value == null ? '—' : value}
    </div>
  </div>
);

function createEmptyBatch() {
  const today = new Date();
  const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  return {
    batchNumber: '',
    quantity: 1,
    expirationDate: '',
    receivedDate: localDate
  };
}

export default function MedicineDetailPage() {
  const { id } = useParams();
  const { can } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [batchError, setBatchError] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(createEmptyBatch);
  const batchIdempotencyKey = useRef(globalThis.crypto?.randomUUID?.() || `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setData(null);
    setError('');
    setBatchError('');
    setOpen(false);
    setBatch(createEmptyBatch());

    async function load() {
      try {
        const response = await api.get(`/medicines/${id}`);
        const result = response.data.data;

        if (!result?.medicine) {
          throw new Error('The medicine response did not contain a record.');
        }

        if (active) {
          setData(result);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || 'Unable to load the medicine record.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    // Return a cleanup function, not the Promise from load().
    return () => {
      active = false;
    };
  }, [id]);

  const closeModal = () => {
    if (!busy) {
      setOpen(false);
      setBatchError('');
    }
  };

  const openReceiveModal = () => {
    setBatch(createEmptyBatch());
    setBatchError('');
    batchIdempotencyKey.current = globalThis.crypto?.randomUUID?.() || `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setOpen(true);
  };

  const receive = async (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    const quantity = Number(batch.quantity);
    const batchNumber = batch.batchNumber.trim();

    if (!batchNumber) {
      setBatchError('Enter a batch number.');
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      setBatchError('Quantity must be a whole number of at least 1.');
      return;
    }

    if (!batch.expirationDate || !batch.receivedDate) {
      setBatchError('Enter the expiration date and received date.');
      return;
    }

    setBusy(true);
    setBatchError('');
    setError('');

    try {
      await api.post(`/medicines/${id}/batches`, {
        ...batch,
        batchNumber,
        quantity,
        idempotencyKey: batchIdempotencyKey.current
      });

      setOpen(false);
      setBatch(createEmptyBatch());

      try {
        const response = await api.get(`/medicines/${id}`);
        const result = response.data.data;

        if (!result?.medicine) {
          throw new Error('The refreshed response did not contain a record.');
        }

        setData(result);
      } catch {
        setError(
          'The batch was saved, but the updated inventory could not be loaded. ' +
          'Reload the page before receiving more stock. Do not submit the same batch again.'
        );
      }
    } catch (requestError) {
      setBatchError(
        requestError.message || 'Unable to receive the medicine batch.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <LoadingScreen compact />;
  }

  if (!data?.medicine) {
    return (
      <div>
        <PageHeader
          title="Medicine Details"
          actions={
            <Link className="btn-secondary" to="/medicines">
              <ArrowLeft size={17} />
              Inventory
            </Link>
          }
        />
        <Alert>{error || 'Medicine record not found.'}</Alert>
      </div>
    );
  }

  const m = data.medicine;
  const batches = Array.isArray(data.batches) ? data.batches : [];

  return (
    <div>
      <PageHeader
        title={m.generic_name}
        subtitle={`${m.brand_name || 'Generic'} · ${m.medicine_code}`}
        actions={
          <>
            <Link className="btn-secondary" to="/medicines">
              <ArrowLeft size={17} />
              Inventory
            </Link>

            {can('medicines.write') && !m.archived_at && (
              <>
                <Link
                  className="btn-secondary"
                  to={`/medicines/${id}/edit`}
                >
                  <Pencil size={17} />
                  Edit
                </Link>

                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={openReceiveModal}
                >
                  <Plus size={17} />
                  Receive Batch
                </button>
              </>
            )}
          </>
        }
      />

      {m.archived_at && (
        <div className="mb-4"><Alert type="warning">This medicine is archived and read-only. Existing batches, stock balances, and transactions remain visible. Restore it from Archives before editing or receiving stock.</Alert></div>
      )}

      {error && (
        <div className="mb-4">
          <Alert onClose={() => setError('')}>{error}</Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">
              Inventory Summary
            </h2>
            <StatusBadge value={m.stock_status} />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Info
              label="Available Stock"
              value={`${m.available_quantity ?? 0} ${m.unit || ''}`}
            />
            <Info
              label="Total Stock"
              value={`${m.total_quantity ?? 0} ${m.unit || ''}`}
            />
            <Info
              label="Minimum Stock"
              value={`${m.minimum_stock ?? 0} ${m.unit || ''}`}
            />
            <Info
              label="Nearest Expiration"
              value={
                m.nearest_expiration
                  ? formatDate(m.nearest_expiration)
                  : '—'
              }
            />
            <Info label="Dosage / Form" value={m.dosage_form} />
            <Info label="Category" value={m.category_name} />
            <Info label="Supplier" value={m.supplier} />
            <Info label="Storage" value={m.storage_location} />
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg font-extrabold">Warnings</h2>

          <div className="mt-5 space-y-4">
            <Info
              label="Expired Quantity"
              value={`${m.expired_quantity ?? 0} ${m.unit || ''}`}
            />
            <Info
              label="Active Record"
              value={Number(m.is_active) === 1 ? 'Yes' : 'No'}
            />
          </div>
        </section>
      </div>

      <section className="surface mt-6 overflow-hidden">
        <div className="border-b p-5">
          <h2 className="text-lg font-extrabold">Stock Batches</h2>
          <p className="text-sm text-slate-500">
            Oldest eligible batch is selected first during automatic issuance.
          </p>
        </div>

        <div className="table-wrap rounded-none border-0 shadow-none">
          <table className="table">
            <thead>
              <tr>
                <th>Batch Number</th>
                <th>Quantity</th>
                <th>Received</th>
                <th>Expiration</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {batches.length ? (
                batches.map((item) => (
                  <tr key={item.id}>
                    <td className="font-bold">{item.batch_number}</td>
                    <td>
                      {item.quantity} {m.unit}
                    </td>
                    <td>{formatDate(item.received_date)}</td>
                    <td>{formatDate(item.expiration_date)}</td>
                    <td>
                      <StatusBadge value={item.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-slate-500"
                  >
                    No stock batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={open}
        onClose={closeModal}
        title="Receive Medicine Batch"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={closeModal}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="receive-medicine-batch"
              className="btn-primary"
              disabled={busy}
            >
              {busy ? 'Saving…' : 'Receive Stock'}
            </button>
          </>
        }
      >
        <form id="receive-medicine-batch" onSubmit={receive}>
          {batchError && (
            <div className="mb-4">
              <Alert>{batchError}</Alert>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Batch Number', 'batchNumber', 'text'],
              ['Quantity', 'quantity', 'number'],
              ['Expiration Date', 'expirationDate', 'date'],
              ['Received Date', 'receivedDate', 'date']
            ].map(([label, key, type]) => (
              <div key={key}>
                <label className="label" htmlFor={`batch-${key}`}>
                  {label} *
                </label>

                <input
                  id={`batch-${key}`}
                  className="input"
                  type={type}
                  min={type === 'number' ? 1 : undefined}
                  step={type === 'number' ? 1 : undefined}
                  required
                  disabled={busy}
                  value={batch[key]}
                  onChange={(event) => {
                    const value = event.target.value;

                    setBatch((current) => ({
                      ...current,
                      [key]: value
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        </form>
      </Modal>
    </div>
  );
}