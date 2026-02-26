import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact JobAdvice for support, business inquiries, or listing corrections.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <section className="fade-up card-surface rounded-3xl px-6 py-8 sm:px-8">
      <h1 className="font-serif text-4xl text-slate-900">Contact</h1>
      <p className="mt-4 max-w-2xl text-slate-700">
        Questions, corrections, or partnership requests can be sent to the email addresses below.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl bg-white/75 p-5">
          <h2 className="text-lg font-bold text-slate-900">Email</h2>
          <p className="mt-2 text-sm text-slate-600">
            For general support and listing updates.
          </p>
          <Link
            href="mailto:hello@jobadvice.site"
            className="mt-3 inline-block text-sm font-semibold text-teal-800 hover:text-teal-900"
          >
            hello@jobadvice.site
          </Link>
        </article>

        <article className="rounded-2xl bg-white/75 p-5">
          <h2 className="text-lg font-bold text-slate-900">Business Inquiries</h2>
          <p className="mt-2 text-sm text-slate-600">
            For collaborations, integrations, and media requests.
          </p>
          <Link
            href="mailto:partners@jobadvice.site"
            className="mt-3 inline-block text-sm font-semibold text-teal-800 hover:text-teal-900"
          >
            partners@jobadvice.site
          </Link>
        </article>
      </div>
    </section>
  );
}
