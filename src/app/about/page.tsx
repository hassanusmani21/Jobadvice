import type { Metadata } from "next";
import Link from "@/components/AppLink";
import { siteName } from "@/lib/site";

const aboutSections: Array<{
  title: string;
  paragraphs: string[];
  bullets?: string[];
  id?: string;
}> = [
  {
    title: "What JobAdvice Is",
    paragraphs: [
      `${siteName} is an independent job information website for students, fresh graduates, and early-career professionals in India.`,
      "We publish private job openings, internship opportunities, government job updates, and career guidance in a clear and readable format.",
    ],
  },
  {
    title: "What We Publish",
    paragraphs: [
      "Job posts on this website are based on official company websites, verified career portals, and publicly available recruitment announcements.",
      "Where relevant, we include eligibility details, location, salary information, selection process, and direct application links.",
    ],
    bullets: [
      "Private company job openings",
      "Government job notifications",
      "Internship opportunities",
      "Fresher hiring updates",
      "Career guidance and preparation tips",
    ],
  },
  {
    title: "Our Role",
    paragraphs: [
      `${siteName} does not conduct recruitment, collect resumes, or guarantee job placement.`,
      "We are not affiliated with hiring companies unless that relationship is clearly stated.",
      "When you click an Apply link, you are redirected to the official company website or career portal where the application process takes place.",
    ],
  },
  {
    title: "Important Note",
    paragraphs: [
      "We aim to keep information accurate and updated, but users should always verify the final details on the official company website before applying.",
      `${siteName} never asks for payment for job information or job applications.`,
    ],
  },
  {
    id: "how-we-verify-information",
    title: "How We Verify Information",
    paragraphs: [
      "For job posts, internships, and career guides, we review official company career pages, university websites, government notices, and source material before publishing when those sources are available.",
      "Each article shows published and updated dates, and we revise pages when source information changes or readers report an issue.",
    ],
    bullets: [
      "Official company websites and career portals",
      "University, scholarship, and government notices",
      "Visible publish and update dates on article pages",
    ],
  },
];

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn what JobAdvice publishes, how job information is sourced, and what role the platform plays.",
  alternates: {
    canonical: "/about/",
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-5">
      <section className="fade-up rounded-2xl border border-slate-200/80 bg-white/92 px-5 py-8 sm:px-8 sm:py-10">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-slate-500">
            About {siteName}
          </span>

          <h1 className="mt-4 text-[1.65rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">
            Simple job information for freshers and early-career professionals.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            {siteName} shares job updates and career information in a clean format that is easier
            to read and verify.
          </p>
        </div>
      </section>

      <article className="fade-up rounded-2xl border border-slate-200/80 bg-white/92">
        {aboutSections.map((section, index) => (
          <section
            key={section.title}
            id={section.id}
            className={`px-5 py-6 sm:px-8 sm:py-7 ${
              index === 0 ? "" : "border-t border-slate-200/80"
            }`}
          >
            <h2 className="text-base font-semibold tracking-[-0.01em] text-slate-900 sm:text-lg">
              {section.title}
            </h2>

            <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {section.bullets ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </article>

      <section className="fade-up rounded-2xl border border-slate-200/80 bg-slate-50/70 px-5 py-5 sm:px-8">
        <p className="text-sm leading-6 text-slate-600">
          For corrections, partnerships, or general questions, visit the{" "}
          <Link href="/contact" className="font-medium text-slate-900 underline underline-offset-4">
            contact page
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
