import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Alert from '../components/Alert';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, unwrapResults } from '../utils/errors';

export default function AppointmentList() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadAppointments() {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/appointments/mine/');
      setAppointments(unwrapResults(data));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load appointments.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function cancelAppointment(appointmentId) {
    setError('');
    setMessage('');

    try {
      await api.post(`/api/appointments/${appointmentId}/cancel/`);
      setMessage('Appointment cancelled.');
      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not cancel this appointment.'));
    }
  }

  return (
    <>
      <PageHeader
        title="My appointments"
        subtitle={user.role === 'doctor' ? 'Appointments booked with you.' : 'Your upcoming and past appointments.'}
      />

      <div className="space-y-4">
        <Alert type="error">{error}</Alert>
        <Alert type="success">{message}</Alert>

        {loading ? (
          <p className="text-slate-600">Loading appointments...</p>
        ) : appointments.length ? (
          appointments.map((appointment) => (
            <article key={appointment.id} className="card flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">
                    {user.role === 'doctor' ? appointment.patient_name : appointment.doctor_name}
                  </h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                    {appointment.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {appointment.date} • {appointment.start_time} – {appointment.end_time}
                </p>
                {appointment.reason && <p className="mt-2 text-sm text-slate-600">Reason: {appointment.reason}</p>}
              </div>

              {user.role === 'patient' && appointment.status !== 'cancelled' && (
                <button className="btn-secondary text-red-700" onClick={() => cancelAppointment(appointment.id)}>
                  Cancel
                </button>
              )}
              {user.role === 'doctor' && (
                <Link className="btn-secondary" to={`/doctor/appointments/${appointment.id}/patient`}>
                  View patient details
                </Link>
              )}
            </article>
          ))
        ) : (
          <div className="card text-center text-slate-600">No appointments yet.</div>
        )}
      </div>
    </>
  );
}
