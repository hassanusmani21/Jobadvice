import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import { siteEmail, siteName } from "@/lib/site";

const policySections = [
  {
    title: "What this site is",
    body: `${siteName} is an independent job information platform. We publish openings, internships, and career articles based on official pages, verified portals, and public announcements when those sources are available.`,
  },
  {
    title: "What this site is not",
    body: "We do not recruit, collect resumes for employers, guarantee placement, or charge application fees. If you click Apply, the process continues on the employer or career portal website.",
  },
  {
    title: "What data may be used",
    body: "We do not collect personal job application data through this site. We may use limited non-personal analytics to improve performance, speed, and usability.",
  },
  {
    title: "External websites",
    body: `When you leave ${siteName}, the privacy policy and terms of that external website apply. Employers can also update or remove listings at any time.`,
  },
];

export const metadata: Metadata = {
  title: "Privacy Policy & Disclaimer",
  description:
    "Read the JobAdvice privacy policy and disclaimer covering external links, website data, and platform limitations.",
  alternates: {
    canonical: "/privacy-policy/",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="fade-up card-surface rounded-[1.75rem] px-5 py-6 sm:px-7 sm:py-7">
        <p className="jobs-directory-kicker">Privacy Policy</p>
        <h1 className="mt-4 font-serif text-[2.55rem] leading-[0.96] tracking-[-0.05em] text-slate-900 sm:text-[3.25rem]">
          Simple and clear
        </h1>
        <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-slate-600">
          This page explains what {siteName} is responsible for, what happens on external apply
          links, and how limited website data may be used.
        </p>
      </section>

      <section className="fade-up card-surface rounded-[1.6rem] px-5 py-6 sm:px-7" style={{ animationDelay: "80ms" }}>
        <div className="space-y-5">
          {policySections.map((section, index) => (
            <section
              key={section.title}
              className={index === 0 ? "space-y-2" : "space-y-2 border-t border-slate-200/80 pt-5"}
            >
              <h2 className="text-xl font-serif text-slate-900">{section.title}</h2>
              <p className="text-sm leading-7 text-slate-600 sm:text-[0.98rem]">{section.body}</p>
            </section>
          ))}
        </div>
      </section>

      <section className="fade-up soft-note rounded-[1.5rem] px-5 py-5 sm:px-6" style={{ animationDelay: "140ms" }}>
        <h2 className="text-lg font-serif text-slate-900">Questions?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          If you need a correction or have a privacy-related question, email us directly.
        </p>
        <p className="mt-4 break-all text-sm font-semibold text-slate-900">{siteEmail}</p>

        <div className="mt-5">
          <ActionButton href={`mailto:${siteEmail}`} external variant="primary" className="sm:w-auto">
            Email {siteName}
          </ActionButton>
        </div>
      </section>
    </div>
  );
}
