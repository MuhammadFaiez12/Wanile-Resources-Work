export function ReportCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex justify-between">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="h-4 w-1/4 rounded bg-gray-100" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-5/6 rounded bg-gray-100" />
        <div className="h-3 w-4/6 rounded bg-gray-100" />
      </div>
      <div className="mt-3 flex gap-3">
        <div className="h-5 w-12 rounded-full bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
    </div>
  );
}

export function ReportCardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ReportCardSkeleton key={i} />
      ))}
    </div>
  );
}
