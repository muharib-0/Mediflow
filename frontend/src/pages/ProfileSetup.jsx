import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

const doctorSpecializations = [
  { value: 'general', label: 'General Physician' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'ent', label: 'ENT (Ear, Nose, Throat)' },
  { value: 'dentistry', label: 'Dentistry' },
  { value: 'other', label: 'Other' },
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const defaultDoctorForm = {
  specialization: 'general',
  qualification: '',
  experience_years: 0,
  bio: '',
  consultation_fee: '500.00',
  is_available: true,
};

const defaultPatientForm = {
  date_of_birth: '',
  blood_group: '',
  address: '',
  emergency_contact: '',
  emergency_contact_name: '',
  medical_history: '',
  allergies: '',
};

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(user?.role === 'doctor' ? defaultDoctorForm : defaultPatientForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      setLoading(true);
      setError('');

      try {
        const endpoint = user.role === 'doctor' ? '/api/doctors/me/profile/' : '/api/patients/me/profile/';
        const { data } = await api.get(endpoint);
        setForm(user.role === 'doctor' ? { ...defaultDoctorForm, ...data } : { ...defaultPatientForm, ...data });
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load your profile.'));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = user.role === 'doctor' ? '/api/doctors/me/profile/' : '/api/patients/me/profile/';
      await api.patch(endpoint, form);
      setSuccess('Profile saved successfully.');
      navigate(user.role === 'doctor' ? '/doctor/availability' : '/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save your profile.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-slate-600">Loading your profile...</p>;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Complete your profile</h1>
        <p className="mt-2 text-slate-600">
          {user?.role === 'doctor'
            ? 'Set up your doctor profile before publishing availability.'
            : 'Finish your medical profile before using the dashboard and doctor search.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Alert type="error">{error}</Alert>
          <Alert type="success">{success}</Alert>

          {user?.role === 'doctor' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Specialization</span>
                  <select
                    className="field"
                    value={form.specialization}
                    onChange={(event) => updateField('specialization', event.target.value)}
                  >
                    {doctorSpecializations.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Qualification</span>
                  <input
                    className="field"
                    value={form.qualification}
                    onChange={(event) => updateField('qualification', event.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Experience in years</span>
                  <input
                    className="field"
                    type="number"
                    min="0"
                    value={form.experience_years}
                    onChange={(event) => updateField('experience_years', Number(event.target.value))}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Consultation fee</span>
                  <input
                    className="field"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.consultation_fee}
                    onChange={(event) => updateField('consultation_fee', event.target.value)}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Bio</span>
                <textarea
                  className="field min-h-32"
                  value={form.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                />
              </label>

              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(event) => updateField('is_available', event.target.checked)}
                />
                Available for patient bookings
              </label>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Date of birth</span>
                  <input
                    className="field"
                    type="date"
                    value={form.date_of_birth || ''}
                    onChange={(event) => updateField('date_of_birth', event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Blood group</span>
                  <select
                    className="field"
                    value={form.blood_group || ''}
                    onChange={(event) => updateField('blood_group', event.target.value)}
                  >
                    <option value="">Select blood group</option>
                    {bloodGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Address</span>
                <textarea
                  className="field min-h-24"
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Emergency contact name</span>
                  <input
                    className="field"
                    value={form.emergency_contact_name}
                    onChange={(event) => updateField('emergency_contact_name', event.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Emergency contact number</span>
                  <input
                    className="field"
                    value={form.emergency_contact}
                    onChange={(event) => updateField('emergency_contact', event.target.value)}
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Medical history</span>
                <textarea
                  className="field min-h-24"
                  value={form.medical_history}
                  onChange={(event) => updateField('medical_history', event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Allergies</span>
                <textarea
                  className="field min-h-24"
                  value={form.allergies}
                  onChange={(event) => updateField('allergies', event.target.value)}
                />
              </label>
            </>
          )}

          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Saving profile...' : 'Save and continue'}
          </button>
        </form>
      </div>
    </section>
  );
}
