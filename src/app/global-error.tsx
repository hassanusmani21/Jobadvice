"use client";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang="en">
      <body className="antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6">
          <section className="w-full rounded-3xl border border-white/80 bg-white/80 px-6 py-10 text-center shadow-sm sm:px-8">
            <h1 className="font-serif text-3xl text-slate-900">Unexpected application error</h1>
            <p className="mt-3 text-slate-600">{error.message || "An unexpected error occurred."}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Reload
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
