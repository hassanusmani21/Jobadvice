import type { Metadata } from "next";
import Link from "next/link";
import { siteEmail, siteName } from "@/lib/site";

const policySections = [
  {
    id: "nature",
    title: "1. Nature of Our Website",
    paragraphs: [
      `${siteName} is a job information and redirection platform.`,
      "We do not own, manage, or control any job listings published on this website. All job postings are sourced from publicly available information, including official company websites and verified career portals.",
      "We act solely as an informational intermediary to help users discover job opportunities.",
    ],
  },
  {
    id: "authority",
    title: "2. No Recruitment or Hiring Authority",
    paragraphs: [
      "JobAdvice does not conduct recruitment processes, collect resumes or job applications, offer employment, guarantee job placement, represent any company, or charge any fee for job applications.",
      "When you click an Apply link, you are redirected to the official website or career portal of the respective company. Any job application you submit is handled entirely by that company under its own privacy policy and recruitment process.",
      "We are not involved in hiring decisions at any stage.",
    ],
  },
  {
    id: "collection",
    title: "3. Information We Collect",
    paragraphs: [
      "We do not collect or store personal data related to job applications.",
      "We may collect limited non-personal information solely to improve website functionality and user experience.",
    ],
    bullets: [
      "Browser type",
      "Device information",
      "General analytics data",
      "Cookies for website performance",
      "We do not sell, rent, or trade user data.",
    ],
  },
  {
    id: "third-party",
    title: "4. Third Party Websites",
    paragraphs: [
      "Our website contains links to external company websites and career portals. Once you leave our website, you are subject to the privacy policies and terms of the respective third-party website.",
      `${siteName} is not responsible for data collection practices of third-party websites, changes in job descriptions, salary updates, recruitment decisions, or application outcomes.`,
      "Users are advised to verify all job information on the official company website before applying.",
    ],
  },
  {
    id: "accuracy",
    title: "5. Accuracy of Information",
    paragraphs: [
      "While we strive to provide accurate and up-to-date job information, we do not guarantee the completeness, reliability, or accuracy of any listing.",
      "Companies may modify or remove job postings at any time without notice.",
    ],
  },
  {
    id: "liability",
    title: "6. Limitation of Liability",
    paragraphs: [
      `${siteName} shall not be held liable for any loss arising from job applications, miscommunication with employers, job offer rejections, changes in recruitment policies, errors in job listings, or use of this website.`,
      "Use of this website is at your own discretion and risk.",
    ],
  },
  {
    id: "updates",
    title: "7. Policy Updates",
    paragraphs: [
      "We reserve the right to update this Privacy Policy and Disclaimer at any time. Continued use of the website after changes are posted constitutes acceptance of the revised terms.",
    ],
  },
  {
    id: "contact",
    title: "8. Contact Information",
    paragraphs: [
      "For questions regarding this policy, contact us using the details below.",
    ],
  },
];

const quickNotes = [
  "Independent job information platform",
  "No hiring, no placement, no recruitment fees",
  "Apply links redirect to official company portals",
];

export const metadata: Metadata = {
  title: "Privacy Policy & Disclaimer",
  description:
    "Read the JobAdvice privacy policy and disclaimer covering external apply links, third-party websites, and platform limitations.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      <section className="fade-up hero-surface px-5 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-teal-800">
          <span className="rounded-full border border-teal-200 bg-white/70 px-3 py-1">
            Privacy Policy & Disclaimer
          </span>
          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-600">
            Effective Date: March 1, 2026
          </span>
        </div>

        <h1 className="mt-4 max-w-3xl font-serif text-[1.8rem] leading-[1.15] text-slate-900 sm:text-[2.2rem]">
          Clear terms for how {siteName} shares job information and redirects users to official
          apply pages.
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
          Welcome to {siteName}. This website is operated as an independent job information
          platform. By using this website, you agree to the terms outlined below.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {quickNotes.map((item, index) => (
            <div
              key={item}
              className="rounded-2xl border border-white/70 bg-white/85 px-4 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)]"
              style={{ animationDelay: `${80 + index * 70}ms` }}
            >
              <p className="text-sm font-semibold leading-6 text-slate-800">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          {policySections.map((section, index) => (
            <section
              key={section.id}
              className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-7"
              style={{ animationDelay: `${120 + index * 40}ms` }}
            >
              <h2 className="font-serif text-[1.4rem] leading-[1.2] text-slate-900">
                {section.title}
              </h2>

              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {section.bullets ? (
                  <ul className="space-y-2 pl-5 text-slate-700 marker:text-teal-700">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="list-disc leading-7">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.id === "contact" ? (
                  <div className="rounded-2xl border border-teal-100 bg-teal-50/80 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900 sm:text-base">
                      Email:{" "}
                      <a
                        href={`mailto:${siteEmail}`}
                        className="text-teal-800 underline underline-offset-4 hover:text-teal-900"
                      >
                        {siteEmail}
                      </a>
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <aside className="space-y-4">
          <section className="fade-up card-surface rounded-3xl p-5" style={{ animationDelay: "120ms" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Important
            </p>
            <h2 className="mt-3 text-lg font-bold text-slate-900">Before You Apply</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                Verify job details on the official company page.
              </li>
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                Never pay anyone for a job application.
              </li>
              <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                Review the third-party website&apos;s own privacy policy before submitting data.
              </li>
            </ul>
          </section>

          <section className="fade-up rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm leading-6 text-amber-950" style={{ animationDelay: "180ms" }}>
            <p className="font-semibold">Need support?</p>
            <p className="mt-2">
              For general queries, visit the{" "}
              <Link href="/contact" className="font-semibold underline underline-offset-4">
                Contact
              </Link>{" "}
              page.
            </p>
          </section>
        </aside>
      </section>
    </div>
  );
}
