"use client";

import Link from "@/components/AppLink";

export default function AdminRecoverPage() {
  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-3xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full rounded-3xl border border-white/70 bg-white/90 p-7 shadow-xl backdrop-blur-sm sm:p-10">
        <p className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-900">Admin Sign-In</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-slate-900">
          Netlify password recovery has been removed
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
          This project is being moved away from Netlify Identity. Admin access now depends on your
          protected admin login and the CMS GitHub sign-in flow instead of a Netlify password reset.
        </p>
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Finish the migration by configuring the Decap GitHub OAuth app and updating the
          production CMS callback URL before using the editor on Vercel.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/login"
            className="inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Go to Admin Login
          </Link>
          <Link
            href="/admin/"
            className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900"
          >
            Open CMS
          </Link>
        </div>
      </div>
    </main>
  );
}
