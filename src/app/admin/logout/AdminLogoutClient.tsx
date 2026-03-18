"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

const nextAdminLoginUrl = "/admin/login?callbackUrl=%2Fadmin";

export default function AdminLogoutClient() {
  useEffect(() => {
    void signOut({
      callbackUrl: nextAdminLoginUrl,
    });
  }, []);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-4 py-8 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Admin Logout
        </p>
        <h1 className="mt-3 font-serif text-3xl text-slate-900">Signing you out</h1>
        <p className="mt-3 text-sm text-slate-600">
          If this takes more than a moment, continue to the admin login screen.
        </p>
        <a
          href={nextAdminLoginUrl}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-teal-700 px-5 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Go to Admin Login
        </a>
      </div>
    </main>
  );
}
