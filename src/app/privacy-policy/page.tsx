import type { Metadata } from "next";
import Link from "next/link";
import { siteEmail, siteName } from "@/lib/site";

const policySections = [
  {
    id: "nature",
    title: "1. Nature of Our Website",
    paragraphs: [
      `${siteName} is an independent job information and redirection platform.`,
      "We publish job details based on official company websites, verified career portals, and publicly available recruitment announcements.",
      "We do not own or control the vacancies listed on third-party employer websites.",
    ],
  },
  {
    id: "authority",
    title: "2. No Recruitment or Hiring Authority",
    paragraphs: [
      "We do not conduct recruitment, collect resumes, offer employment, guarantee placement, or charge any fee for job applications.",
      "When you click an Apply link, you continue to the official company website or career portal.",
      "Any application you submit is handled entirely by that company under its own privacy policy and hiring process.",
    ],
  },
  {
    id: "collection",
    title: "3. Information We Collect",
    paragraphs: [
      "We do not collect or store personal data related to job applications.",
      "We may use limited non-personal website data to improve performance and usability.",
      "We do not sell, rent, or trade user data.",
    ],
    bullets: [
      "Browser type",
      "Device information",
      "General analytics data",
      "Cookies used for website performance",
    ],
  },
  {
    id: "third-party",
    title: "4. Third Party Websites",
    paragraphs: [
      "Our website includes links to external company websites and career portals.",
      `Once you leave ${siteName}, the privacy policy and terms of that third-party website will apply.`,
      "We are not responsible for changes in job details, third-party data practices, recruitment decisions, or application outcomes.",
    ],
  },
  {
    id: "accuracy",
    title: "5. Accuracy of Information",
    paragraphs: [
      "We try to keep job information accurate and updated, but we do not guarantee the completeness or reliability of every listing.",
      "Employers may modify or remove job postings at any time without notice.",
    ],
  },
  {
    id: "liability",
    title: "6. Limitation of Liability",
    paragraphs: [
      `${siteName} is not liable for losses, rejected applications, misunderstandings, recruitment changes, or listing errors arising from the use of this website.`,
      "Use of this website is at your own discretion and risk.",
    ],
  },
  {
    id: "updates",
    title: "7. Policy Updates",
    paragraphs: [
      "We may update this Privacy Policy and Disclaimer from time to time. Continued use of the website after changes are published means you accept the revised version.",
    ],
  },
  {
    id: "contact",
    title: "8. Contact Information",
    paragraphs: [
      "If you have a question about this policy or need to report an issue, contact us using the details below.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Privacy Policy & Disclaimer",
  description:
    "Read the JobAdvice privacy policy and disclaimer covering external links, website data, and platform limitations.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-5">
      <section className="fade-up rounded-2xl border border-slate-200/80 bg-white/92 px-5 py-8 sm:px-8 sm:py-10">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Privacy Policy
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Effective date: March 1, 2026
            </span>
          </div>

          <h1 className="mt-4 text-[1.65rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">
            Privacy Policy and Disclaimer
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            This page explains how {siteName} handles website information, external links, and the
            limits of our role as a job information platform.
          </p>
        </div>
      </section>

      <article className="fade-up rounded-2xl border border-slate-200/80 bg-white/92">
        {policySections.map((section, index) => (
          <section
            key={section.id}
            className={`px-5 py-6 sm:px-8 sm:py-7 ${
              index === 0 ? "" : "border-t border-slate-200/80"
            }`}
          >
            <h2 className="text-base font-semibold tracking-[-0.01em] text-slate-900 sm:text-lg">
              {section.title}
            </h2>

            <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {section.bullets ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.id === "contact" ? (
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4">
                <p className="text-sm leading-6 text-slate-600">
                  Email:{" "}
                  <a
                    href={`mailto:${siteEmail}`}
                    className="font-medium text-slate-900 underline underline-offset-4"
                  >
                    {siteEmail}
                  </a>
                </p>
              </div>
            ) : null}
          </section>
        ))}
      </article>

      <section className="fade-up rounded-2xl border border-slate-200/80 bg-slate-50/70 px-5 py-5 sm:px-8">
        <p className="text-sm leading-6 text-slate-600">
          For general queries or corrections, use the{" "}
          <Link href="/contact" className="font-medium text-slate-900 underline underline-offset-4">
            contact page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
