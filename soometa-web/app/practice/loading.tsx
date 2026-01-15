// app/practice/loading.tsx
export default function PracticeLoading() {
  return (
    <div className="font-sans max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      {/* Filters skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8 space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
        <div className="h-12 bg-slate-100 rounded" />
        <div className="h-8 bg-slate-100 rounded w-1/2" />
      </div>

      {/* Filter tabs skeleton */}
      <div className="flex justify-center gap-6 mb-8 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-6 bg-slate-100 rounded w-24" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
        <div className="space-y-6">
          <div className="h-6 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />

          <div className="grid grid-cols-2 gap-3 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
