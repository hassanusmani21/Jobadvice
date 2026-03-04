"use client";

import Link from "@/components/AppLink";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type VerifyResponse = {
  access_token?: string;
  refresh_token?: string;
};

const readErrorMessage = async (response: Response) => {
  const fallbackMessage = "Password reset failed. Request a new reset email and try again.";

  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const message =
      (typeof payload.msg === "string" && payload.msg) ||
      (typeof payload.error === "string" && payload.error) ||
      (typeof payload.message === "string" && payload.message);

    return message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

export default function AdminRecoverPage() {
  const [hashValue, setHashValue] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setHashValue(window.location.hash || "");
  }, []);

  const recoveryToken = useMemo(() => {
    const params = new URLSearchParams(hashValue.replace(/^#/, ""));
    return params.get("recovery_token") || "";
  }, [hashValue]);

  const isReady = recoveryToken.length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!recoveryToken) {
      setErrorMessage("Missing recovery token. Open the newest reset email and try again.");
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage("Enter your new password twice.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const verifyResponse = await fetch("/.netlify/identity/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: recoveryToken,
          type: "recovery",
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error(await readErrorMessage(verifyResponse));
      }

      const verifyPayload = (await verifyResponse.json()) as VerifyResponse;
      const accessToken = verifyPayload.access_token || "";

      if (!accessToken) {
        throw new Error("Recovery token verification failed. Request a new reset email.");
      }

      const updateResponse = await fetch("/.netlify/identity/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          password,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error(await readErrorMessage(updateResponse));
      }

      setIsSuccess(true);
      window.history.replaceState(null, "", "/admin/recover");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Password reset failed. Request a new reset email and try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full rounded-3xl border border-white/70 bg-white/90 p-7 shadow-xl backdrop-blur-sm sm:p-10">
        <p className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-900">
          Admin Recovery
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-slate-900">
          Set a new admin password
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          Use the newest password reset email only. After saving your new password, return to the
          CMS login and sign in with your email and the new password.
        </p>

        {isSuccess ? (
          <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-800">Password updated successfully.</p>
            <p className="mt-2 text-sm text-emerald-900">
              Continue to the CMS login and use your email with the new password.
            </p>
            <div className="mt-4">
              <Link
                href="/admin/"
                className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Go to Admin Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400"
              />
            </div>

            {!isReady ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Missing or expired recovery token. Open the newest reset email and try again.
              </p>
            ) : null}

            {errorMessage ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !isReady}
                className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving password..." : "Save new password"}
              </button>

              <Link
                href="/admin/"
                className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900"
              >
                Back to Admin
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
