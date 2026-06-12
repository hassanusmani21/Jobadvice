import type { Metadata } from "next";
import ResumeBuilderClient from "@/components/ResumeBuilderClient";
import { createPageMetadata } from "@/lib/seo";
import {
  organizationId,
  siteUrl,
} from "@/lib/site";

const resumeBuilderFaqs = [
  {
    question: "Is the resume builder free?",
    answer: "Yes — use it in your browser to edit, preview, and export PDFs at no cost.",
  },
  {
    question: "What is an ATS-friendly resume?",
    answer: "A resume with simple headings, single-column layout, and clear dates/labels so applicant tracking systems can parse it reliably.",
  },
  {
    question: "Does it submit applications for me?",
    answer: "No — it helps you prepare a clean resume. Apply through the employer or source-checked job links on JobAdvice.",
  },
];

export const metadata: Metadata = createPageMetadata({
  title: "Free ATS Resume Builder for Freshers",
  description:
    "Use the JobAdvice free resume builder to create an ATS-friendly resume for freshers, internships, entry-level jobs, and tech roles with clean sections and PDF export.",
  path: "/resume-builder",
  keywords: [
    "free resume builder",
    "ATS resume builder",
    "resume builder for freshers",
    "online resume builder India",
    "fresher resume format",
  ],
});

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "JobAdvice Free ATS Resume Builder",
  url: `${siteUrl}/resume-builder/`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires a modern web browser.",
  description:
    "A free web-based resume builder for freshers and early-career job seekers with ATS-friendly templates, live preview, keyword checks, and PDF export.",
  publisher: {
    "@id": organizationId,
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "ATS-friendly resume templates",
    "Fresher-focused project and education sections",
    "Live resume preview",
    "Keyword coverage checks",
    "Browser-based PDF export",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: resumeBuilderFaqs.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Resume Builder",
      item: `${siteUrl}/resume-builder/`,
    },
  ],
};

const resumeBuilderFeatures = [
  "ATS-safe structure",
  "Freshers and internships",
  "Projects-first format",
  "Keyword review",
  "Print-ready PDF",
  "Private browser editing",
];

const resumeBuilderQuickTips = [
  "Match keywords honestly and place them in relevant sections.",
  "Keep bullets outcome-focused and easy to scan.",
  "Export PDF after final edits and do one quick visual check.",
];

export default function ResumeBuilderPage() {
  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            softwareApplicationSchema,
            faqSchema,
            breadcrumbSchema,
          ]),
        }}
      />

      <ResumeBuilderClient />

      <section className="resume-builder-support card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-7">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="font-serif text-2xl leading-tight text-slate-900 sm:text-[2rem]">
                Keep the final resume focused and recruiter-friendly.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                Use simple headings, short proof-based bullets, and role-specific skills so the preview and exported PDF stay clean and easy to scan.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
              {resumeBuilderFeatures.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {resumeBuilderQuickTips.map((tip) => (
              <div
                key={tip}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm leading-6 text-slate-600"
              >
                {tip}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
