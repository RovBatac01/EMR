import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import LoadingScreen from '../../components/LoadingScreen';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { formatDate, formatDateTime } from '../../utils/format';

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold">
      {value ?? '—'}
    </div>
  </div>
);

export default function IssuanceDetailPage() {
  const { id } = useParams();
  const { can } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setData(null);
    setError('');
    setOpen(false);
    setReason('');

    async function load() {
      try {
        const response = await api.get(`/medicine-issuance/${id}`);
        const result = response.data.data;

        if (!result?.issuance) {
          throw new Error('The issuance response did not contain a record.');
        }

        if (active) {
          setData(result);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || 'Unable to load the medicine issuance.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const closeModal = () => {
    if (!busy) {
      setOpen(false);
    }
  };

  const voidIt = async () => {
    const trimmedReason = reason.trim();

    if (busy || trimmedReason.length < 5) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      await api.post(`/medicine-issuance/${id}/void`, {
        reason: trimmedReason
      });

      setOpen(false);
      setReason('');

      // The reversal succeeded. Disable further void attempts immediately.
      setData((current) =>
        current
          ? {
              ...current,
              issuance: {
                ...current.issuance,
                status: 'VOIDED',
                void_reason: trimmedReason
              }
            }
          : current
      );

      try {
        const response = await api.get(`/medicine-issuance/${id}`);

        if (!response.data.data?.issuance) {
          throw new Error('The refreshed response did not contain a record.');
        }

        setData(response.data.data);
      } catch (refreshError) {
        setError(
          'The issuance was voided, but its updated details could not be loaded. Reload the page.'
        );
      }
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to void the medicine issuance.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <LoadingScreen compact />;
  }

  if (!data?.issuance) {
    return (
      <div>
        <PageHeader
          title="Medicine Issuance"
          actions={
            <Link className="btn-secondary" to="/medicine-issuance">
              <ArrowLeft size={17} />
              History
            </Link>
          }
        />
        <Alert>{error || 'Medicine issuance not found.'}</Alert>
      </div>
    );
  }

  const h = data.issuance;
  const items = Array.isArray(data.items) ? data.items : [];

  const patientName = [h.first_name, h.middle_name, h.last_name]
    .filter(Boolean)
    .join(' ');

  const subtitle = [
    patientName,
    h.patient_type,
    h.record_number
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div>
      <PageHeader
        title={h.issuance_number}
        subtitle={subtitle}
        actions={
          <>
            <Link className="btn-secondary" to="/medicine-issuance">
              <ArrowLeft size={17} />
              History
            </Link>

            {can('medicines.issue') && h.status === 'COMPLETED' && (
              <button
                type="button"
                className="btn-danger"
                disabled={busy}
                onClick={() => {
                  setReason('');
                  setError('');
                  setOpen(true);
                }}
              >
                <Ban size={17} />
                Void Issuance
              </button>
            )}
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">
              Issued Medicines
            </h2>
            <StatusBadge value={h.status} />
          </div>

          <div className="mt-5 table-wrap shadow-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Quantity</th>
                  <th>Instructions</th>
                </tr>
              </thead>

              <tbody>
                {items.length ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="font-bold">
                          {item.generic_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {[item.brand_name || 'Generic', item.dosage]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </td>

                      <td>
                        {item.batch_number}
                        <div className="text-xs text-slate-500">
                          Exp {formatDate(item.expiration_date)}
                        </div>
                      </td>

                      <td>
                        {item.quantity} {item.unit}
                      </td>

                      <td>
                        {[item.frequency, item.duration]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                        <div className="text-xs text-slate-500">
                          {item.instructions || '—'}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-slate-500"
                    >
                      No issued medicines found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="surface p-5">
          <h2 className="text-lg font-extrabold">Transaction</h2>

          <div className="mt-5 space-y-4">
            <Info
              label="Issued At"
              value={formatDateTime(h.issued_at)}
            />
            <Info
              label="Issued By"
              value={h.issued_by_name || '—'}
            />
            <Info label="Notes" value={h.notes || '—'} />

            {h.voided_at && (
              <Info
                label="Voided At"
                value={formatDateTime(h.voided_at)}
              />
            )}

            {h.void_reason && (
              <Info label="Void Reason" value={h.void_reason} />
            )}
          </div>
        </aside>
      </div>

      <Modal
        open={open}
        onClose={closeModal}
        title="Void Medicine Issuance"
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
              type="button"
              className="btn-danger"
              disabled={busy || reason.trim().length < 5}
              onClick={voidIt}
            >
              {busy ? 'Restoring stock…' : 'Void and Restore Stock'}
            </button>
          </>
        }
      >
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
          This creates a reversal transaction and returns each quantity
          to its original batch. The original issuance remains in history.
        </p>

        {error && (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <label className="label" htmlFor="void-reason">
          Reason for voiding *
        </label>

        <textarea
          id="void-reason"
          className="input min-h-28"
          value={reason}
          disabled={busy}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Enter a reason with at least 5 characters."
        />
      </Modal>
    </div>
  );
}