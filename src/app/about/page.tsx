import type { Metadata } from "next";
import { siteName } from "@/lib/site";

const focusAreas = [
  "Private company job openings",
  "Government job notifications",
  "Internship opportunities for students",
  "Fresher hiring updates",
  "Career guidance and preparation tips",
];

const whyChooseUs = [
  "Clear and structured job summaries",
  "Direct apply links to official sources",
  "Focus on fresher and entry-level roles",
  "No registration required to view job details",
  "No hidden charges",
];

const commitmentPoints = [
  "We aim to keep job information accurate and updated.",
  "Users should always verify details on the official company website before applying.",
  "JobAdvice never charges any fee for job information or applications.",
];

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how JobAdvice shares fresher jobs, internships, and career updates in a clear and practical format.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="fade-up hero-surface px-5 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
          <span className="rounded-full border border-teal-200 bg-white/70 px-3 py-1">
            About {siteName}
          </span>
          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-600">
            Independent Job Information Platform
          </span>
        </div>

        <h1 className="mt-4 max-w-3xl font-serif text-[1.8rem] leading-[1.15] text-slate-900 sm:text-[2.2rem]">
          Helping students, fresh graduates, and early-career professionals discover genuine job
          opportunities without unnecessary clutter.
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
          {siteName} is an independent job information website that shares the latest job openings,
          fresher jobs, internship opportunities, and career updates across India.
        </p>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
          Our mission is to simplify the job search process by providing structured, easy-to-read,
          and regularly updated job information.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <section className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-7">
            <h2 className="font-serif text-[1.4rem] leading-[1.2] text-slate-900">
              What We Focus On
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
              All job listings published on {siteName} are sourced from official company websites,
              verified career portals, or publicly available recruitment announcements.
            </p>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {focusAreas.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold leading-6 text-slate-800"
                >
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm leading-7 text-slate-700 sm:text-base">
              We present job details in a clean format, including eligibility criteria, salary
              information when available, selection process, and direct application links.
            </p>
          </section>

          <section
            className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-7"
            style={{ animationDelay: "90ms" }}
          >
            <h2 className="font-serif text-[1.4rem] leading-[1.2] text-slate-900">Our Role</h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 sm:text-base">
              <p>
                {siteName} does not conduct recruitment, collect resumes, or guarantee job
                placement.
              </p>
              <p>
                We are not affiliated with hiring companies unless explicitly mentioned.
              </p>
              <p>
                When users click an Apply link, they are redirected to the official company career
                portal where the actual application process takes place.
              </p>
              <p>
                We act solely as an informational intermediary to help users discover genuine
                career opportunities.
              </p>
            </div>
          </section>

          <section
            className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-7"
            style={{ animationDelay: "150ms" }}
          >
            <h2 className="font-serif text-[1.4rem] leading-[1.2] text-slate-900">
              Why Choose {siteName}
            </h2>

            <ul className="mt-5 space-y-3">
              {whyChooseUs.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold leading-6 text-slate-800"
                >
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-sm leading-7 text-slate-700 sm:text-base">
              We believe job information should be accessible, transparent, and easy to navigate
              without unnecessary clutter.
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="fade-up card-surface rounded-3xl p-5" style={{ animationDelay: "120ms" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Our Commitment
            </p>
            <h2 className="mt-3 text-lg font-bold text-slate-900">What You Can Expect</h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {commitmentPoints.map((item) => (
                <li key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section
            className="fade-up rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm leading-6 text-amber-950"
            style={{ animationDelay: "180ms" }}
          >
            <p className="font-semibold">Important note</p>
            <p className="mt-2">
              If any third party asks for payment while claiming association with {siteName},
              ignore the request and verify the opportunity from the official company source.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
