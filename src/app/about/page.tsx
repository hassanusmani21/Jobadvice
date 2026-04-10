import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import { siteName } from "@/lib/site";

const principles = [
  "Verified openings and internships in a cleaner format.",
  "Direct apply links when the original source is available.",
  "Job pages built for faster scanning and easier verification.",
];

const boundaries = [
  "We do not recruit on behalf of employers.",
  "We do not collect resumes for hiring.",
  "We do not ask for payment to access job information.",
];

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn what JobAdvice publishes, how job information is sourced, and what role the platform plays.",
  alternates: {
    canonical: "/about/",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="fade-up card-surface rounded-[1.75rem] px-5 py-6 sm:px-7 sm:py-7">
        <p className="jobs-directory-kicker">About</p>
        <h1 className="mt-4 font-serif text-[2.55rem] leading-[0.96] tracking-[-0.05em] text-slate-900 sm:text-[3.25rem]">
          {siteName}
        </h1>
        <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-slate-600">
          {siteName} is a simple job information platform for students, freshers, and early-career
          professionals who want clearer listings and easier source verification.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ActionButton href="/jobs" variant="primary" className="sm:w-auto">
            Browse Jobs
          </ActionButton>
          <ActionButton href="/contact" variant="secondary" className="sm:w-auto">
            Contact Us
          </ActionButton>
        </div>
      </section>

      <section className="fade-up card-surface rounded-[1.6rem] px-5 py-6 sm:px-7" style={{ animationDelay: "80ms" }}>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-serif text-slate-900">What this site is for</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              We publish openings, internships, and career articles in a format that is easier to
              scan than long copy-paste posts. The goal is to help readers move from discovery to
              verification faster.
            </p>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-2xl font-serif text-slate-900">What you can expect</h2>
            <div className="mt-4 space-y-3">
              {principles.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white/72 px-4 py-4">
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-2xl font-serif text-slate-900">What we do not do</h2>
            <div className="mt-4 space-y-3">
              {boundaries.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white/72 px-4 py-4">
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="fade-up soft-note rounded-[1.5rem] px-5 py-5 sm:px-6" style={{ animationDelay: "140ms" }}>
        <p className="text-sm leading-6 text-slate-600">
          Need a correction or want to report an issue? Use the{" "}
          <Link href="/contact" className="font-medium text-slate-900 underline underline-offset-4">
            contact page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
