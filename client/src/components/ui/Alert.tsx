interface AlertProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string | string[];
}

const styles = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
};

export function Alert({ type, message }: AlertProps) {
  const msgs = Array.isArray(message) ? message : [message];
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles[type]}`}>
      {msgs.length === 1 ? (
        msgs[0]
      ) : (
        <ul className="list-inside list-disc space-y-0.5">
          {msgs.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
    </div>
  );
}
