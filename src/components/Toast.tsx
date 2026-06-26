"use client";

import { useEffect, useState } from "react";

type ToastMessage = {
  id: string;
  message: string;
  variant?: "info" | "success" | "muted";
};

const EVENT_NAME = "jobadvice:toast";

export function showToast(message: string, variant: ToastMessage["variant"] = "info") {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { message, variant } }));
    }
  } catch {}
}

function Icon({ variant }: { variant?: ToastMessage["variant"] }) {
  if (variant === "success") {
    return (
      <svg className="toast-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === "muted") {
    return (
      <svg className="toast-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="toast-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path d="M12 2v10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function getVariantLabel(variant?: ToastMessage["variant"]) {
  if (variant === "success") {
    return "Saved";
  }

  if (variant === "muted") {
    return "Removed";
  }

  return "Notice";
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const ev = event as CustomEvent<{
        message: string;
        variant?: ToastMessage["variant"];
      }>;
      const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
      setToasts((t) => [
        ...t,
        { id, message: ev.detail.message, variant: ev.detail.variant || "info" },
      ]);
    };

    window.addEventListener(EVENT_NAME, handler as EventListener);
    return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== toast.id));
      }, 4200),
    );

    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <div aria-live="polite" className="toast-viewport">
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card card-surface toast-${toast.variant}`}>
            <div className="toast-card-body">
              <div className="toast-card-left">
                <span className="toast-icon-shell">
                  <Icon variant={toast.variant} />
                </span>
              </div>
              <div className="toast-card-content">
                <div className="toast-label">{getVariantLabel(toast.variant)}</div>
                <div className="toast-message">{toast.message}</div>
              </div>
              <button
                aria-label="Dismiss"
                className="toast-dismiss"
                onClick={() => setToasts((t) => t.filter((x) => x.id !== toast.id))}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
