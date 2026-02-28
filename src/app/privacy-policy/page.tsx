import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read how JobAdvice handles basic website usage and external apply links.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <section className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
      <h1 className="font-serif text-[1.5rem] leading-[1.2] text-slate-900">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: February 28, 2026</p>

      <div className="mt-6 space-y-6 text-slate-700">
        <section>
          <h2 className="text-xl font-bold text-slate-900">1. Information</h2>
          <p className="mt-2 leading-7">
            JobAdvice may receive limited technical data from hosting providers and any information
            you share through public contact channels.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">2. Use of Information</h2>
          <p className="mt-2 leading-7">
            This information is used to maintain the website, review content quality, and respond
            to genuine questions or requests.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">3. External Links</h2>
          <p className="mt-2 leading-7">
            Job listings may link to third-party company pages. Once you leave JobAdvice, those
            websites follow their own policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">4. Contact</h2>
          <p className="mt-2 leading-7">
            For privacy-related questions, use the channels listed on the{" "}
            <Link href="/contact" className="font-semibold text-teal-800 hover:text-teal-900">
              Contact
            </Link>{" "}
            page.
          </p>
        </section>
      </div>
    </section>
  );
}
