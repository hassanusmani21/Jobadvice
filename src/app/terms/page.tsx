import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import { createPageMetadata } from "@/lib/seo";
import { siteEmail, siteName } from "@/lib/site";

const termsSections = [
  {
    title: "Independent Information Platform",
    body: `${siteName} publishes job openings, internships, resume tools, and career guidance for informational purposes. We are not an employer, recruiter, staffing agency, or placement service.`,
  },
  {
    title: "No Paid Access or Placement Guarantee",
    body: "We do not charge users to browse jobs, read articles, use the resume builder, or access apply links. We also do not guarantee interviews, offers, salaries, joining dates, or employer responses.",
  },
  {
    title: "External Apply Links",
    body: "Apply buttons may redirect to employer websites, applicant tracking systems, or public job portals. Once you leave JobAdvice, the external website controls its own terms, privacy practices, deadlines, eligibility rules, and application process.",
  },
  {
    title: "Content Accuracy",
    body: "We try to keep listings clear and current, but employers can change, pause, or remove roles without notice. Always verify the role, employer, salary, eligibility, deadline, and location on the official source before applying.",
  },
  {
    title: "User Responsibility",
    body: "You are responsible for checking job authenticity, avoiding payment requests, protecting personal information, and applying only through trusted official channels.",
  },
  {
    title: "Advertising and Affiliate Disclosure",
    body: "The site may display advertising or use measurement tools. Advertising does not change our editorial goal of publishing useful job and career information for readers.",
  },
];

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Use",
  description:
    "Read JobAdvice terms covering job listings, external apply links, no-placement guarantee, user responsibility, and advertising disclosures.",
  path: "/terms/",
  keywords: ["JobAdvice terms", "job listing disclaimer", "career website terms"],
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="fade-up card-surface rounded-[1.75rem] px-5 py-6 sm:px-7 sm:py-7">
        <p className="jobs-directory-kicker">Terms</p>
        <h1 className="mt-4 font-serif text-[2.55rem] leading-[0.96] tracking-[-0.05em] text-slate-900 sm:text-[3.25rem]">
          Terms of Use
        </h1>
        <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-slate-600">
          These terms explain how to use {siteName}, what we provide, and what you should verify
          before applying to any role.
        </p>
      </section>

      <section className="fade-up card-surface rounded-[1.6rem] px-5 py-6 sm:px-7" style={{ animationDelay: "80ms" }}>
        <div className="space-y-5">
          {termsSections.map((section, index) => (
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
        <h2 className="text-lg font-serif text-slate-900">Questions or Corrections</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          For content corrections, takedown requests, or policy questions, contact us by email or
          review the{" "}
          <Link href="/privacy-policy" className="font-medium text-slate-900 underline underline-offset-4">
            privacy policy
          </Link>
          .
        </p>
        <div className="mt-5">
          <ActionButton href={`mailto:${siteEmail}`} external variant="primary" className="sm:w-auto">
            Email {siteName}
          </ActionButton>
        </div>
      </section>
    </div>
  );
}
