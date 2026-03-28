import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import { siteEmail, siteName } from "@/lib/site";

const policyHighlights = [
  {
    title: "No application fees",
    body: "We do not charge users for job applications or access to listings.",
  },
  {
    title: "External apply flow",
    body: "Applications continue on employer websites or third-party career portals.",
  },
  {
    title: "Limited website data",
    body: "We may use basic non-personal analytics to improve website performance and usability.",
  },
  {
    title: "Policies can change",
    body: "We may revise this page over time, and employers may update listings without notice.",
  },
];

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
    canonical: "/privacy-policy/",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-6">
      <section className="fade-up hero-surface relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div
          aria-hidden
          className="absolute -top-14 right-[-2rem] h-36 w-36 rounded-full bg-white/55 blur-3xl sm:h-48 sm:w-48"
        />
        <div
          aria-hidden
          className="absolute -bottom-10 left-[-3rem] h-28 w-28 rounded-full bg-teal-200/45 blur-3xl sm:h-40 sm:w-40"
        />

        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(19rem,0.88fr)] lg:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="page-kicker">Privacy Policy</span>
                <span className="content-chip">Effective: March 1, 2026</span>
              </div>
              <h1 className="page-title">Privacy policy and disclaimer in plain language.</h1>
              <p className="page-copy max-w-3xl">
                This page explains what {siteName} does, what it does not do, what limited website
                data may be used, and where responsibility shifts to third-party employer sites.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="content-chip content-chip-accent">External links</span>
              <span className="content-chip">No recruitment authority</span>
              <span className="content-chip">Limited analytics</span>
              <span className="content-chip">Contactable by email</span>
            </div>
          </div>

          <aside className="card-surface h-full rounded-[1.4rem] p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              At A Glance
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {policyHighlights.map((item) => (
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

      <div className="grid gap-6 lg:grid-cols-[minmax(15rem,0.75fr)_minmax(0,1.45fr)]">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="fade-up card-surface rounded-3xl p-5" style={{ animationDelay: "80ms" }}>
            <h2 className="text-lg font-bold text-slate-900">Quick Navigation</h2>
            <div className="mt-4 flex flex-wrap gap-2 lg:flex-col">
              {policySections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="content-chip text-sm transition hover:border-teal-200 hover:text-teal-900"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </section>

          <section className="fade-up soft-note px-5 py-5" style={{ animationDelay: "130ms" }}>
            <h2 className="text-lg font-bold text-slate-900">Need Help?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              For policy questions, correction requests, or a privacy-related concern, contact us
              directly.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <ActionButton
                href={`mailto:${siteEmail}`}
                external
                variant="primary"
                className="w-full"
              >
                Email {siteName}
              </ActionButton>
              <ActionButton href="/contact" variant="secondary" className="w-full">
                Open Contact Page
              </ActionButton>
            </div>
          </section>
        </aside>

        <article className="space-y-4">
          {policySections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="fade-up card-surface scroll-mt-28 rounded-3xl px-5 py-6 sm:px-8 sm:py-7"
              style={{ animationDelay: `${90 + index * 35}ms` }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="content-chip content-chip-accent">
                  Section {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-serif text-slate-900 sm:text-2xl">
                {section.title}
              </h2>

              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              {section.bullets ? (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="content-list-card px-4 py-4 text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.id === "contact" ? (
                <div className="soft-note mt-5 px-4 py-4">
                  <p className="text-sm leading-6 text-slate-600">
                    Email:{" "}
                    <a
                      href={`mailto:${siteEmail}`}
                      className="font-medium text-slate-900 underline underline-offset-4"
                    >
                      {siteEmail}
                    </a>
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    For general queries, you can also use the{" "}
                    <Link
                      href="/contact"
                      className="font-medium text-slate-900 underline underline-offset-4"
                    >
                      contact page
                    </Link>
                    .
                  </p>
                </div>
              ) : null}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
