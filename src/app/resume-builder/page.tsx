import type { Metadata } from "next";
import Link from "@/components/AppLink";
import ResumeBuilderClient from "@/components/ResumeBuilderClient";
import { createPageMetadata } from "@/lib/seo";
import {
  organizationId,
  siteUrl,
} from "@/lib/site";

const resumeBuilderFaqs = [
  {
    question: "Is the JobAdvice resume builder free?",
    answer:
      "Yes. The JobAdvice free resume builder can be used in the browser without payment. You can write your resume, switch ATS-friendly layouts, review keyword coverage, and print or save the final resume as a PDF from your device.",
  },
  {
    question: "What makes this an ATS resume builder?",
    answer:
      "The builder keeps the resume structure clean, uses readable section labels, supports single-column layouts, and encourages role-specific keywords. These choices help applicant tracking systems read names, skills, education, projects, and work history with fewer parsing issues.",
  },
  {
    question: "Can freshers use this resume builder?",
    answer:
      "Yes. It includes a fresher-focused layout that highlights education, projects, internships, certifications, and technical skills before long work history. This makes it useful for students, fresh graduates, and early-career applicants.",
  },
  {
    question: "How should I choose keywords for my resume?",
    answer:
      "Read the job description carefully, note repeated role skills, tools, responsibilities, and domain words, then add only the keywords you can honestly support with projects, education, internships, or work experience.",
  },
  {
    question: "Does this tool submit my resume to companies?",
    answer:
      "No. The builder helps you prepare an application-ready resume. You still apply through the company career page, recruiter form, or trusted job link listed on JobAdvice.",
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

const resumeBuilderUseCases = [
  {
    title: "Students and freshers",
    copy:
      "Lead with education, projects, coursework, certifications, hackathons, internships, and measurable academic work when full-time experience is limited.",
  },
  {
    title: "Internship applications",
    copy:
      "Keep the resume focused on role fit by connecting project bullets, technical skills, and availability to the internship description.",
  },
  {
    title: "Entry-level tech roles",
    copy:
      "Match the resume to developer, analyst, support, testing, operations, and data roles with clear tools, responsibilities, and outcomes.",
  },
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

      <section className="card-surface rounded-3xl px-5 py-7 sm:px-8 sm:py-9">
        <div className="mx-auto max-w-4xl">
          <p className="page-kicker">Resume Builder Guide</p>
          <h2 className="mt-3 font-serif text-2xl leading-tight text-slate-900 sm:text-3xl">
            Free resume builder for ATS-ready fresher applications
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-700">
            A strong resume is not just a designed document. It is a clear,
            scannable argument for why you fit a specific role. The JobAdvice
            free resume builder is built for students, freshers, interns, and
            early-career professionals who need a practical resume before
            applying to verified jobs. It gives you a structured editor, clean
            resume sections, live preview, and browser-based PDF export so you
            can move from a blank page to an application-ready document without
            juggling many tools.
          </p>
          <p className="mt-4 text-base leading-8 text-slate-700">
            The main goal is ATS readability. Many companies use applicant
            tracking systems to parse resumes before a recruiter reads them.
            A visually heavy resume can look impressive but still lose important
            details when software reads it. This ATS resume builder keeps the
            layout simple, uses predictable headings, avoids confusing columns
            in the safest templates, and helps you place keywords in sections
            that hiring systems usually understand: headline, summary, skills,
            education, projects, certifications, and experience.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
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
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {resumeBuilderUseCases.map((item) => (
          <article key={item.title} className="card-surface rounded-3xl p-5">
            <h2 className="font-serif text-xl text-slate-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{item.copy}</p>
          </article>
        ))}
      </section>

      <section className="card-surface rounded-3xl px-5 py-7 sm:px-8 sm:py-9">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <div className="space-y-5 text-base leading-8 text-slate-700">
            <h2 className="font-serif text-2xl leading-tight text-slate-900">
              How to write a resume that matches job descriptions
            </h2>
            <p>
              Start with the job description, not with a generic biography.
              Copy the role title into your thinking, then identify the skills,
              tools, duties, and outcomes that appear repeatedly. For a frontend
              role, that might include React, TypeScript, responsive UI,
              accessibility, API integration, and performance. For an analyst
              role, it might include Excel, SQL, dashboards, reporting,
              stakeholder communication, and business metrics. Your resume
              should reflect the language of the target role while staying
              honest about your real experience.
            </p>
            <p>
              Freshers often struggle because they feel they have no experience.
              A resume builder for freshers should treat projects, internships,
              coursework, volunteering, hackathons, and certifications as useful
              evidence. A project bullet becomes stronger when it explains what
              you built, which tools you used, what problem you solved, and what
              improved because of your work. Instead of writing only
              &quot;created a website,&quot; write about the stack, the feature,
              the user flow, the data handled, or the result. Recruiters do not
              need inflated claims; they need credible proof that you can learn,
              build, communicate, and complete work.
            </p>
            <p>
              Keep the top of the resume focused. Your name, headline, location,
              phone, email, portfolio, and LinkedIn should be easy to find. The
              summary should be short and role-specific, not a long personal
              statement. Skills should be grouped around what employers search
              for, such as programming languages, frameworks, databases, cloud
              tools, analytics tools, design tools, communication skills, and
              domain knowledge. If a skill is not supported anywhere else in the
              resume, either add proof or remove it. This is how you improve
              trust and reduce interview risk.
            </p>
            <p>
              For ATS systems, clarity wins. Use common section names such as
              Experience, Education, Projects, Skills, Certifications, and
              Summary. Avoid placing core information only inside icons,
              background images, unusual tables, or decorative sidebars. Use
              plain dates, simple bullets, and consistent formatting. The safest
              resume is not boring; it is easy for both software and people to
              understand. After exporting your PDF, open it and check whether
              text selection works properly. If you can select the words in the
              PDF, an ATS is more likely to parse them correctly.
            </p>
            <p>
              The JobAdvice builder is designed for action. You can prepare a
              resume for a job listing, review your keywords, save the PDF, and
              then apply through a trusted company link. For best results, create
              a fresh version for every serious application. Keep the structure
              stable, but adjust the headline, summary, skills, and top bullets
              to reflect the role. A resume for a backend internship should not
              read exactly like a resume for a business analyst opening. Small
              targeted edits often matter more than a complete redesign.
            </p>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white/80 p-5">
            <h2 className="font-serif text-xl text-slate-900">
              Resume checklist before applying
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>Use one target role headline instead of a vague title.</li>
              <li>Include the tools and skills repeated in the job post.</li>
              <li>Turn project work into outcome-focused bullet points.</li>
              <li>Keep contact links readable and recruiter-friendly.</li>
              <li>Export a PDF and check text selection before submitting.</li>
              <li>Use verified openings from the JobAdvice jobs directory.</li>
            </ul>
            <div className="mt-6 grid gap-2">
              <Link
                href="/jobs/"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Browse verified jobs
              </Link>
              <Link
                href="/blog/"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:border-slate-300"
              >
                Read career guides
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="card-surface rounded-3xl px-5 py-7 sm:px-8 sm:py-9">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-serif text-2xl text-slate-900">
            Frequently asked questions
          </h2>
          <div className="mt-5 divide-y divide-slate-200">
            {resumeBuilderFaqs.map((item) => (
              <section key={item.question} className="py-5 first:pt-0 last:pb-0">
                <h3 className="text-base font-semibold text-slate-900">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {item.answer}
                </p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
