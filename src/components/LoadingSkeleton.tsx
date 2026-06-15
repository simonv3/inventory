"use client";

export function LoadingSkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="skeleton h-10 w-48" />

        {/* Search bar skeleton */}
        <div className="skeleton h-10 w-full" />

        {/* Table skeleton */}
        <div className="overflow-x-auto">
          <div className="space-y-3">
            {/* Header row */}
            <div className="skeleton h-12 w-full" />

            {/* Data rows */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
