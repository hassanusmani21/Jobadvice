"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <section className="fade-up card-surface rounded-3xl px-6 py-10 text-center sm:px-8">
      <h1 className="font-serif text-3xl text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-slate-600">
        The page failed to load. Please try again, or return to the jobs list.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
