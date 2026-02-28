import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the JobAdvice privacy policy for data usage, analytics, cookies, and external links.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <section className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
      <h1 className="font-serif text-[1.5rem] leading-[1.2] text-slate-900">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: February 23, 2026</p>

      <div className="mt-6 space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-bold text-slate-900">1. Information We Collect</h2>
          <p className="mt-2 leading-7">
            JobAdvice may collect contact details when you email us and limited usage analytics to
            improve website performance and content quality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">2. How We Use Information</h2>
          <p className="mt-2 leading-7">
            Information is used to respond to inquiries, maintain job listing quality, and improve
            site usability. We do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">3. Cookies and Advertising</h2>
          <p className="mt-2 leading-7">
            JobAdvice may use cookies and third-party services, including ad providers, to improve
            content relevance and measure traffic trends.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">4. External Links</h2>
          <p className="mt-2 leading-7">
            Job postings include external application links. Once you leave JobAdvice, the privacy
            practices of those third-party sites apply.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">5. Data Retention</h2>
          <p className="mt-2 leading-7">
            We retain communications only as long as needed to support requests, comply with legal
            obligations, or improve service operations.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">6. Contact</h2>
          <p className="mt-2 leading-7">
            For privacy-related questions, contact: privacy@jobadvice.site
          </p>
        </section>
      </div>
    </section>
  );
}
