// app/exams/loading.tsx
export default function ExamsLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <header className="mb-10 md:mb-12 text-center">
          <div className="h-12 bg-slate-200 rounded-lg w-96 mx-auto mb-4 animate-pulse" />
          <div className="h-6 bg-slate-100 rounded-lg w-80 mx-auto animate-pulse" />
        </header>

        {/* Year section skeleton */}
        <section className="mb-12 md:mb-16">
          <div className="h-10 bg-sky-100 rounded-lg w-40 mb-8 animate-pulse" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-7">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="p-5 md:p-6 space-y-3">
                  <div className="h-3 bg-slate-100 rounded w-24 mx-auto" />
                  <div className="h-6 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-32 mx-auto" />
                  <div className="flex gap-2 justify-center pt-3">
                    <div className="h-6 bg-sky-100 rounded w-20" />
                    <div className="h-6 bg-slate-100 rounded w-16" />
                  </div>
                </div>
                <div className="border-t border-slate-200 px-5 py-4 bg-slate-50 flex justify-between">
                  <div className="h-4 bg-slate-100 rounded w-20" />
                  <div className="h-4 bg-slate-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
