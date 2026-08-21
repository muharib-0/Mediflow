import { CalendarDays, Clock3, Eye, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import Alert from '../../components/Alert';
import PageHeader from '../../components/PageHeader';
import { getErrorMessage, unwrapResults } from '../../utils/errors';

const statusOptions = [
  ['all', 'All statuses'],
  ['confirmed', 'Confirmed'],
  ['checked_in', 'Checked in'],
  ['in_progress', 'In progress'],
  ['completed', 'Completed'],
];

export default function PatientHistory() {
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = useState({ patient: '', status: 'all', date_from: '', date_to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.patient.trim()) params.set('patient', filters.patient.trim());
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);

    setLoading(true);
    setError('');
    api.get(`/api/appointments/patient-history/?${params.toString()}`)
      .then(({ data }) => setHistory(unwrapResults(data)))
      .catch((err) => setError(getErrorMessage(err, 'Could not load patient history.')))
      .finally(() => setLoading(false));
  }, [filters]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <>
      <PageHeader
        title="Patient history"
        subtitle="Review consultation records for patients seen by you."
      />

      <section className="card mb-6">
        <div className="mb-4 flex items-center gap-2">
          <Search size={18} className="text-slate-500" />
          <h2 className="font-semibold text-slate-800">Find a consultation</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            name="patient"
            className="field md:col-span-2"
            placeholder="Patient name or email"
            value={filters.patient}
            onChange={updateFilter}
          />
          <select name="status" className="field" value={filters.status} onChange={updateFilter}>
            {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2 md:col-span-4">
            <label className="text-xs font-semibold text-slate-500">
              From
              <input type="date" name="date_from" className="field mt-1" value={filters.date_from} onChange={updateFilter} />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              To
              <input type="date" name="date_to" className="field mt-1" value={filters.date_to} onChange={updateFilter} />
            </label>
          </div>
        </div>
      </section>

      <Alert type="error">{error}</Alert>

      {loading ? (
        <p className="text-slate-600">Loading patient history...</p>
      ) : history.length === 0 ? (
        <div className="card text-center text-slate-600">No patient history matches these filters.</div>
      ) : (
        <section className="space-y-3">
          {history.map((visit) => (
            <article key={visit.id} className="card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800">{visit.patient_name || 'Unnamed patient'}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                      {visit.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={15} /> {visit.date}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 size={15} /> {visit.start_time} - {visit.end_time}</span>
                  </div>
                </div>
                <Link className="btn-secondary inline-flex items-center justify-center gap-2" to={`/doctor/appointments/${visit.id}/patient`}>
                  <Eye size={16} />
                  View details
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </>
  );
}