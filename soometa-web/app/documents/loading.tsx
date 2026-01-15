// app/documents/loading.tsx
export default function DocumentsLoading() {
  return (
    <div className="container mx-auto p-6 md:p-10 lg:p-12 dark:bg-slate-900 min-h-screen">
      {/* Header skeleton */}
      <header className="mb-10 text-center border-b pb-8 border-gray-200 dark:border-slate-700">
        <div className="h-12 bg-slate-200 rounded-lg w-96 mx-auto mb-4 animate-pulse" />
        <div className="h-6 bg-slate-100 rounded-lg w-80 mx-auto animate-pulse" />
      </header>

      {/* Filters skeleton */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-3 justify-center">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg w-32 animate-pulse" />
          ))}
        </div>
        <div className="flex justify-center">
          <div className="h-10 bg-slate-100 rounded-lg w-64 animate-pulse" />
        </div>
      </div>

      {/* Documents grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-pulse"
          >
            <div className="p-6 space-y-4">
              <div className="h-6 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="flex gap-2 pt-2">
                <div className="h-6 bg-sky-100 rounded w-20" />
                <div className="h-6 bg-slate-100 rounded w-16" />
              </div>
              <div className="pt-4 border-t border-slate-200">
                <div className="h-10 bg-sky-100 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
