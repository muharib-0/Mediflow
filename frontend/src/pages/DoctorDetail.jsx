import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import Alert from '../components/Alert';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

export default function DoctorDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    async function loadDoctor() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/api/doctors/${id}/`);
        setDoctor(data);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load this doctor.'));
      } finally {
        setLoading(false);
      }
    }

    loadDoctor();
  }, [id]);

  async function bookAppointment(event) {
    event.preventDefault();
    if (!selectedSlot) return;

    setBooking(true);
    setError('');
    setMessage('');

    try {
      await api.post(`/api/appointments/book/${selectedSlot.id}/`, { reason });
      setMessage('Appointment booked successfully.');
      setDoctor((current) => ({
        ...current,
        upcoming_slots: current.upcoming_slots.filter((slot) => slot.id !== selectedSlot.id),
      }));
      setSelectedSlot(null);
      setReason('');
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Someone just took that slot. Please choose another available time.');
      } else {
        setError(getErrorMessage(err, 'Could not book this appointment.'));
      }
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <p className="text-slate-600">Loading doctor...</p>;
  if (!doctor) return <Alert type="error">{error || 'Doctor not found.'}</Alert>;

  const slots = doctor.upcoming_slots ?? [];

  return (
    <>
      <PageHeader
        title={doctor.full_name}
        subtitle={`${doctor.specialization_display || doctor.specialization} • ${doctor.qualification}`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="card">
          <h2 className="text-lg font-bold">Profile</h2>
          <p className="mt-3 text-slate-600">{doctor.bio || 'No bio added yet.'}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-slate-500">Experience</dt>
              <dd className="font-semibold">{doctor.experience_years} years</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Fee</dt>
              <dd className="font-semibold">₹{doctor.consultation_fee}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Status</dt>
              <dd className="font-semibold">{doctor.is_available ? 'Available' : 'Unavailable'}</dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Book a slot</h2>
          <div className="mt-4 space-y-3">
            <Alert type="error">{error}</Alert>
            <Alert type="success">{message}</Alert>

            {!user && (
              <Alert type="warning">
                Please <Link className="font-semibold underline" to="/login">login</Link> as a patient to book.
              </Alert>
            )}
            {user?.role === 'doctor' && <Alert type="warning">Doctors can view slots, but only patients can book.</Alert>}

            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {slots.length ? (
                slots.map((slot) => (
                  <button
                    key={slot.id}
                    className={`w-full rounded-xl border p-3 text-left text-sm ${
                      selectedSlot?.id === slot.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                    disabled={!user || user.role !== 'patient'}
                  >
                    <span className="font-semibold">{slot.date}</span>
                    <span className="ml-2 text-slate-600">
                      {slot.start_time} – {slot.end_time}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-600">No upcoming slots are available.</p>
              )}
            </div>

            {user?.role === 'patient' && (
              <form onSubmit={bookAppointment} className="space-y-3">
                <textarea
                  className="field min-h-24"
                  placeholder="Reason for visit"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <button className="btn-primary w-full" disabled={!selectedSlot || booking}>
                  {booking ? 'Booking...' : 'Confirm appointment'}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
