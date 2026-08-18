import React, { useState, useEffect } from 'react';
import { User, Activity, Pill, ClipboardList, Edit, X, Save } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../../api/client'; 

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Helper function to calculate age from Date of Birth
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/patients/dashboard/');
      setData(response.data);
      
      setEditFormData({
        date_of_birth: response.data.date_of_birth || '',
        blood_type: response.data.blood_type || 'Unknown',
        allergies: response.data.allergies.join(', '),
        chronic_conditions: response.data.chronic_conditions.join(', '),
        family_history: response.data.family_history || ''
      });
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editFormData,
        allergies: editFormData.allergies.split(',').map(item => item.trim()).filter(Boolean),
        chronic_conditions: editFormData.chronic_conditions.split(',').map(item => item.trim()).filter(Boolean),
      };
      
      await api.post('/api/patient/profile/', payload);
      setIsEditing(false);
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- 1. Header & Profile Section --- */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-6 right-6 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            {isEditing ? <><X size={16}/> Cancel</> : <><Edit size={16}/> Edit Profile</>}
          </button>

          <div className="flex items-start gap-6">
            <div className="h-24 w-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
              <User size={40} />
            </div>
            
            <div className="flex-1 w-full">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {data.user_info.first_name} {data.user_info.last_name}
              </h1>
              <p className="text-gray-500 mb-6">{data.user_info.email} | {data.user_info.phone_number}</p>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="bg-gray-50 p-4 rounded-lg space-y-4 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Date of Birth</label>
                      <input type="date" name="date_of_birth" value={editFormData.date_of_birth} onChange={handleEditChange} className="w-full p-2 mt-1 border rounded" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Blood Type</label>
                      <select name="blood_type" value={editFormData.blood_type} onChange={handleEditChange} className="w-full p-2 mt-1 border rounded bg-white">
                        <option value="A+">A+</option><option value="O+">O+</option><option value="B-">B-</option><option value="Unknown">Unknown</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Allergies (comma separated)</label>
                      <input type="text" name="allergies" value={editFormData.allergies} onChange={handleEditChange} className="w-full p-2 mt-1 border rounded" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase">Conditions (comma separated)</label>
                      <input type="text" name="chronic_conditions" value={editFormData.chronic_conditions} onChange={handleEditChange} className="w-full p-2 mt-1 border rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">Family History</label>
                      <textarea name="family_history" value={editFormData.family_history} onChange={handleEditChange} rows="2" className="w-full p-2 mt-1 border rounded"></textarea>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
                      <Save size={16}/> Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div><p className="text-sm text-gray-500">Age</p><p className="font-medium">{calculateAge(data.date_of_birth)} yrs</p></div>
                  <div><p className="text-sm text-gray-500">DOB</p><p className="font-medium">{data.date_of_birth}</p></div>
                  <div><p className="text-sm text-gray-500">Blood Type</p><p className="font-medium text-red-600">{data.blood_type}</p></div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Allergies</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.allergies.length > 0 ? data.allergies.map((allergy, i) => (
                        <span key={i} className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">{allergy}</span>
                      )) : <span className="text-sm text-gray-500">None reported</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* --- 2. Medical Data & Metrics Dashboard --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: History & Medications */}
          <div className="lg:col-span-1 space-y-6">
            
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <ClipboardList size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Medical History</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Chronic Conditions</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {data.chronic_conditions.length > 0 
                      ? data.chronic_conditions.map((cond, i) => <li key={i}>{cond}</li>)
                      : <li>None reported</li>}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Family History</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {data.family_history || "No family medical history provided."}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4 text-blue-600">
                <Pill size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Active Prescriptions</h2>
              </div>
              <div className="space-y-3">
                {data.active_medications && data.active_medications.length > 0 ? (
                  data.active_medications.map((med) => (
                    <div key={med.id} className="p-3 border-l-4 border-blue-500 bg-blue-50/50 rounded-r-lg">
                      <p className="font-semibold text-gray-900">{med.name} {med.dosage}</p>
                      <p className="text-sm text-gray-600 mt-1">{med.frequency}</p>
                      <p className="text-xs text-gray-400 mt-2">Dr. {med.prescribed_by}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Pill size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active prescriptions</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Metrics Chart */}
          <div className="lg:col-span-2">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-blue-600">
                  <Activity size={20} />
                  <h2 className="text-lg font-semibold text-gray-900">Weight Tracking</h2>
                </div>
                <button className="text-sm text-blue-600 font-medium hover:underline">+ Log Weight</button>
              </div>
              
              {data.recent_metrics && data.recent_metrics.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.recent_metrics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line yAxisId="left" type="monotone" dataKey="weight_lbs" stroke="#2563eb" strokeWidth={2} name="Weight" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400 bg-gray-50">
                  <Activity size={32} className="mb-2 text-gray-300" />
                  <p>No health metrics logged yet.</p>
                </div>
              )}
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}