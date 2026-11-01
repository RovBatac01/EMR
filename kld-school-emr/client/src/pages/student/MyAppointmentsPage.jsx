import { useEffect, useState } from 'react';
import { CalendarDays, Check, Clock3, Plus, X } from 'lucide-react';
import { api } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { formatDateTime } from '../../utils/format';

function localDateToday() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');
}

export default function MyAppointmentsPage() {
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({
    serviceId: '',
    date: '',
    requestedStart: '',
    reason: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [availabilityVersion, setAvailabilityVersion] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [servicesResponse, appointmentsResponse] = await Promise.all([
          api.get('/appointments/services'),
          api.get('/appointments', {
            params: { limit: 100 }
          })
        ]);

        if (active) {
          setServices(servicesResponse.data.data || []);
          setAppointments(appointmentsResponse.data.data || []);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError.message || 'Unable to load your appointments.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    // React receives a cleanup function, not a Promise.
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setSlots([]);
    setSlotsError('');

    if (!form.serviceId || !form.date) {
      setSlotsLoading(false);
      return;
    }

    setSlotsLoading(true);

    async function loadSlots() {
      try {
        const response = await api.get('/appointments/availability', {
          params: {
            serviceId: form.serviceId,
            date: form.date
          }
        });

        if (active) {
          const availableSlots = response.data.data?.slots || [];
          setSlots(availableSlots);

          setForm((current) => {
            const selectionIsAvailable = availableSlots.some(
              (slot) =>
                slot.start === current.requestedStart &&
                Number(slot.available) > 0
            );

            return selectionIsAvailable
              ? current
              : { ...current, requestedStart: '' };
          });
        }
      } catch (requestError) {
        if (active) {
          setSlotsError(
            requestError.message || 'Unable to load available times.'
          );
        }
      } finally {
        if (active) {
          setSlotsLoading(false);
        }
      }
    }

    loadSlots();

    return () => {
      active = false;
    };
  }, [form.serviceId, form.date, availabilityVersion]);

  async function refreshAppointments() {
    const response = await api.get('/appointments', {
      params: { limit: 100 }
    });

    setAppointments(response.data.data || []);
  }

  const submit = async (event) => {
    event.preventDefault();

    if (busy) {
      return;
    }

    const selectedSlot = slots.find(
      (slot) => slot.start === form.requestedStart
    );

    if (!selectedSlot || Number(selectedSlot.available) <= 0) {
      setError('Select an available time slot.');
      return;
    }

    if (!form.reason.trim()) {
      setError('Enter a reason for your appointment.');
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const randomPart =
        globalThis.crypto?.randomUUID?.() ||
        Math.random().toString(36).slice(2);

      const response = await api.post('/appointments', {
        serviceId: form.serviceId,
        requestedStart: form.requestedStart,
        reason: form.reason.trim(),
        idempotencyKey: `${Date.now()}-${randomPart}`
      });

      setSuccess(response.data.message || 'Appointment request submitted.');
      setForm((current) => ({
        ...current,
        requestedStart: '',
        reason: ''
      }));
      setAvailabilityVersion((current) => current + 1);

      try {
        await refreshAppointments();
      } catch {
        setError(
          'Your request was saved, but appointment history could not be refreshed. ' +
          'Reload the page. Do not submit the same request again.'
        );
      }
    } catch (requestError) {
      setError(
        requestError.message || 'Unable to submit your appointment request.'
      );
    } finally {
      setBusy(false);
    }
  };

  const respond = async (id, response) => {
    if (busy) {
      return;
    }

    let reason = null;

    if (response === 'DECLINE') {
      const enteredReason = window.prompt(
        'Optional reason for declining:',
        ''
      );

      if (enteredReason === null) {
        return;
      }

      reason = enteredReason.trim() || null;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.post(`/appointments/${id}/respond`, {
        response,
        reason
      });

      setSuccess(result.data.message || 'Your response was saved.');
      setAvailabilityVersion((current) => current + 1);

      try {
        await refreshAppointments();
      } catch {
        setError(
          'Your response was saved, but appointment history could not be refreshed. ' +
          'Reload the page before taking another action.'
        );
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to save your response.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Appointments"
        subtitle="Request a clinic service, review staff-proposed schedules, and track confirmation or queue status."
      />

      {error && (
        <div className="mb-4">
          <Alert onClose={() => setError('')}>{error}</Alert>
        </div>
      )}

      {success && (
        <div className="mb-4">
          <Alert type="success" onClose={() => setSuccess('')}>
            {success}
          </Alert>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <form className="surface p-5" onSubmit={submit}>
          <div className="flex items-center gap-2">
            <CalendarDays className="text-kld-700" />
            <h2 className="text-lg font-extrabold">
              Request an appointment
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="appointment-service">
                Clinic service *
              </label>
              <select
                id="appointment-service"
                className="input"
                required
                disabled={busy || loading}
                value={form.serviceId}
                onChange={(event) => {
                  const serviceId = event.target.value;

                  setSlots([]);
                  setForm((current) => ({
                    ...current,
                    serviceId,
                    requestedStart: ''
                  }));
                }}
              >
                <option value="">
                  {loading ? 'Loading services…' : 'Select a service'}
                </option>

                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.duration_minutes} min
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="appointment-date">
                Preferred date *
              </label>
              <input
                id="appointment-date"
                className="input"
                type="date"
                required
                disabled={busy}
                min={localDateToday()}
                value={form.date}
                onChange={(event) => {
                  const date = event.target.value;

                  setSlots([]);
                  setForm((current) => ({
                    ...current,
                    date,
                    requestedStart: ''
                  }));
                }}
              />
            </div>

            <div>
              <div className="label">Available time *</div>

              {slotsError && (
                <div className="mb-3">
                  <Alert>{slotsError}</Alert>
                </div>
              )}

              {slotsLoading ? (
                <p className="text-sm text-slate-500">
                  Loading available times…
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {slots.map((slot) => {
                    const available = Number(slot.available) > 0;
                    const selected = form.requestedStart === slot.start;

                    return (
                      <button
                        type="button"
                        key={slot.start}
                        disabled={busy || !available}
                        aria-pressed={selected}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            requestedStart: slot.start
                          }))
                        }
                        className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                          selected
                            ? 'border-kld-600 bg-kld-600 text-white'
                            : available
                              ? 'bg-white hover:border-kld-500 dark:bg-slate-900'
                              : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}
                      >
                        {slot.start.slice(11, 16)}
                        <span className="block text-[10px] font-medium">
                          {slot.available} left
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {form.date &&
                form.serviceId &&
                !slotsLoading &&
                !slotsError &&
                !slots.length && (
                  <p className="mt-2 text-xs text-slate-500">
                    No configured slots are available for this date.
                  </p>
                )}
            </div>

            <div>
              <label className="label" htmlFor="appointment-reason">
                Reason *
              </label>
              <textarea
                id="appointment-reason"
                className="input min-h-28"
                required
                disabled={busy}
                value={form.reason}
                onChange={(event) => {
                  const reason = event.target.value;

                  setForm((current) => ({
                    ...current,
                    reason
                  }));
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={
                busy ||
                loading ||
                slotsLoading ||
                !form.requestedStart
              }
            >
              <Plus size={17} />
              {busy ? 'Processing…' : 'Submit request'}
            </button>
          </div>
        </form>

        <section className="surface overflow-hidden">
          <div className="border-b p-5">
            <h2 className="text-lg font-extrabold">
              Appointment history
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading appointments…
            </div>
          ) : appointments.length ? (
            <div className="divide-y dark:divide-slate-800">
              {appointments.map((row) => (
                <div key={row.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-extrabold">
                        {row.service_name}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {row.appointment_number} ·{' '}
                        {formatDateTime(
                          row.status === 'PROPOSED'
                            ? row.proposed_start || row.requested_start
                            : row.confirmed_start ||
                                row.proposed_start ||
                                row.requested_start
                        )}
                      </div>
                    </div>

                    <StatusBadge value={row.status} />
                  </div>

                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {row.reason}
                  </p>

                  {row.status === 'PROPOSED' && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                      <div className="text-sm font-bold">
                        Clinic proposed:{' '}
                        {formatDateTime(row.proposed_start)}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="btn-primary px-3 py-2"
                          disabled={busy}
                          onClick={() => respond(row.id, 'ACCEPT')}
                        >
                          <Check size={16} />
                          Accept
                        </button>

                        <button
                          type="button"
                          className="btn-secondary px-3 py-2"
                          disabled={busy}
                          onClick={() => respond(row.id, 'DECLINE')}
                        >
                          <X size={16} />
                          Decline
                        </button>
                      </div>
                    </div>
                  )}

                  {row.queue_number && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-kld-50 px-3 py-2 text-sm font-bold text-kld-800 dark:bg-kld-500/10 dark:text-kld-300">
                      <Clock3 size={16} />
                      Queue #{row.queue_number} · {row.queue_status}
                    </div>
                  )}

                  {row.cancellation_reason && (
                    <p className="mt-2 text-xs font-semibold text-red-600">
                      {row.cancellation_reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No appointments yet"
              description="Use the form to request your first clinic appointment."
            />
          )}
        </section>
      </div>
    </div>
  );
}