import Link from "next/link";
import type { JobPost } from "@/lib/jobs";

type RecommendedJobsProps = {
  jobs: JobPost[];
};

export default function RecommendedJobs({ jobs }: RecommendedJobsProps) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <aside className="fade-up card-surface rounded-3xl p-5 lg:sticky lg:top-6">
      <h2 className="text-lg font-bold text-slate-900">Recommended Jobs</h2>
      <p className="mt-1 text-sm text-slate-600">
        Explore other roles that match similar skills.
      </p>

      <ul className="mt-4 space-y-3">
        {jobs.map((job) => (
          <li key={job.slug}>
            <Link
              href={`/jobs/${job.slug}`}
              className="block rounded-xl border border-slate-200 bg-white/80 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/80"
            >
              <p className="text-sm font-semibold text-slate-900">{job.title}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                {job.company}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
