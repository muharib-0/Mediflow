import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import { getErrorMessage, unwrapResults } from '../../utils/errors';

const emptySlot = { date: '', start_time: '', end_time: '' };
const emptyBulkSlot = { date: '', start_time: '', end_time: '', slot_duration: '30' };

export default function DoctorAvailability() {
  const [slots, setSlots] = useState([]);
  const [singleSlot, setSingleSlot] = useState(emptySlot);
  const [bulkSlot, setBulkSlot] = useState(emptyBulkSlot);
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
      const { data } = await api.post('/api/doctors/me/availability/bulk/', bulkSlot);
      setBulkSlot(emptyBulkSlot);
      setMessage(`Created ${data.created_count} slot(s).${data.skipped_count ? ` ${data.skipped_count} existing or overlapping slot(s) skipped.` : ''}`);
      await loadSlots();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not generate availability slots. Check the selected date and times.'));
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
      <PageHeader title="Doctor availability" subtitle="Create one slot or generate a complete schedule from a date and time range." />

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
          <h2 className="text-lg font-bold">Generate multiple slots</h2>
          <p className="mt-1 text-sm text-slate-600">Select a working period and appointment length. We create every slot automatically.</p>
          <form onSubmit={createBulkSlots} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-medium">Date</span>
              <input className="field" type="date" value={bulkSlot.date} onChange={(e) => setBulkSlot({ ...bulkSlot, date: e.target.value })} required />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Appointment length</span>
              <select className="field" value={bulkSlot.slot_duration} onChange={(e) => setBulkSlot({ ...bulkSlot, slot_duration: e.target.value })}>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">From</span>
              <input className="field" type="time" value={bulkSlot.start_time} onChange={(e) => setBulkSlot({ ...bulkSlot, start_time: e.target.value })} required />
            </label>
            <label>
              <span className="mb-1 block text-sm font-medium">Until</span>
              <input className="field" type="time" value={bulkSlot.end_time} onChange={(e) => setBulkSlot({ ...bulkSlot, end_time: e.target.value })} required />
            </label>
            <button className="btn-primary w-full" disabled={submitting}>
              Generate slots
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
