import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import {
  siteEmail,
  siteName,
  siteVerifiedPublisherName,
  siteVerifiedPublisherRole,
} from "@/lib/site";

const verificationSteps = [
  {
    title: "We start with the original source when possible",
    body:
      "Our first preference is the employer careers page, an official application page, or a public source that clearly points back to the original listing.",
  },
  {
    title: "We rewrite listings for faster scanning",
    body:
      "Job posts are cleaned into a simpler structure so readers can quickly see role, company, location, eligibility, work mode, and apply details without digging through clutter.",
  },
  {
    title: "We keep direct-apply links when they exist",
    body:
      "If a reliable original apply link is available, we keep it. When no safe direct link is available yet, we avoid pretending there is one.",
  },
  {
    title: "We treat accuracy like an ongoing process",
    body:
      "Hiring pages can change, close, or move. We expect that reality and update or remove listings when problems are reported or discovered.",
  },
];

const trustPromises = [
  "We do not recruit on behalf of employers.",
  "We do not sell access to job information.",
  "We do not promise placement, selection, or interview calls.",
  "We link out to external employer or portal pages for the real application flow.",
];

const reportingNotes = [
  "Share the page URL or job title when reporting an issue.",
  "If the source page changed or expired, include that detail so it can be checked faster.",
  "Corrections and removals are more useful than silence, so reporting problems is encouraged.",
];

export const metadata: Metadata = {
  title: "How We Verify Jobs",
  description:
    "Learn how JobAdvice sources listings, keeps direct-apply links when possible, and handles trust, corrections, and platform limits.",
  alternates: {
    canonical: "/how-we-verify-jobs/",
  },
};

export default function HowWeVerifyJobsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="fade-up card-surface rounded-[1.75rem] px-5 py-6 sm:px-7 sm:py-7">
        <p className="jobs-directory-kicker">Trust & Verification</p>
        <h1 className="mt-4 font-serif text-[2.45rem] leading-[0.98] tracking-[-0.05em] text-slate-900 sm:text-[3.15rem]">
          How {siteName} verifies jobs
        </h1>
        <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-slate-600">
          {siteName} is built to make job discovery clearer, not noisier. The goal is simple:
          help readers reach reliable openings faster, understand what a listing really says, and
          avoid pay-to-access confusion or copy-paste job text that hides the useful details.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ActionButton href="/jobs" variant="primary" className="sm:w-auto">
            Browse Jobs
          </ActionButton>
          <ActionButton href="/contact" variant="secondary" className="sm:w-auto">
            Report an Issue
          </ActionButton>
        </div>
      </section>

      <section
        className="fade-up card-surface rounded-[1.6rem] px-5 py-6 sm:px-7"
        style={{ animationDelay: "70ms" }}
      >
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-serif text-slate-900">What the process looks like</h2>
            <div className="mt-4 space-y-3">
              {verificationSteps.map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-white/72 px-4 py-4"
                >
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-2xl font-serif text-slate-900">What readers can expect</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {trustPromises.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4"
                >
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-2xl font-serif text-slate-900">What can still change</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              Employers and job portals can update, close, or remove listings without notice. That
              means a correct listing today can become outdated tomorrow. The verification process
              reduces noise, but it cannot freeze the external hiring market or replace the official
              employer page.
            </p>
          </section>
        </div>
      </section>

      <section
        className="fade-up card-surface rounded-[1.6rem] px-5 py-6 sm:px-7"
        style={{ animationDelay: "120ms" }}
      >
        <h2 className="text-2xl font-serif text-slate-900">Who stands behind this</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
          {siteVerifiedPublisherName}, {siteVerifiedPublisherRole}, is presented publicly across the
          site so trust is attached to a real person, not an anonymous content farm. If something
          looks wrong, readers should feel comfortable calling it out.
        </p>
        <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
          You can also read more context on the{" "}
          <Link href="/about" className="font-medium text-slate-900 underline underline-offset-4">
            About page
          </Link>
          .
        </p>
      </section>

      <section
        className="fade-up soft-note rounded-[1.5rem] px-5 py-5 sm:px-6"
        style={{ animationDelay: "160ms" }}
      >
        <h2 className="text-lg font-serif text-slate-900">Need a correction?</h2>
        <div className="mt-3 space-y-2">
          {reportingNotes.map((item) => (
            <p key={item} className="text-sm leading-6 text-slate-600">
              {item}
            </p>
          ))}
        </div>
        <p className="mt-4 break-all text-sm font-semibold text-slate-900">{siteEmail}</p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <ActionButton href={`mailto:${siteEmail}`} external variant="primary" className="sm:w-auto">
            Email {siteName}
          </ActionButton>
          <ActionButton href="/privacy-policy" variant="secondary" className="sm:w-auto">
            Privacy & Disclaimer
          </ActionButton>
        </div>
      </section>
    </div>
  );
}
