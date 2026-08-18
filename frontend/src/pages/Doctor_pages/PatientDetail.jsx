import { AlertCircle, Droplets, HeartPulse, Phone, UserRound } from 'lucide-react';
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
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/appointments/${appointmentId}/patient/`)
      .then(({ data }) => setPatient(data))
      .catch((err) => setError(getErrorMessage(err, 'Could not load this patient’s details.')));
  }, [appointmentId]);

  if (error) return <Alert type="error">{error}</Alert>;
  if (!patient) return <p className="text-slate-600">Loading patient details...</p>;

  return (
    <>
      <PageHeader title={patient.patient_name || 'Patient details'} subtitle="Medical information shared for this appointment." />
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
    </>
  );
}
