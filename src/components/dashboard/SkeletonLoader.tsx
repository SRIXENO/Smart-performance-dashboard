'use client';

export function CardSkeleton() {
  return (
    <div className="interactive-card bg-white rounded-xl shadow-lg p-6">
      <div className="shimmer-block h-4 rounded w-3/4 mb-4"></div>
      <div className="shimmer-block h-8 rounded w-1/2 mb-2"></div>
      <div className="shimmer-block h-3 rounded w-2/3"></div>
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="interactive-card bg-white rounded-xl shadow-lg p-6">
      <div className="shimmer-block h-6 rounded w-1/3 mb-2"></div>
      <div className="shimmer-block h-4 rounded w-1/2 mb-4"></div>
      <div className="shimmer-block rounded-lg" style={{ height: `${height}px` }}></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="interactive-card bg-white rounded-xl shadow-lg p-6">
      <div className="shimmer-block h-6 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="shimmer-block h-10 rounded w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="shimmer-block h-4 rounded w-3/4"></div>
              <div className="shimmer-block h-3 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <TableSkeleton />
    </div>
  );
}
