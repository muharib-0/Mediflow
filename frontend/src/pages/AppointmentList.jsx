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
  const [notesDrafts, setNotesDrafts] = useState({});
  const [prescriptionDrafts, setPrescriptionDrafts] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [prescribingId, setPrescribingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null); // which card's prescription form is open

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

  // Completed/no-show visits move to the Patient History page — this list
  // is for the doctor's active/upcoming workload, not a record archive.
  // Patients still see their own completed visits here (no separate
  // history page exists for them).
  const visibleAppointments = appointments.filter(
    (a) => user.role !== 'doctor' || !['completed', 'no_show'].includes(a.status)
  );

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

  // Mirrors the backend's is_in_future check (appointment date + end_time
  // vs now) so the mark-completed/no-show buttons only appear once a slot
  // has actually passed — the API is still the source of truth and will
  // reject the call anyway if the clocks disagree.
  function hasPassed(appointment) {
    const endsAt = new Date(`${appointment.date}T${appointment.end_time}`);
    return endsAt <= new Date();
  }

  async function markStatus(appointmentId, status) {
    setError('');
    setMessage('');
    setUpdatingId(appointmentId);

    try {
      await api.post(`/api/appointments/${appointmentId}/status/`, {
        status,
        notes: notesDrafts[appointmentId] || '',
      });

      const statusMessage = {
        confirmed: 'Appointment confirmed.',
        checked_in: 'Patient checked in.',
        in_progress: 'Consultation started.',
        completed: 'Marked as completed.',
        no_show: 'Marked as no-show.',
      }[status] || 'Appointment updated.';

      setMessage(statusMessage);
      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not update this appointment.'));
    } finally {
      setUpdatingId(null);
    }
  }

  function getDoctorActions(appointment) {
    if (appointment.status === 'confirmed') {
      return [
        { status: 'checked_in', label: 'Check in' },
        { status: 'in_progress', label: 'Start consultation' },
      ];
    }

    if (appointment.status === 'checked_in') {
      return [{ status: 'in_progress', label: 'Start consultation' }];
    }

    if (appointment.status === 'in_progress') {
      return [
        ...(hasPassed(appointment) ? [{ status: 'completed', label: 'Mark completed' }] : []),
        ...(hasPassed(appointment) ? [{ status: 'no_show', label: 'Mark no-show' }] : []),
      ];
    }

    return [];
  }

  async function submitPrescription(appointmentId) {
    setError('');
    setMessage('');
    setPrescribingId(appointmentId);

    try {
      const draft = prescriptionDrafts[appointmentId] || {};
      const medicationLines = (draft.medications || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const medications = medicationLines.map((line) => {
        const parts = line.split('|').map((item) => item.trim());
        const [name, dosage, frequency, duration, instructions] = parts;

        return {
          name: name || '',
          dosage: dosage || '',
          frequency: frequency || '',
          duration: duration || '',
          instructions: instructions || '',
        };
      }).filter((item) => item.name || item.dosage || item.frequency);

      await api.post(`/api/appointments/${appointmentId}/prescription/`, {
        diagnosis: draft.diagnosis || '',
        notes: draft.notes || '',
        medications,
      });

      setMessage('Prescription saved successfully.');
      setExpandedId(null);
      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save prescription.'));
    } finally {
      setPrescribingId(null);
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
        ) : visibleAppointments.length ? (
          visibleAppointments.map((appointment) => {
            const doctorActions = user.role === 'doctor' ? getDoctorActions(appointment) : [];
            const canPrescribe = user.role === 'doctor' && ['checked_in', 'in_progress', 'completed'].includes(appointment.status);
            const isExpanded = expandedId === appointment.id;

            return (
              <article key={appointment.id} className="card flex flex-col gap-3">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">
                        {user.role === 'doctor' ? appointment.patient_name : appointment.doctor_name}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {appointment.date} • {appointment.start_time} – {appointment.end_time}
                      {appointment.reason && <> • {appointment.reason}</>}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
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
                    {canPrescribe && (
                      <button
                        className="btn-secondary"
                        onClick={() => setExpandedId(isExpanded ? null : appointment.id)}
                      >
                        {appointment.prescription ? 'View/edit prescription' : 'Add prescription'}
                      </button>
                    )}
                  </div>
                </div>

                {doctorActions.length > 0 && (
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 md:flex-row md:items-center">
                    <input
                      type="text"
                      placeholder="Visit notes (optional)"
                      className="field flex-1"
                      value={notesDrafts[appointment.id] || ''}
                      onChange={(e) => setNotesDrafts((prev) => ({ ...prev, [appointment.id]: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-2">
                      {doctorActions.map((action) => (
                        <button
                          key={action.status}
                          className={action.status === 'completed' ? 'btn-primary' : 'btn-secondary'}
                          disabled={updatingId === appointment.id}
                          onClick={() => markStatus(appointment.id, action.status)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Everything below is hidden until the doctor explicitly asks
                    for it — this is the "click for details" behavior instead
                    of dumping notes/prescription text into every card. */}
                {isExpanded && canPrescribe && (
                  <div className="border-t border-slate-100 pt-3">
                    {appointment.notes && (
                      <p className="mb-3 text-sm text-slate-600">Visit notes: {appointment.notes}</p>
                    )}
                    {appointment.prescription && (
                      <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        <p className="font-semibold">Current prescription</p>
                        <p className="mt-1">Diagnosis: {appointment.prescription.diagnosis || 'Not recorded'}</p>
                        {appointment.prescription.notes && <p>Notes: {appointment.prescription.notes}</p>}
                        {appointment.prescription.medications?.length > 0 && (
                          <ul className="mt-2 list-disc pl-5">
                            {appointment.prescription.medications.map((med, idx) => (
                              <li key={idx}>{med.name} {med.dosage} • {med.frequency} • {med.duration}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <p className="mb-2 font-medium text-slate-700">
                      {appointment.prescription ? 'Update prescription' : 'Write prescription'}
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        type="text"
                        className="field"
                        placeholder="Diagnosis"
                        value={prescriptionDrafts[appointment.id]?.diagnosis || ''}
                        onChange={(e) => setPrescriptionDrafts((prev) => ({
                          ...prev,
                          [appointment.id]: { ...(prev[appointment.id] || {}), diagnosis: e.target.value },
                        }))}
                      />
                      <textarea
                        className="field md:col-span-2"
                        rows="3"
                        placeholder="Clinical notes / advice"
                        value={prescriptionDrafts[appointment.id]?.notes || ''}
                        onChange={(e) => setPrescriptionDrafts((prev) => ({
                          ...prev,
                          [appointment.id]: { ...(prev[appointment.id] || {}), notes: e.target.value },
                        }))}
                      />
                      <textarea
                        className="field md:col-span-2"
                        rows="3"
                        placeholder="Medication list: name | dosage | frequency | duration | instructions (one per line)"
                        value={prescriptionDrafts[appointment.id]?.medications || ''}
                        onChange={(e) => setPrescriptionDrafts((prev) => ({
                          ...prev,
                          [appointment.id]: { ...(prev[appointment.id] || {}), medications: e.target.value },
                        }))}
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        className="btn-primary"
                        disabled={prescribingId === appointment.id}
                        onClick={() => submitPrescription(appointment.id)}
                      >
                        {prescribingId === appointment.id ? 'Saving...' : 'Save prescription'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="card text-center text-slate-600">No appointments yet.</div>
        )}
      </div>
    </>
  );
}