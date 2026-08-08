export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
