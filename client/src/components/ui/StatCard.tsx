interface StatCardProps {
  label: string;
  value: string | number;
  accent?: string;
  icon?: string;
}

export function StatCard({ label, value, accent, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      {icon && <p className="mb-1 text-xl">{icon}</p>}
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent || 'text-slate-800'}`}>{value}</p>
    </div>
  );
}
