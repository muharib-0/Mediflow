import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const user = await login(form);
      const requestedPath = location.state?.from?.pathname;
      const destination = requestedPath === '/profile/setup' ? requestedPath : '/profile/setup';
      navigate(destination, { replace: true, state: { from: location.state?.from, loggedInRole: user.role } });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not log in. Check your email and password.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md">
      <div className="card">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Log in with your Mediflow account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Alert type="error">{error}</Alert>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Password</span>
            <input
              className="field"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          <button className="btn-primary w-full" disabled={submitting}>
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          New here?{' '}
          <Link to="/register" className="font-semibold text-brand-700">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
