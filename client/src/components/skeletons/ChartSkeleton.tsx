export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow">
      <div className="mb-4 h-4 w-1/3 rounded bg-gray-200" />
      <div className="flex items-end gap-2" style={{ height }}>
        {[60, 85, 45, 95, 70, 55, 80, 40, 90, 65].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gray-200"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
