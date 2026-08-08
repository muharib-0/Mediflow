import { Link } from 'react-router-dom';
import { Activity, Bot, Calendar, ChevronRight, ClipboardList, Search, ShieldCheck, Stethoscope } from 'lucide-react';

const featureCards = [
  {
    icon: ClipboardList,
    title: 'Complete your medical profile',
    description: 'Capture the patient details doctors need before the first appointment.',
  },
  {
    icon: Bot,
    title: 'Use the symptom checker',
    description: 'Guide patients toward the right specialist before they book.',
  },
  {
    icon: Search,
    title: 'Search and book doctors',
    description: 'Find specialists quickly and move into booking without leaving the flow.',
  },
];

const flowSteps = [
  'Register or log in',
  'Create your patient or doctor profile',
  'Explore doctors or use the symptom checker',
  'Book and manage appointments',
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-500 px-6 py-12 text-white shadow-xl sm:px-10 lg:px-12">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.3),_transparent_55%)] lg:block" />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-sky-50 backdrop-blur">
              <Activity size={18} />
              Guided care journey for patients and doctors
            </div>
            <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
              From login to profile setup to doctor booking, all in one flow.
            </h1>
            <p className="mt-4 max-w-xl text-base text-sky-50/90 sm:text-lg">
              Mediflow helps patients complete their profile, understand symptoms, search specialists, and book with
              confidence while giving doctors a cleaner onboarding path.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-sky-700 transition hover:bg-sky-50">
                Create account
                <ChevronRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15">
                Login
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[1.75rem] border border-white/20 bg-slate-950/20 p-5 backdrop-blur">
              <div className="rounded-[1.5rem] bg-white p-5 text-slate-900 shadow-2xl">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-sky-700">Care Journey</p>
                    <h2 className="text-xl font-bold">Patient Flow</h2>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {flowSteps.map((step, index) => (
                    <div key={step} className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{step}</p>
                        <p className="text-sm text-slate-600">
                          {index === 0 && 'Start from a clear main page with role-aware actions.'}
                          {index === 1 && 'Collect the profile data needed for treatment and discovery.'}
                          {index === 2 && 'Support both guided specialist discovery and direct doctor search.'}
                          {index === 3 && 'Keep booking and follow-up accessible from the same app shell.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {featureCards.map(({ icon: Icon, title, description }) => (
          <article key={title} className="card rounded-[1.75rem] p-6">
            <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700">
              <Icon size={24} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm lg:grid-cols-[1fr_0.9fr] lg:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Why this main page matters</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">The original flow was missing its starting point.</h2>
          <p className="mt-4 text-slate-600">
            Your React mock already defined registration, login, profile creation, dashboard, chatbot, and doctor search.
            The missing piece was a homepage that explains the journey and gives users a clear way in.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <ShieldCheck className="text-emerald-600" size={22} />
            <h3 className="mt-3 font-bold text-slate-950">Clear entry point</h3>
            <p className="mt-2 text-sm text-slate-600">Patients and doctors both know where to begin instead of landing straight on search.</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 p-5">
            <Calendar className="text-emerald-600" size={22} />
            <h3 className="mt-3 font-bold text-slate-950">Better onboarding</h3>
            <p className="mt-2 text-sm text-slate-600">The homepage sets expectations for the profile and booking journey ahead.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
