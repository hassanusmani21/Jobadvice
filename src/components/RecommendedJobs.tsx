import Link from "@/components/AppLink";
import type { JobPost } from "@/lib/jobs";

type RecommendedJobsProps = {
  jobs: JobPost[];
};

const getCompanyInitials = (company: string) => {
  const tokens = String(company || "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return "JA";
  }

  return tokens
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || "")
    .join("");
};

export default function RecommendedJobs({ jobs }: RecommendedJobsProps) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <aside className="job-related-surface fade-up rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,251,252,0.96)_58%,rgba(243,247,246,0.94)_100%)] p-5 shadow-[0_18px_42px_-36px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.92)] lg:sticky lg:top-6">
      <h2 className="text-[1.35rem] font-semibold leading-tight text-slate-900">Related Jobs</h2>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">
        Explore similar roles matched by domain, skills, and job profile.
      </p>

      <ul className="mt-5 space-y-3">
        {jobs.map((job) => (
          <li key={job.slug}>
            <Link
              href={`/jobs/${job.slug}`}
              className="job-related-item content-list-card group rounded-2xl px-4 py-3"
            >
              <p className="text-[0.96rem] font-semibold leading-6 text-slate-900 transition-colors group-hover:text-teal-900">
                {job.title}
              </p>
              <div className="mt-2 flex items-center gap-2.5 text-xs text-slate-500">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(186,230,253,0.95),rgba(153,246,228,0.92))] text-[11px] font-semibold tracking-wide text-teal-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  {getCompanyInitials(job.company)}
                </span>
                <span className="font-medium uppercase tracking-[0.08em] text-slate-600">
                  {job.company}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
