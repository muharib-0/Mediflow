import { AlertCircle, Clock3, Droplets, HeartPulse, Phone, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../api/client';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import { getErrorMessage } from '../../utils/errors';

function ValueList({ values, empty = 'None reported' }) {
  return values?.length ? <p>{values.join(', ')}</p> : <p className="text-slate-500">{empty}</p>;
}

export default function PatientDetail() {
  const { appointmentId } = useParams();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/api/appointments/${appointmentId}/patient/`),
      api.get(`/api/appointments/${appointmentId}/history/`),
    ])
      .then(([patientResponse, historyResponse]) => {
        setPatient(patientResponse.data);
        setHistory(historyResponse.data.history || []);
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'Could not load this patient’s details.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [appointmentId]);

  if (error) return <Alert type="error">{error}</Alert>;
  if (loading || !patient) return <p className="text-slate-600">Loading patient details...</p>;

  return (
    <>
      <PageHeader title={patient.patient_name || 'Patient details'} subtitle="Medical information and previous consultations for this patient." />

      <section className="card">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><UserRound size={16} /> Name</p><p className="mt-1 font-semibold">{patient.patient_name}</p></div>
          <div><p className="text-sm font-semibold text-slate-500">Age</p><p className="mt-1 font-semibold">{patient.age ?? 'Not provided'}</p></div>
          <div><p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Phone size={16} /> Contact</p><p className="mt-1">{patient.phone_number || patient.email}</p></div>
          <div><p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><Droplets size={16} /> Blood group</p><p className="mt-1 font-semibold">{patient.blood_type}</p></div>
          <div className="sm:col-span-2"><p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><AlertCircle size={16} /> Allergies</p><div className="mt-1"><ValueList values={patient.allergies} /></div></div>
          <div className="sm:col-span-2"><p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><HeartPulse size={16} /> Chronic conditions</p><div className="mt-1"><ValueList values={patient.chronic_conditions} /></div></div>
          <div className="sm:col-span-2"><p className="text-sm font-semibold text-slate-500">Family history</p><p className="mt-1 whitespace-pre-line">{patient.family_history || 'None reported'}</p></div>
        </div>
      </section>

      <section className="card mt-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 size={18} className="text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">Consultation history</h2>
        </div>

        {history.length === 0 ? (
          <p className="text-slate-600">No previous consultations recorded for this patient yet.</p>
        ) : (
          <div className="space-y-4">
            {history.map((visit) => (
              <div key={visit.appointment_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 pb-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{visit.date} • {visit.start_time} - {visit.end_time}</p>
                    <p className="text-sm text-slate-600">{visit.reason || 'Consultation visit'}</p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium capitalize text-slate-700">
                    {visit.status.replace('_', ' ')}
                  </span>
                </div>

                {visit.notes && <p className="mt-2 text-sm text-slate-700">Visit notes: {visit.notes}</p>}

                {visit.diagnosis && <p className="mt-3 text-sm"><span className="font-semibold text-slate-700">Diagnosis:</span> {visit.diagnosis}</p>}

                {visit.prescription?.notes && (
                  <p className="mt-2 text-sm text-slate-700">Prescription notes: {visit.prescription.notes}</p>
                )}

                {visit.prescription?.medications?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-slate-700">Medications</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {visit.prescription.medications.map((med, idx) => (
                        <li key={`${visit.appointment_id}-${idx}`}>
                          {med.name} {med.dosage ? `• ${med.dosage}` : ''}
                          {med.frequency ? ` • ${med.frequency}` : ''}
                          {med.duration ? ` • ${med.duration}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
