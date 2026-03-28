import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import { siteName } from "@/lib/site";

const readerExpectations = [
  {
    title: "Independent platform",
    body: `${siteName} is built for students, fresh graduates, and early-career professionals in India who want cleaner, easier-to-verify job information.`,
  },
  {
    title: "Source-first publishing",
    body: "We review official company career pages, verified portals, and public announcements before publishing whenever those sources are available.",
  },
  {
    title: "Clearer presentation",
    body: "Listings are organized so readers can scan eligibility, location, salary context, selection flow, and apply links without unnecessary noise.",
  },
];

const publishCategories = [
  "Private company job openings",
  "Government job notifications",
  "Internship opportunities",
  "Fresher hiring updates",
  "Career guidance and preparation tips",
  "Readable breakdowns of hiring changes",
];

const verificationSteps = [
  {
    title: "Check the original source",
    body: "We review company sites, career portals, universities, and government notices before publishing when those references are available.",
  },
  {
    title: "Structure the useful details",
    body: "We bring forward information readers usually search for first, such as eligibility, location, deadlines, salary notes, and apply links.",
  },
  {
    title: "Revise when things change",
    body: "Published and updated dates remain visible, and we revise posts when source information changes or readers report an issue.",
  },
];

const roleStatements = [
  `${siteName} does not conduct recruitment, collect resumes, or guarantee job placement.`,
  "We are not affiliated with hiring companies unless that relationship is clearly stated.",
  "When you click an Apply link, the application process continues on the official employer website or career portal.",
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
    <div className="space-y-6">
      <section className="fade-up hero-surface relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div
          aria-hidden
          className="absolute -top-16 right-[-3rem] h-40 w-40 rounded-full bg-white/55 blur-3xl sm:h-52 sm:w-52"
        />
        <div
          aria-hidden
          className="absolute -bottom-12 left-[-3rem] h-32 w-32 rounded-full bg-teal-200/45 blur-3xl sm:h-44 sm:w-44"
        />

        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.9fr)] lg:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <span className="page-kicker">About {siteName}</span>
              <h1 className="page-title max-w-4xl">
                Clearer job information for freshers, students, and early-career professionals.
              </h1>
              <p className="page-copy max-w-3xl">
                {siteName} is an independent job information platform that focuses on readable job
                updates, practical career guidance, and source-aware publishing instead of noisy
                copy-paste listings.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="content-chip content-chip-accent">Official sources first</span>
              <span className="content-chip">India-focused</span>
              <span className="content-chip">No application fees</span>
              <span className="content-chip">Readable job pages</span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ActionButton href="/jobs" variant="primary" className="sm:w-auto">
                Browse Jobs
              </ActionButton>
              <ActionButton href="/contact" variant="secondary" className="sm:w-auto">
                Contact Us
              </ActionButton>
            </div>
          </div>

          <aside className="card-surface h-full rounded-[1.4rem] p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              What Readers Can Expect
            </p>
            <div className="mt-4 grid gap-3">
              {readerExpectations.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-4"
                >
                  <h2 className="text-sm font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="fade-up card-surface rounded-3xl px-5 py-5" style={{ animationDelay: "70ms" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-700">
            What We Publish
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Job updates, internships, government notifications, fresher hiring signals, and
            practical career guidance in a format that is easier to scan.
          </p>
        </article>
        <article className="fade-up card-surface rounded-3xl px-5 py-5" style={{ animationDelay: "120ms" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
            What We Do Not Do
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            We do not recruit, process applications, collect resumes for hiring, or promise job
            placement on behalf of companies.
          </p>
        </article>
        <article className="fade-up card-surface rounded-3xl px-5 py-5" style={{ animationDelay: "170ms" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
            Why It Helps
          </p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Readers can move faster from discovery to verification because the most useful details
            are pulled forward instead of buried inside long announcements.
          </p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
        <article className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8" style={{ animationDelay: "90ms" }}>
          <h2 className="text-2xl font-serif text-slate-900">What We Publish</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
            <p>
              Job posts on this website are based on official company websites, verified career
              portals, and publicly available recruitment announcements.
            </p>
            <p>
              Where relevant, we include eligibility details, location, salary information,
              selection process, and direct application links so readers do not have to dig through
              scattered sources.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {publishCategories.map((item) => (
              <div key={item} className="content-list-card px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <section
          id="how-we-verify-information"
          className="fade-up card-surface scroll-mt-28 rounded-3xl px-5 py-6 sm:px-6 sm:py-7"
          style={{ animationDelay: "130ms" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-700">
            How We Verify Information
          </p>
          <h2 className="mt-3 text-xl font-serif text-slate-900">Our review workflow</h2>
          <div className="mt-5 space-y-4">
            {verificationSteps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-900">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900">{step.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8" style={{ animationDelay: "150ms" }}>
          <h2 className="text-2xl font-serif text-slate-900">Our Role</h2>
          <div className="mt-5 space-y-3">
            {roleStatements.map((statement) => (
              <div
                key={statement}
                className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-4"
              >
                <p className="text-sm leading-6 text-slate-600">{statement}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8" style={{ animationDelay: "190ms" }}>
          <h2 className="text-2xl font-serif text-slate-900">Important Note</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
            <p>
              We aim to keep information accurate and updated, but readers should always verify the
              final details on the official company website before applying.
            </p>
            <p>
              {siteName} never asks for payment for access to job information or job applications.
            </p>
          </div>

          <div className="soft-note mt-5 px-4 py-4">
            <p className="text-sm leading-6 text-slate-600">
              Need a correction, want to report an issue, or have a partnership question? Use the{" "}
              <Link
                href="/contact"
                className="font-medium text-slate-900 underline underline-offset-4"
              >
                contact page
              </Link>{" "}
              or read the{" "}
              <Link
                href="/privacy-policy"
                className="font-medium text-slate-900 underline underline-offset-4"
              >
                privacy policy
              </Link>
              .
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
