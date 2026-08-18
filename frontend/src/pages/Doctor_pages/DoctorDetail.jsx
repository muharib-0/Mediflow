import { CalendarDays, Clock, GraduationCap, IndianRupee, Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage, unwrapResults } from '../../utils/errors';

function displaySpecialization(value) {
  return value?.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!/^\d+$/.test(String(id))) {
        navigate('/doctors', { replace: true });
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [{ data: doctorData }, { data: slotsData }] = await Promise.all([
          api.get(`/api/doctors/${id}/`),
          api.get('/api/doctors/availability/', { params: { doctor_id: id } }),
        ]);
        if (!mounted) return;
        setDoctor(doctorData);
        setSlots(unwrapResults(slotsData));
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, 'Could not load this doctor’s details.'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  function beginBooking(slot) {
    setError('');
    setMessage('');
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setSelectedSlot(slot);
  }

  async function bookSelectedSlot(event) {
    event.preventDefault();
    if (!selectedSlot) return;

    setBooking(true);
    setError('');
    try {
      await api.post(`/api/appointments/book/${selectedSlot.id}/`, { reason });
      setSlots((current) => current.filter((slot) => slot.id !== selectedSlot.id));
      setSelectedSlot(null);
      setReason('');
      setMessage('Appointment booked successfully. You can view it in My appointments.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not book this slot. It may have just been booked by another patient.'));
      setSelectedSlot(null);
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <p className="text-center text-slate-600">Loading doctor details...</p>;
  if (!doctor) return <Alert type="error">{error || 'Doctor not found.'}</Alert>;

  const doctorName = doctor.full_name || `Dr. ${doctor.first_name} ${doctor.last_name}`;

  return (
    <>
      <PageHeader title={doctorName} subtitle={displaySpecialization(doctor.specialization)} />
      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      <section className="card">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
            <Stethoscope size={30} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-950">{doctorName}</h2>
            <p className="mt-1 font-medium text-sky-700">{displaySpecialization(doctor.specialization)}</p>
            <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <p className="flex items-center gap-2"><GraduationCap size={17} className="text-sky-700" /> {doctor.qualification}</p>
              <p className="flex items-center gap-2"><IndianRupee size={17} className="text-sky-700" /> Consultation fee: ₹{doctor.consultation_fee}</p>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="font-semibold text-slate-900">About the doctor</h3>
              <p className="mt-2 whitespace-pre-line leading-6 text-slate-600">{doctor.bio || 'No bio has been added yet.'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Available slots</h2>
            <p className="mt-1 text-sm text-slate-600">Choose a convenient time to book an appointment.</p>
          </div>
          {message && <Link className="btn-secondary" to="/appointments">My appointments</Link>}
        </div>

        {slots.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {slots.map((slot) => (
              <article key={slot.id} className="rounded-xl border border-slate-200 p-4">
                <p className="flex items-center gap-2 font-semibold text-slate-900"><CalendarDays size={17} className="text-sky-700" /> {slot.date}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Clock size={16} /> {slot.start_time} – {slot.end_time}</p>
                <button className="btn-primary mt-4 w-full" onClick={() => beginBooking(slot)}>Book this slot</button>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-slate-600">No upcoming open slots are available right now.</p>
        )}
      </section>

      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={bookSelectedSlot} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold">Confirm appointment</h2>
            <p className="mt-2 text-sm text-slate-600">{selectedSlot.date} · {selectedSlot.start_time} – {selectedSlot.end_time}</p>
            <label className="mt-5 block">
              <span className="mb-1 block text-sm font-medium">Reason for visit <span className="text-slate-400">(optional)</span></span>
              <textarea className="field min-h-24" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Briefly describe what you need help with" />
            </label>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => setSelectedSlot(null)} disabled={booking}>Cancel</button>
              <button className="btn-primary" disabled={booking}>{booking ? 'Booking...' : 'Confirm booking'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
