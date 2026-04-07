"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  LEARN_GUEST_DRAFTS_STORAGE_KEY,
  LEARN_GUEST_PROGRESS_STORAGE_KEY,
} from "@/lib/learn/storage";
import type { LearnGuestDraftRecord, LearnGuestProgressRecord } from "@/lib/learn/types";

const parseStoredArray = <T,>(storageKey: string) => {
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [] as T[];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? (parsedValue as T[]) : [];
  } catch {
    return [] as T[];
  }
};

export default function GuestProgressMerge() {
  const router = useRouter();
  const [statusText, setStatusText] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const progress = parseStoredArray<LearnGuestProgressRecord>(LEARN_GUEST_PROGRESS_STORAGE_KEY);
    const drafts = parseStoredArray<LearnGuestDraftRecord>(LEARN_GUEST_DRAFTS_STORAGE_KEY);

    if (progress.length === 0 && drafts.length === 0) {
      return;
    }

    let cancelled = false;

    startTransition(() => {
      setStatusText("Syncing your saved learning progress...");

      void fetch("/api/learn/progress/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          progress,
          drafts,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Merge failed (${response.status})`);
          }

          if (cancelled) {
            return;
          }

          window.localStorage.removeItem(LEARN_GUEST_PROGRESS_STORAGE_KEY);
          window.localStorage.removeItem(LEARN_GUEST_DRAFTS_STORAGE_KEY);
          setStatusText("Your saved progress has been synced.");
          router.refresh();
        })
        .catch(() => {
          if (cancelled) {
            return;
          }

          setStatusText("We could not sync your local progress yet. Please try again later.");
        });
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!statusText && !isPending) {
    return null;
  }

  return (
    <p className="mb-5 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
      {statusText}
    </p>
  );
}
