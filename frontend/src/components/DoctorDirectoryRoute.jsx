import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Keeps the patient-facing doctor directory out of the doctor workspace. */
export default function DoctorDirectoryRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-slate-600">Checking your session...</p>;
  if (user?.role === 'doctor') {
    return <Navigate to={user.has_profile ? '/doctor/dashboard' : '/doctor/setup'} replace />;
  }
  return children;
}
