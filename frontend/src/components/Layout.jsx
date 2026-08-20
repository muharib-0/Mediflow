import { Activity, Bot, LogOut, Search, Stethoscope } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CalendarStatus from './CalendarStatus';

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f0f9ff_0%,#f8fafc_24%,#f8fafc_100%)]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-sky-700">
            <Activity size={22} />
            Mediflow
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {user?.role !== 'doctor' && (
              <NavLink to="/doctors" className={navLinkClass}>
                <Search size={16} />
                Doctors
              </NavLink>
            )}
            {!user && (
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
            )}
            {user && (
              <NavLink to={user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} className={navLinkClass}>
                <Stethoscope size={16} />
                {user.role === 'doctor' ? 'Workspace' : 'My Profile'}
              </NavLink>
            )}
            {user?.role === 'patient' && (
              <NavLink to="/symptom-checker" className={navLinkClass}>
                <Bot size={16} />
                Symptom Checker
              </NavLink>
            )}
            {/* {user?.role === 'patient' && (
              <NavLink to="/profile/setup" className={navLinkClass}>
                Profile Setup
              </NavLink>
            )} */}
            {user && (
              <NavLink to="/appointments" className={navLinkClass}>
                Appointments
              </NavLink>
            )}
            {user?.role === 'doctor' && (
              <>
                <NavLink to="/appointments" className={navLinkClass}>
                  Patient History
                </NavLink>
                <NavLink to="/doctor/availability" className={navLinkClass}>
                  Availability
                </NavLink>
              </>
            )}
            {!user ? (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <Link to="/register" className="btn-primary rounded-xl">
                  Register
                </Link>
              </>
            ) : (
              <>
                <CalendarStatus />
                <button onClick={handleLogout} className="btn-secondary inline-flex items-center gap-2 rounded-xl">
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
