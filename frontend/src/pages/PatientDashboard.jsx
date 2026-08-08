import { Activity, ClipboardList, User } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

const mockHealthMetrics = [
  { date: 'May', weight: 165, bmi: 28.3 },
  { date: 'Jun', weight: 163, bmi: 27.9 },
  { date: 'Jul', weight: 161, bmi: 27.6 },
];

const careNotes = [
  {
    title: 'Lisinopril 10mg',
    detail: 'Take once daily. Prescribed by Dr. Smith.',
    accent: 'border-sky-500',
  },
  {
    title: 'Doctor Note - August 5, 2026',
    detail: 'Patient reported feeling dizzy. Recommend hydration and booking a follow-up if symptoms persist.',
    accent: 'border-emerald-500',
  },
];

export default function PatientDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        subtitle="A simple patient dashboard inspired by the flow in your React mockup."
      />

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <User size={40} />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              {user ? `${user.first_name} ${user.last_name}`.trim() : 'Patient Name'}
            </h1>
            <p className="mt-2 text-slate-500">Role: Patient</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2 text-sky-700">
            <Activity size={20} />
            <h2 className="text-lg font-semibold text-slate-950">Health metrics</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockHealthMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#0284c7" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sky-700">
            <ClipboardList size={20} />
            <h2 className="text-lg font-semibold text-slate-950">Active prescriptions and notes</h2>
          </div>
          <div className="space-y-4">
            {careNotes.map((note) => (
              <div key={note.title} className={`rounded-r-xl border-l-4 bg-slate-50 p-4 ${note.accent}`}>
                <p className="font-semibold text-slate-950">{note.title}</p>
                <p className="mt-1 text-sm text-slate-600">{note.detail}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
