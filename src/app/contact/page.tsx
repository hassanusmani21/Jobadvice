import type { Metadata } from "next";
import type { ReactNode } from "react";

type ContactLink = {
  label: string;
  href: string;
  cta: string;
  handle: string;
  icon: ReactNode;
};

const contactLinks: ContactLink[] = [
  {
    label: "Telegram",
    href: "https://t.me/jobadvice4u",
    cta: "Open Telegram",
    handle: "@jobadvice4u",
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
    href: "mailto:hassan.usmani.career@gmail.com",
    cta: "Send Email",
    handle: "hassan.usmani.career@gmail.com",
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
      <section className="fade-up page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <span className="page-kicker">Contact</span>
        <h1 className="page-title">Reach JobAdvice</h1>
        <p className="page-copy max-w-3xl">
          For support, feedback, or partnership queries, use any of the official channels below.
        </p>
      </section>

      <section className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {contactLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="interactive-tile group px-5 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-teal-50 group-hover:text-teal-900">
                  {item.icon}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {item.cta}
                </span>
              </div>

              <h2 className="mt-4 text-base font-semibold text-slate-900">{item.label}</h2>
              <p className="mt-1 break-all text-sm text-slate-600">{item.handle}</p>
            </a>
          ))}
        </div>

        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          We will never ask for your password or OTP. If someone does, it&apos;s a scam.
        </p>
      </section>
    </div>
  );
}
