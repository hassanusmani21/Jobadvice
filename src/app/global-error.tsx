"use client";

import { useEffect } from "react";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const chunkReloadStoragePrefix = "jobadvice:asset-recovery";
const chunkReloadParam = "__chunk_reload";
const chunkReloadWindowMs = 60000;
const maxChunkReloadAttempts = 1;

const isChunkLoadError = (error: Error) => {
  const message = error.message || "";

  return (
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
};

const getChunkReloadKey = () => {
  if (typeof window === "undefined") {
    return chunkReloadStoragePrefix;
  }

  return `${chunkReloadStoragePrefix}:${window.location.pathname}`;
};

const getChunkReloadState = () => {
  if (typeof window === "undefined") {
    return {
      attempts: 0,
      lastAttempt: 0,
    };
  }

  try {
    const rawValue = window.sessionStorage.getItem(getChunkReloadKey());
    if (!rawValue) {
      return {
        attempts: 0,
        lastAttempt: 0,
      };
    }

    const parsed = JSON.parse(rawValue) as {
      attempts?: unknown;
      lastAttempt?: unknown;
    };
    const attempts =
      typeof parsed.attempts === "number" && Number.isFinite(parsed.attempts)
        ? parsed.attempts
        : 0;
    const lastAttempt =
      typeof parsed.lastAttempt === "number" && Number.isFinite(parsed.lastAttempt)
        ? parsed.lastAttempt
        : 0;

    return {
      attempts,
      lastAttempt,
    };
  } catch {
    return {
      attempts: 0,
      lastAttempt: 0,
    };
  }
};

const clearChunkReloadState = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(getChunkReloadKey());
  } catch {}
};

const recoverChunkLoad = (force = false) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const recoveryState = getChunkReloadState();
    const withinRetryWindow =
      Number.isFinite(recoveryState.lastAttempt) &&
      Date.now() - recoveryState.lastAttempt < chunkReloadWindowMs;
    const attempts = withinRetryWindow ? recoveryState.attempts : 0;

    if (!force && attempts >= maxChunkReloadAttempts) {
      return false;
    }

    const nextAttempt = force ? 1 : attempts + 1;
    window.sessionStorage.setItem(
      getChunkReloadKey(),
      JSON.stringify({
        attempts: nextAttempt,
        lastAttempt: Date.now(),
      }),
    );

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set(chunkReloadParam, nextAttempt.toString());
    nextUrl.searchParams.set("__reload_ts", Date.now().toString());
    window.location.replace(nextUrl.toString());
    return true;
  } catch {
    window.location.reload();
    return true;
  }
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  const chunkLoadError = isChunkLoadError(error);

  useEffect(() => {
    console.error("Global error:", error);

    if (!chunkLoadError || typeof window === "undefined") {
      return;
    }

    recoverChunkLoad();
  }, [chunkLoadError, error]);

  const handleAction = () => {
    if (chunkLoadError && typeof window !== "undefined") {
      clearChunkReloadState();
      recoverChunkLoad(true);
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
