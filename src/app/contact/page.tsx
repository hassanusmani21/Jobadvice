import type { Metadata } from "next";
import type { ReactNode } from "react";
import ActionButton from "@/components/ActionButton";
import { siteEmail, siteName } from "@/lib/site";

type ContactLink = {
  label: string;
  href: string;
  cta: string;
  handle: string;
  description: string;
  accentClassName: string;
  icon: ReactNode;
};

const contactReasons = [
  "Corrections or broken application links",
  "Partnership or business inquiries",
  "Questions about published posts and updates",
  "Reports about scams misusing the JobAdvice name",
];

const contactLinks: ContactLink[] = [
  {
    label: "Telegram",
    href: "https://t.me/jobadvice4u",
    cta: "Open Telegram",
    handle: "@jobadvice4u",
    description: "Best for following broadcast updates and reaching the community channel quickly.",
    accentClassName: "bg-teal-50 text-teal-900",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="m20.2 5.1-2.5 13.2c-.16.82-.62 1.02-1.26.64l-4.26-3.15-2.06 1.99c-.23.23-.43.43-.87.43l.3-4.35 7.92-7.15c.34-.3-.08-.47-.53-.17l-9.8 6.17-4.22-1.32c-.92-.28-.94-.92.2-1.36l16.5-6.36c.76-.28 1.42.18 1.18 1.26Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.45"
        />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/jobsadvice.in?utm_source=qr&igsh=MTM0eGhud3VtNGNvcw==",
    cta: "Visit Instagram",
    handle: "@hassanusmanix",
    description: "Useful for short-form updates, story-based announcements, and platform visibility.",
    accentClassName: "bg-rose-100 text-slate-900",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <rect
          x="3.75"
          y="3.75"
          width="16.5"
          height="16.5"
          rx="4.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <circle cx="12" cy="12" r="3.75" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/hassan-usmani21",
    cta: "Open LinkedIn",
    handle: "hassan-usmani21",
    description: "A better fit for professional introductions, collaborations, and credibility checks.",
    accentClassName: "bg-sky-100 text-slate-900",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M7.25 8.25v8.5M7.25 6.1a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7ZM11.5 16.75v-4.6a2.15 2.15 0 0 1 4.3 0v4.6M11.5 10.6v6.15"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
        <rect
          x="3.75"
          y="3.75"
          width="16.5"
          height="16.5"
          rx="3.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@JobAdvice4u",
    cta: "Open YouTube",
    handle: "@JobAdvice4u",
    description: "Good for longer explainers, hiring breakdowns, and career-focused video content.",
    accentClassName: "bg-rose-100 text-slate-900",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M20 8.9c-.16-1.2-.96-2.08-2.03-2.24C16.7 6.45 14.9 6.3 12 6.3s-4.7.15-5.97.36C4.96 6.82 4.16 7.7 4 8.9c-.17 1.26-.17 2.94 0 4.2.16 1.2.96 2.08 2.03 2.24 1.27.21 3.07.36 5.97.36s4.7-.15 5.97-.36c1.07-.16 1.87-1.04 2.03-2.24.17-1.26.17-2.94 0-4.2Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
        <path d="m10.25 9.55 4.5 2.45-4.5 2.45v-4.9Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: `mailto:${siteEmail}`,
    cta: "Send Email",
    handle: siteEmail,
    description: "Best for corrections, serious support questions, partnerships, and privacy-related requests.",
    accentClassName: "bg-amber-100 text-slate-900",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="M4.75 7.25h14.5A1.75 1.75 0 0 1 21 9v6a1.75 1.75 0 0 1-1.75 1.75H4.75A1.75 1.75 0 0 1 3 15V9a1.75 1.75 0 0 1 1.75-1.75Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="m4 8 8 5 8-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
];

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach JobAdvice for support, feedback, or partnership queries.",
  alternates: {
    canonical: "/contact/",
  },
};

export default function ContactPage() {
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

        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-stretch">
          <div className="flex flex-col justify-between">
            <div>
              <span className="page-kicker">Contact {siteName}</span>
              <h1 className="page-title">Reach us through the channel that fits your question.</h1>
              <p className="page-copy max-w-3xl">
                Use email for detailed support or corrections, and use our social channels to stay
                close to daily updates, announcements, and community posts.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="content-chip content-chip-accent">Corrections</span>
              <span className="content-chip">Partnerships</span>
              <span className="content-chip">Scam reports</span>
              <span className="content-chip">General feedback</span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ActionButton
                href={`mailto:${siteEmail}`}
                external
                variant="primary"
                className="sm:w-auto"
              >
                Email Us
              </ActionButton>
              <ActionButton href="/privacy-policy" variant="secondary" className="sm:w-auto">
                Privacy Policy
              </ActionButton>
            </div>
          </div>

          <aside className="card-surface h-full rounded-[1.4rem] p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Best Reasons To Reach Out
            </p>
            <div className="mt-4 grid gap-3">
              {contactReasons.map((item, index) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white/75 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-900">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-900">{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {contactLinks.map((item, index) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="interactive-tile group fade-up flex h-full flex-col px-5 py-5"
            style={{ animationDelay: `${70 + index * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.accentClassName}`}
              >
                {item.icon}
              </span>
              <span className="content-chip text-[11px]">{item.cta}</span>
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>

            <div className="mt-auto pt-5">
              <p className="break-all text-sm font-medium text-slate-900">{item.handle}</p>
              <span className="inline-action-label mt-3 w-fit">Open Channel</span>
            </div>
          </a>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8" style={{ animationDelay: "120ms" }}>
          <h2 className="text-2xl font-serif text-slate-900">What To Contact Us About</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
            The fastest way to get a useful response is to be clear about the page, issue, or
            request you are referring to.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {contactReasons.map((item) => (
              <div key={item} className="content-list-card px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="fade-up soft-note px-5 py-6 sm:px-8 sm:py-8" style={{ animationDelay: "170ms" }}>
          <h2 className="text-2xl font-serif text-slate-900">Stay Safe</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
            <p>
              {siteName} will never ask for your password, OTP, or payment to access job
              information. If someone does, treat it as a scam.
            </p>
            <p>
              For privacy-related questions, policy clarifications, or anything sensitive, use{" "}
              <a
                href={`mailto:${siteEmail}`}
                className="font-medium text-slate-900 underline underline-offset-4"
              >
                {siteEmail}
              </a>
              .
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ActionButton href="/about" variant="secondary" className="sm:w-auto">
              About {siteName}
            </ActionButton>
            <ActionButton href="/privacy-policy" variant="muted" className="sm:w-auto">
              Read Privacy Policy
            </ActionButton>
          </div>
        </aside>
      </section>
    </div>
  );
}
