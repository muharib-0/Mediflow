import { Bot, Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

export default function SymptomChecker() {
  const { user } = useAuth();
  const firstName = user?.first_name || 'there';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Symptom checker"
        subtitle="A guided AI-style conversation that helps patients move toward the right specialist."
      />

      <section className="mx-auto flex h-[620px] max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 bg-sky-600 p-5 text-white">
          <Bot size={24} />
          <div>
            <h2 className="font-bold">Symptom Checker AI</h2>
            <p className="text-sm text-sky-100">I can help direct you to the right specialist</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-sky-100 p-2 text-sky-700">
              <Bot size={20} />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-none border border-slate-100 bg-white p-4 shadow-sm">
              Hello {firstName}! Please describe your symptoms, and I&apos;ll recommend which specialist you should consult.
            </div>
          </div>

          <div className="flex items-start gap-3 flex-row-reverse">
            <div className="rounded-full bg-slate-200 p-2 text-slate-700">
              <User size={20} />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tr-none bg-sky-600 p-4 text-white shadow-sm">
              I&apos;ve been having severe headaches behind my eyes and dizziness for the last three days.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-full bg-sky-100 p-2 text-sky-700">
              <Bot size={20} />
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-none border border-slate-100 bg-white p-4 shadow-sm">
              <p>
                Based on severe headaches and dizziness, you should consult a <strong>Neurologist</strong>. Would you
                like to see available neurologists now?
              </p>
              <Link
                to="/doctors?specialization=neurology"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
              >
                <Search size={16} />
                Find a neurologist
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your symptoms here..."
              className="field flex-1"
              readOnly
            />
            <button className="btn-primary px-5" type="button">
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
