import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how JobAdvice publishes job updates and helps job seekers find reliable opportunities.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <section className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
      <h1 className="font-serif text-[1.5rem] leading-[1.2] text-slate-900">About JobAdvice</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
        JobAdvice is a professional job update website focused on clear, SEO-friendly job
        listings. Every post includes the role, company, location, salary information when
        available, required skills, and a direct apply link.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-white/75 p-5">
          <h2 className="text-lg font-bold text-slate-900">Admin Controlled</h2>
          <p className="mt-2 text-sm text-slate-600">
            Jobs are managed through the built-in Netlify CMS admin panel at <code>/admin</code>.
          </p>
        </article>
        <article className="rounded-2xl bg-white/75 p-5">
          <h2 className="text-lg font-bold text-slate-900">SEO Ready</h2>
          <p className="mt-2 text-sm text-slate-600">
            Job pages use clean URLs, dynamic metadata, and an auto-generated sitemap.
          </p>
        </article>
        <article className="rounded-2xl bg-white/75 p-5">
          <h2 className="text-lg font-bold text-slate-900">No Code Publishing</h2>
          <p className="mt-2 text-sm text-slate-600">
            New job posts can be published from CMS without editing source code.
          </p>
        </article>
      </div>
    </section>
  );
}
