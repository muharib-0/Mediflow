import React, { useState } from 'react';
import { ChevronRight, Activity } from 'lucide-react';
// 1. Import useNavigate
import { useNavigate } from 'react-router-dom'; 
import { api } from '../../api/client';
export default function ProfileSetup() {
  const [formData, setFormData] = useState({
    date_of_birth: '',
    blood_type: 'Unknown',
    allergies: '',
    chronic_conditions: '',
    family_history: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 2. Initialize the navigate function
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      allergies: formData.allergies.split(',').map(item => item.trim()).filter(Boolean),
      chronic_conditions: formData.chronic_conditions.split(',').map(item => item.trim()).filter(Boolean),
    };

    try {
      // Using your new Axios api instance here!
      const response = await api.post('/api/patients/profile/', payload);

      // 3. Redirect the user to the dashboard route
      navigate('/dashboard'); 
      
    } catch (err) {
      // Axios stores the backend error message in err.response.data
      setError('Failed to save profile. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  // ... (The rest of your return() JSX stays exactly the same)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 w-full max-w-2xl">
        <div className="flex items-center gap-2 text-blue-600 mb-6">
          <Activity size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Medical Profile</h2>
        </div>
        
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input 
                type="date" 
                name="date_of_birth"
                required 
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
              <select 
                name="blood_type"
                value={formData.blood_type}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Unknown">Unknown</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Known Allergies</label>
            <input 
              type="text" 
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="e.g. Peanuts, Penicillin (Comma separated)" 
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chronic Conditions</label>
            <input 
              type="text" 
              name="chronic_conditions"
              value={formData.chronic_conditions}
              onChange={handleChange}
              placeholder="e.g. Asthma, Type 2 Diabetes (Comma separated)" 
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Family Medical History</label>
            <textarea 
              name="family_history"
              value={formData.family_history}
              onChange={handleChange}
              placeholder="Briefly describe any major conditions in your immediate family..."
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              rows="3"
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-70 transition-colors"
          >
            {loading ? 'Saving...' : 'Save & Go to Dashboard'} <ChevronRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}