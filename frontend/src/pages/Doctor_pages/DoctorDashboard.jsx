import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, Calendar, Clock, Edit, X, Save, 
  Users, CheckCircle, XCircle, Award 
} from 'lucide-react';
import { api } from '../../api/client'; 
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DoctorDashboard() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for toggling edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const location = useLocation();
  const { user, loadUser } = useAuth();
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      // Fetch both endpoints concurrently using your existing views
      const [profileRes, statsRes] = await Promise.all([
        api.get('/api/doctors/me/profile/'),
        api.get('/api/doctors/dashboard/')
      ]);
      
      setProfile(profileRes.data);
      setStats(statsRes.data);
      
      // Pre-fill the edit form with your exact serializer fields
      setEditFormData({
        specialization: profileRes.data.specialization || 'general',
        qualification: profileRes.data.qualification || '',
        experience_years: profileRes.data.experience_years || 0,
        consultation_fee: profileRes.data.consultation_fee || 0,
        bio: profileRes.data.bio || '',
        is_available: profileRes.data.is_available ?? true,
      });
    } catch (err) {
      setError('Failed to load doctor dashboard.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const refreshTimer = window.setInterval(fetchDashboardData, 15000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  // Only auto-open the edit form once: either when explicitly visiting
  // `/doctor/setup` or when the logged-in doctor does not have a profile
  // yet. Use a ref to avoid re-opening when navigating back and forth.
  const _autoOpened = useRef(false);

  useEffect(() => {
    if (!user) return;

    if (location.pathname === '/doctor/setup') {
      setIsEditing(true);
      _autoOpened.current = true;
      return;
    }

    if (!_autoOpened.current && user.has_profile === false) {
      setIsEditing(true);
      _autoOpened.current = true;
    }
  }, [user, location.pathname]);

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({ 
      ...editFormData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      // Your backend uses RetrieveUpdateAPIView, so PATCH is best here
      await api.patch('/api/doctors/me/profile/', editFormData);
      
      setIsEditing(false);
      await loadUser();
      fetchDashboardData(); // Refresh to show saved changes
      if (location.pathname === '/doctor/setup') {
        navigate('/doctor/dashboard', { replace: true });
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile. Check console.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading Doctor Portal...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">{error}</div>;
  if (!profile || !stats) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- 1. Professional Profile Section --- */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-6 right-6 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            {isEditing ? <><X size={16}/> Cancel</> : <><Edit size={16}/> Edit Profile</>}
          </button>

          <div className="flex items-start gap-6">
            <div className="h-24 w-24 bg-blue-900 text-white rounded-full flex items-center justify-center shrink-0">
              <Stethoscope size={40} />
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.full_name || `Dr. ${profile.first_name} ${profile.last_name}`}
                </h1>
                {profile.is_available ? (
                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                    <CheckCircle size={12} /> Accepting Patients
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                    <XCircle size={12} /> Unavailable
                  </span>
                )}
              </div>
              <p className="text-gray-500 mb-6 capitalize">{profile.specialization.replace('_', ' ')} | {profile.email}</p>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="bg-gray-50 p-5 rounded-lg space-y-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Specialization</label>
                      <select name="specialization" value={editFormData.specialization} onChange={handleEditChange} className="w-full p-2 mt-1 border rounded bg-white">
                        <option value="general">General Physician</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="dermatology">Dermatology</option>
                        <option value="neurology">Neurology</option>
                        <option value="orthopedics">Orthopedics</option>
                        {/* Add remaining choices from your model here */}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Qualification</label>
                      <input type="text" name="qualification" value={editFormData.qualification} onChange={handleEditChange} required className="w-full p-2 mt-1 border rounded" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Experience (Years)</label>
                      <input type="number" name="experience_years" value={editFormData.experience_years} onChange={handleEditChange} min="0" className="w-full p-2 mt-1 border rounded" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Consultation Fee</label>
                      <input type="number" step="0.01" name="consultation_fee" value={editFormData.consultation_fee} onChange={handleEditChange} min="0" className="w-full p-2 mt-1 border rounded" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Bio</label>
                    <textarea name="bio" value={editFormData.bio} onChange={handleEditChange} rows="3" className="w-full p-2 mt-1 border rounded"></textarea>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" id="is_available" name="is_available" checked={editFormData.is_available} onChange={handleEditChange} className="h-4 w-4 text-blue-600 rounded" />
                    <label htmlFor="is_available" className="text-sm text-gray-700 font-medium">I am currently available for new appointments</label>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                    <button type="submit" className="flex items-center gap-2 bg-blue-900 text-white px-5 py-2 rounded font-medium hover:bg-blue-800">
                      <Save size={16}/> Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-lg border border-gray-100">
                  <div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-1"><Award size={14}/> Qualification</div>
                    <p className="font-medium">{profile.qualification || "Not specified"}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-1"><Clock size={14}/> Experience</div>
                    <p className="font-medium">{profile.experience_years} Years</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-1"><Users size={14}/> Consult Fee</div>
                    <p className="font-medium text-green-600">₹{profile.consultation_fee}</p>
                  </div>
                  <div className="col-span-2 md:col-span-4 mt-2">
                    <p className="text-sm text-gray-500 mb-1">Bio</p>
                    <p className="text-sm text-gray-700">{profile.bio || "No bio provided."}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --- 2. Operational Stats Widgets (Powered by your backend) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24}/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_patients}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Calendar size={24}/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Available Slots (From Today)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.available_slots}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Stethoscope size={24}/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Slots Created</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_slots}</p>
            </div>
          </div>
        </div>

        {/* --- 3. Upcoming Appointments Section --- */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-blue-900">
              <Calendar size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            {stats.upcoming_appointments && stats.upcoming_appointments.length > 0 ? (
              stats.upcoming_appointments.map((apt) => (
                <div key={apt.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    {/* Accessing nested patient data depends on your AppointmentSerializer shape */}
                    <p className="font-semibold text-gray-900">Appointment ID: {apt.id}</p>
                    <p className="text-sm text-gray-600">Status: {apt.status}</p>
                  </div>
                  <div className="text-right">
                    <button className="text-sm text-blue-600 font-medium hover:underline">View Details</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50">
                <p>No upcoming appointments found.</p>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-blue-900">
              <Calendar size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Booked Slots</h2>
            </div>
            <span className="text-xs text-gray-500">Updates every 15 seconds</span>
          </div>
          <p className="mb-5 text-sm text-gray-500">Upcoming confirmed appointments.</p>
          {stats.booked_slots?.length ? (
            <div className="space-y-3">
              {stats.booked_slots.map((appointment) => (
                <div key={appointment.id} className="flex flex-col justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{appointment.patient_name}</p>
                    <p className="text-sm text-gray-600">{appointment.date} · {appointment.start_time} – {appointment.end_time}</p>
                    {appointment.reason && <p className="mt-1 text-sm text-gray-600">Reason: {appointment.reason}</p>}
                  </div>
                  <Link className="text-sm font-medium text-blue-600 hover:underline" to={`/doctor/appointments/${appointment.id}/patient`}>
                    View patient details
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border-2 border-dashed border-gray-200 p-5 text-center text-gray-400">No booked slots yet.</p>
          )}
        </section>

      </div>
    </div>
  );
}
