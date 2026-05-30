import type { Metadata } from "next";
import type { ReactNode } from "react";
import ActionButton from "@/components/ActionButton";
import { createPageMetadata } from "@/lib/seo";
import { siteEmail, siteName } from "@/lib/site";

type ContactLink = {
  label: string;
  href: string;
  handle: string;
  description: string;
  icon: ReactNode;
};

const supportNotes = [
  "Share the page link or job title when reporting a problem so the page can be checked quickly.",
  "Email is the best option for corrections, privacy questions, partnerships, and source clarifications.",
];

const contactLinks: ContactLink[] = [
  {
    label: "Telegram",
    href: "https://t.me/jobadvice4u",
    handle: "@jobadvice4u",
    description: "Fast updates and community posts.",
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
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/jobadvices/",
    handle: "jobadvices",
    description: "Professional introductions and collaborations.",
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
    label: "Instagram",
    href: "https://www.instagram.com/jobadvices/",
    handle: "@jobadvices",
    description: "Short updates and announcements.",
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
    label: "YouTube",
    href: "https://youtube.com/@jobadvices?si=vMW4l3TDMBwCIjl5",
    handle: "@jobadvices",
    description: "Video updates and career guides.",
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
    label: "X",
    href: "https://x.com/jobadvices",
    handle: "@jobadvices",
    description: "Quick updates and announcements.",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path
          d="m5.2 5.2 13.6 13.6M18.6 5.4 5.4 18.6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
];

export const metadata: Metadata = createPageMetadata({
  title: "Contact JobAdvice",
  description:
    "Reach JobAdvice for job listing corrections, support, privacy questions, feedback, or partnership queries.",
  path: "/contact/",
  keywords: ["contact JobAdvice", "job listing corrections", "career website support"],
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="fade-up card-surface rounded-[1.75rem] px-5 py-6 sm:px-7 sm:py-7">
        <p className="jobs-directory-kicker">Contact</p>
        <h1 className="mt-4 font-serif text-[2.55rem] leading-[0.96] tracking-[-0.05em] text-slate-900 sm:text-[3.25rem]">
          Get in touch
        </h1>
        <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-slate-600">
          Keep it simple: use email for support, corrections, privacy questions, partnerships, or
          source clarifications. Use social channels for updates and quick follow-ups.
        </p>
      </section>

      <section className="fade-up card-surface rounded-[1.6rem] px-5 py-6 sm:px-7" style={{ animationDelay: "80ms" }}>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-serif text-slate-900">Best contact method</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              For anything important, email is the most reliable channel because it creates a clear
              record of the page, the issue, and the requested correction.
            </p>

            <div className="mt-5 rounded-[1.35rem] border border-slate-200 bg-white/72 px-5 py-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700">Email</p>
              <p className="mt-3 break-all text-lg font-semibold text-slate-900">{siteEmail}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Best for corrections, support, privacy concerns, and business inquiries.
              </p>
              <div className="mt-5">
                <ActionButton
                  href={`mailto:${siteEmail}`}
                  external
                  variant="primary"
                  className="sm:w-auto"
                >
                  Email {siteName}
                </ActionButton>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-2xl font-serif text-slate-900">Other channels</h2>
            <div className="mt-4 space-y-3">
              {contactLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="interactive-tile flex items-start gap-4 rounded-2xl px-4 py-4"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.handle}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="fade-up soft-note rounded-[1.5rem] px-5 py-5 sm:px-6" style={{ animationDelay: "140ms" }}>
        <h2 className="text-lg font-serif text-slate-900">Before you send a message</h2>
        <div className="mt-3 space-y-2">
          {supportNotes.map((item) => (
            <p key={item} className="text-sm leading-6 text-slate-600">
              {item}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
