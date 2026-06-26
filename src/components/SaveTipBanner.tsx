"use client";

import { useEffect, useState } from "react";

const storageKey = "jobadvice:save-tip-dismissed-v1";

export default function SaveTipBanner() {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setDismissed(raw === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed === null || dismissed) {
    return null;
  }

  return (
    <div className="save-tip card-surface rounded-md px-4 py-3 sm:px-5 sm:py-4 mt-4 border border-slate-200/80 bg-gradient-to-r from-white to-slate-50">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900">Tip: Save jobs to review later</p>
          <p className="mt-1 text-sm text-slate-600">Click the bookmark icon on any job card to save it to this device for quick follow-up.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="utility-button"
            onClick={() => {
              try {
                window.localStorage.setItem(storageKey, "1");
              } catch {}
              setDismissed(true);
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
