"use client";

export function LoadingSkeleton() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-10 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />

        {/* Search bar skeleton */}
        <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />

        {/* Table skeleton */}
        <div className="overflow-x-auto">
          <div className="space-y-3">
            {/* Header row */}
            <div className="flex gap-4 h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse" />

            {/* Data rows */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 h-12 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
