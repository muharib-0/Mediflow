import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Alert from '../components/Alert';
import PageHeader from '../components/PageHeader';
import { getErrorMessage, unwrapResults } from '../utils/errors';

const emptySlot = { date: '', start_time: '', end_time: '' };

export default function DoctorAvailability() {
  const [slots, setSlots] = useState([]);
  const [singleSlot, setSingleSlot] = useState(emptySlot);
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadSlots() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/doctors/me/availability/');
      setSlots(unwrapResults(data));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your availability.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  async function createSingleSlot(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await api.post('/api/doctors/me/availability/', singleSlot);
      setSingleSlot(emptySlot);
      setMessage('Availability slot added.');
      await loadSlots();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not add this slot.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function createBulkSlots(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const slotsPayload = bulkText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [date, start_time, end_time] = line.split(',').map((part) => part.trim());
          return { date, start_time, end_time };
        });

      const { data } = await api.post('/api/doctors/me/availability/bulk/', { slots: slotsPayload });
      setBulkText('');
      setMessage(`Created ${data.created_count} slot(s). ${data.error_count ? `${data.error_count} row(s) had errors.` : ''}`);
      await loadSlots();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not add bulk slots. Use: YYYY-MM-DD,HH:MM,HH:MM'));
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteSlot(slotId) {
    setError('');
    setMessage('');

    try {
      await api.delete(`/api/doctors/me/availability/${slotId}/`);
      setMessage('Slot deleted.');
      await loadSlots();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete this slot. It may already have an appointment booked.'));
    }
  }

  return (
    <>
      <PageHeader title="Doctor availability" subtitle="Create single slots or paste several rows for bulk creation." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-lg font-bold">Add one slot</h2>
          <form onSubmit={createSingleSlot} className="mt-4 grid gap-4 sm:grid-cols-3">
            <label>
              <span className="mb-1 block text-sm font-medium">Date</span>
              <input className="field" type="date" value={singleSlot.date} onChange={(e) => setSingleSlot({ ...singleSlot, date: e.target.value })} required />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Start</span>
              <input className="field" type="time" value={singleSlot.start_time} onChange={(e) => setSingleSlot({ ...singleSlot, start_time: e.target.value })} required />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">End</span>
              <input className="field" type="time" value={singleSlot.end_time} onChange={(e) => setSingleSlot({ ...singleSlot, end_time: e.target.value })} required />
            </label>
            <button className="btn-primary sm:col-span-3" disabled={submitting}>
              Add slot
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Bulk add</h2>
          <p className="mt-1 text-sm text-slate-600">One slot per line: YYYY-MM-DD,HH:MM,HH:MM</p>
          <form onSubmit={createBulkSlots} className="mt-4 space-y-3">
            <textarea
              className="field min-h-32 font-mono"
              placeholder={'2026-08-05,09:00,09:30\n2026-08-05,09:30,10:00'}
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              required
            />
            <button className="btn-primary w-full" disabled={submitting}>
              Add bulk slots
            </button>
          </form>
        </section>
      </div>

      <div className="mt-6 space-y-4">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{message}</Alert>

        <section className="card">
          <h2 className="text-lg font-bold">Your slots</h2>
          {loading ? (
            <p className="mt-4 text-slate-600">Loading slots...</p>
          ) : slots.length ? (
            <div className="mt-4 divide-y divide-slate-100">
              {slots.map((slot) => (
                <div key={slot.id} className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold">
                      {slot.date} • {slot.start_time} – {slot.end_time}
                    </p>
                    <p className="text-sm text-slate-600">{slot.is_booked ? 'Booked' : 'Open'}</p>
                  </div>
                  <button className="btn-secondary text-red-700" onClick={() => deleteSlot(slot.id)} disabled={slot.is_booked}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-slate-600">No availability slots yet.</p>
          )}
        </section>
      </div>
    </>
  );
}
