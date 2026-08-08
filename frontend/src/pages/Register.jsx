import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

const initialForm = {
  email: '',
  username: '',
  first_name: '',
  last_name: '',
  role: 'patient',
  phone_number: '',
  password: '',
  password_confirm: '',
};

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      username: field === 'email' && !current.username ? value : current.username,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await register(form);
      setSuccess('Registration successful. You can log in now.');
      setTimeout(() => navigate('/login'), 700);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="card">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">Choose your role so the app can route you correctly.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Alert type="error">{error}</Alert>
          <Alert type="success">{success}</Alert>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">First name</span>
              <input className="field" value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Last name</span>
              <input className="field" value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} required />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email</span>
              <input className="field" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Username</span>
              <input className="field" value={form.username} onChange={(e) => updateField('username', e.target.value)} required />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Phone number</span>
            <input className="field" value={form.phone_number} onChange={(e) => updateField('phone_number', e.target.value)} />
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium">I am a</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {['patient', 'doctor'].map((role) => (
                <label key={role} className={`rounded-xl border p-4 ${form.role === role ? 'border-brand-500 bg-brand-50' : 'border-slate-200'}`}>
                  <input className="mr-2" type="radio" checked={form.role === role} onChange={() => updateField('role', role)} />
                  <span className="capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Password</span>
              <input className="field" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Confirm password</span>
              <input className="field" type="password" value={form.password_confirm} onChange={(e) => updateField('password_confirm', e.target.value)} required />
            </label>
          </div>

          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
