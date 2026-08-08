import { Calendar, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DoctorCard({ doctor }) {
  return (
    <article className="flex h-full flex-col justify-between rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div>
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-700">
            <Stethoscope size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-950">{doctor.full_name}</h2>
            <p className="text-sm font-semibold text-sky-700">{doctor.specialization_display || doctor.specialization}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600">{doctor.qualification}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{doctor.bio || 'No bio added yet.'}</p>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar size={16} />
          <span>Consultation fee: ₹{doctor.consultation_fee}</span>
        </div>
        <Link className="btn-primary w-full rounded-xl" to={`/doctors/${doctor.id}`}>
          View slots
        </Link>
      </div>
    </article>
  );
}
