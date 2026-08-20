import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DoctorDirectoryRoute from './components/DoctorDirectoryRoute';
import ProtectedRoute from './components/ProtectedRoute';
import AppointmentList from './pages/AppointmentList';
import DoctorAvailability from './pages/Doctor_pages/DoctorAvailability';
import DoctorDetail from './pages/Doctor_pages/DoctorDetail';
import DoctorDashboard from './pages/Doctor_pages/DoctorDashboard';
import DoctorList from './pages/Doctor_pages/DoctorList';
import PatientDetail from './pages/Doctor_pages/PatientDetail';
import PatientHistory from './pages/Doctor_pages/PatientHistory';
import Home from './pages/Home';
import Login from './pages/Login';
import PatientDashboard from './pages/patients_pages/PatientDashboard';
import ProfileSetup from './pages/patients_pages/ProfileSetup';
import Register from './pages/Register';
import SymptomChecker from './pages/SymptomChecker';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<DoctorDirectoryRoute><DoctorList /></DoctorDirectoryRoute>} />
        <Route path="/doctors/:id" element={<DoctorDirectoryRoute><DoctorDetail /></DoctorDirectoryRoute>} />
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
          path="/doctor/setup"
          element={
            <ProtectedRoute role="doctor" setupOnly>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute role="doctor" redirectIncompleteDoctor>
              <DoctorDashboard />
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
        <Route
          path="/doctor/patient-history"
          element={<ProtectedRoute role="doctor"><PatientHistory /></ProtectedRoute>}
        />
        <Route
          path="/doctor/appointments/:appointmentId/patient"
          element={<ProtectedRoute role="doctor"><PatientDetail /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
