import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function fallbackFor(user) {
  return user?.role === 'doctor'
    ? (user.has_profile ? '/doctor/dashboard' : '/doctor/setup')
    : '/dashboard';
}

export default function ProtectedRoute({ children, role, redirectIncompleteDoctor = false, setupOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="text-slate-600">Checking your session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to={fallbackFor(user)} replace />;
  }

  if (redirectIncompleteDoctor && user.role === 'doctor' && !user.has_profile) {
    return <Navigate to="/doctor/setup" replace />;
  }

  if (setupOnly && user.role === 'doctor' && user.has_profile) {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  return children;
}
