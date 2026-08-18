import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Alert from '../../components/Alert';
import DoctorCard from '../../components/DoctorCard';
import PageHeader from '../../components/PageHeader';
import { getErrorMessage, unwrapResults } from '../../utils/errors';

const specializations = [
  ['', 'All specializations'],
  ['general', 'General Physician'],
  ['cardiology', 'Cardiology'],
  ['dermatology', 'Dermatology'],
  ['neurology', 'Neurology'],
  ['orthopedics', 'Orthopedics'],
  ['pediatrics', 'Pediatrics'],
  ['psychiatry', 'Psychiatry'],
  ['gynecology', 'Gynecology'],
  ['ophthalmology', 'Ophthalmology'],
  ['ent', 'ENT'],
  ['dentistry', 'Dentistry'],
  ['other', 'Other'],
];

export default function DoctorList() {
  const [doctors, setDoctors] = useState([]);
  const [filters, setFilters] = useState({ search: '', specialization: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadDoctors() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/api/doctors/', {
          params: filters,
          signal: controller.signal,
        });
        setDoctors(unwrapResults(data));
      } catch (err) {
        if (err.name !== 'CanceledError') {
          setError(getErrorMessage(err, 'Could not load doctors.'));
        }
      } finally {
        setLoading(false);
      }
    }

    loadDoctors();
    return () => controller.abort();
  }, [filters]);

  return (
    <>
      <PageHeader title="Find doctors" subtitle="Search by name, qualification, or specialization." />

      <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_240px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="field pl-10"
              placeholder="Search by doctor name, qualification, or specialty..."
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
            />
          </label>
        <select
          className="field"
          value={filters.specialization}
          onChange={(event) => setFilters({ ...filters, specialization: event.target.value })}
        >
          {specializations.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        </div>
      </div>

      <Alert type="error">{error}</Alert>
      {loading ? (
        <p className="text-slate-600">Loading doctors...</p>
      ) : doctors.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="card text-center text-slate-600">No doctors match your filters yet.</div>
      )}
    </>
  );
}
