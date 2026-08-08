export default function Alert({ type = 'info', children }) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  };

  if (!children) return null;

  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>{children}</div>;
}
