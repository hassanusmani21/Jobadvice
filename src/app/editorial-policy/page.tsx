import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import { createPageMetadata } from "@/lib/seo";
import {
  siteEmail,
  siteName,
  siteVerifiedPublisherName,
  siteVerifiedPublisherRole,
} from "@/lib/site";

const sourcingStandards = [
  "Official employer career pages, company-hosted forms, and trusted application portals are preferred over reposted social media text.",
  "Every public job page should help readers verify the role, company, location, eligibility, application window, and source before they apply.",
  "Listings that do not have enough public detail are either held back, marked carefully, or excluded from public discovery pages.",
];

const editorialWorkflow = [
  "We turn long or messy job descriptions into structured summaries so the useful details are easier to scan.",
  "We add reader-focused context such as who should apply, resume focus areas, verification notes, and before-apply checks.",
  "We avoid claiming that a role is guaranteed, exclusive, or officially partnered unless that relationship is clearly documented.",
  "We update, remove, or correct content when a source changes, a reader reports an issue, or a listing is no longer useful.",
];

const readerSafety = [
  "Do not pay anyone for interviews, referrals, joining letters, training promises, or application access.",
  "Confirm the apply URL, employer name, deadline, location, and salary claims on the external source before sharing personal information.",
  "Be cautious with unofficial forms that ask for sensitive documents before a clear hiring process is explained.",
];

export const metadata: Metadata = createPageMetadata({
  title: "Editorial Policy",
  description:
    "Read the JobAdvice editorial policy for job sourcing, content review, corrections, reader safety, and advertising independence.",
  path: "/editorial-policy/",
  keywords: ["JobAdvice editorial policy", "job sourcing policy", "content review policy"],
});

export default function EditorialPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="fade-up card-surface rounded-[1.75rem] px-5 py-6 sm:px-7 sm:py-7">
        <p className="jobs-directory-kicker">Editorial Policy</p>
        <h1 className="mt-4 font-serif text-[2.55rem] leading-[0.96] tracking-[-0.05em] text-slate-900 sm:text-[3.25rem]">
          How {siteName} publishes useful job information
        </h1>
        <p className="mt-4 max-w-3xl text-[0.98rem] leading-7 text-slate-600">
          {siteName} exists to make job discovery easier for students, freshers, and early-career
          professionals. Our editorial standard is simple: every public page should help a real
          reader make a safer, faster, and better-informed career decision.
        </p>
      </section>

      <section className="fade-up card-surface rounded-[1.6rem] px-5 py-6 sm:px-7" style={{ animationDelay: "80ms" }}>
        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-serif text-slate-900">Sourcing standards</h2>
            <div className="mt-4 space-y-3">
              {sourcingStandards.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white/72 px-4 py-4">
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-2xl font-serif text-slate-900">Review and updates</h2>
            <div className="mt-4 space-y-3">
              {editorialWorkflow.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white/72 px-4 py-4">
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-2xl font-serif text-slate-900">Reader safety checks</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {readerSafety.map((item) => (
                <div key={item} className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-4">
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-2xl font-serif text-slate-900">Advertising independence</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              Advertising, if shown, does not control which jobs or articles we publish. JobAdvice
              does not sell placement, paid job access, or guaranteed selection. Editorial pages are
              written for readers first, and advertising disclosures are covered in the{" "}
              <Link href="/privacy-policy" className="font-medium text-slate-900 underline underline-offset-4">
                privacy policy
              </Link>
              .
            </p>
          </section>

          <section className="border-t border-slate-200/80 pt-6">
            <h2 className="text-2xl font-serif text-slate-900">Accountability</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              {siteName} is maintained by {siteVerifiedPublisherName}, {siteVerifiedPublisherRole}.
              Corrections, takedown requests, and source issues can be sent to{" "}
              <span className="font-semibold text-slate-900">{siteEmail}</span>.
            </p>
          </section>
        </div>
      </section>

      <section className="fade-up soft-note rounded-[1.5rem] px-5 py-5 sm:px-6" style={{ animationDelay: "140ms" }}>
        <h2 className="text-lg font-serif text-slate-900">Need to report a problem?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Include the page URL, what looks wrong, and the source detail that should be checked.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <ActionButton href={`mailto:${siteEmail}`} external variant="primary" className="sm:w-auto">
            Email {siteName}
          </ActionButton>
          <ActionButton href="/how-we-verify-jobs" variant="secondary" className="sm:w-auto">
            How We Verify Jobs
          </ActionButton>
        </div>
      </section>
    </div>
  );
}
