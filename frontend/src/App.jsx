import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AppointmentList from './pages/AppointmentList';
import DoctorAvailability from './pages/DoctorAvailability';
import DoctorDetail from './pages/DoctorDetail';
import DoctorList from './pages/DoctorList';
import Home from './pages/Home';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import ProfileSetup from './pages/ProfileSetup';
import Register from './pages/Register';
import SymptomChecker from './pages/SymptomChecker';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<DoctorList />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/symptom-checker"
          element={
            <ProtectedRoute role="patient">
              <SymptomChecker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <AppointmentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/availability"
          element={
            <ProtectedRoute role="doctor">
              <DoctorAvailability />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
