export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-slate-500">{value}%</span>
    </div>
  );
}
