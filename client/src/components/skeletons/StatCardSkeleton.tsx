export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow">
      <div className="mb-3 h-3 w-1/2 rounded bg-gray-200" />
      <div className="h-7 w-1/3 rounded bg-gray-200" />
    </div>
  );
}

export function StatCardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
