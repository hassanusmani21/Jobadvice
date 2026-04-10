export default function Loading() {
  return (
    <section
      aria-live="polite"
      aria-busy="true"
      className="space-y-5"
    >
      <div className="card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <span
            aria-hidden="true"
            className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-teal-300 border-t-teal-700"
          />
          <span>Opening page...</span>
        </div>

        <div className="mt-5 space-y-3">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-7 w-full animate-pulse rounded bg-slate-200 sm:w-3/4" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </section>
  );
}
