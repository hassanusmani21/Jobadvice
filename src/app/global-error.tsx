"use client";

import { useEffect } from "react";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const chunkReloadStoragePrefix = "jobadvice:chunk-reload";

const isChunkLoadError = (error: Error) => {
  const message = error.message || "";

  return (
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
};

const getChunkReloadKey = (error: Error) => {
  if (typeof window === "undefined") {
    return chunkReloadStoragePrefix;
  }

  return `${chunkReloadStoragePrefix}:${window.location.pathname}:${error.message}`;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  const chunkLoadError = isChunkLoadError(error);

  useEffect(() => {
    console.error("Global error:", error);

    if (!chunkLoadError || typeof window === "undefined") {
      return;
    }

    try {
      const reloadKey = getChunkReloadKey(error);

      if (window.sessionStorage.getItem(reloadKey) === "1") {
        return;
      }

      window.sessionStorage.setItem(reloadKey, "1");
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }, [chunkLoadError, error]);

  const handleAction = () => {
    if (chunkLoadError && typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(getChunkReloadKey(error));
      } catch {}

      window.location.reload();
      return;
    }

    reset();
  };

  return (
    <html lang="en">
      <body className="antialiased">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6">
          <section className="w-full rounded-3xl border border-white/80 bg-white/80 px-6 py-10 text-center shadow-sm sm:px-8">
            <h1 className="font-serif text-3xl text-slate-900">Unexpected application error</h1>
            <p className="mt-3 text-slate-600">
              {chunkLoadError
                ? "We could not load the latest version of this page. Reload and try again."
                : error.message || "An unexpected error occurred."}
            </p>
            <button
              type="button"
              onClick={handleAction}
              className="mt-6 inline-flex rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              {chunkLoadError ? "Reload page" : "Reload"}
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
