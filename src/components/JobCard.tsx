import type { CSSProperties } from "react";
import Link from "next/link";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import { formatPostedDate, type JobPost } from "@/lib/jobs";

type JobCardProps = {
  job: JobPost;
  style?: CSSProperties;
};

type MetaIconProps = {
  kind: "location" | "experience" | "work";
};

function MetaIcon({ kind }: MetaIconProps) {
  if (kind === "location") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5 text-slate-500">
        <path
          d="M10 17s5-4.6 5-9a5 5 0 1 0-10 0c0 4.4 5 9 5 9Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <circle cx="10" cy="8" r="1.7" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "experience") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5 text-slate-500">
        <path
          d="M6.5 6.5a3.5 3.5 0 1 1 7 0v2.2h1.1a1.4 1.4 0 0 1 1.4 1.4v4.4a1.4 1.4 0 0 1-1.4 1.4H5.4A1.4 1.4 0 0 1 4 14.5v-4.4a1.4 1.4 0 0 1 1.4-1.4h1.1V6.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5 text-slate-500">
      <path
        d="M3 6.5h14v8.2A1.3 1.3 0 0 1 15.7 16H4.3A1.3 1.3 0 0 1 3 14.7V6.5Zm4-2.5h6a1.8 1.8 0 0 1 1.8 1.8v.7H5.2v-.7A1.8 1.8 0 0 1 7 4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function JobCard({ job, style }: JobCardProps) {
  const workMode = job.workMode;
  const employmentType = job.employmentType || job.jobType;
  const experience = job.experience || job.experienceYears || job.experienceLevel;
  const metaItems = [
    job.location
      ? {
          kind: "location" as const,
          label: job.location,
        }
      : null,
    experience
      ? {
          kind: "experience" as const,
          label: experience,
        }
      : null,
    (workMode || employmentType)
      ? {
          kind: "work" as const,
          label: workMode || employmentType || "",
        }
      : null,
  ].filter(Boolean) as Array<{
    kind: MetaIconProps["kind"];
    label: string;
  }>;

  return (
    <article
      className="group fade-up flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/96 px-5 py-6 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.2)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-30px_rgba(15,23,42,0.24)] sm:px-6"
      style={style}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[1.125rem] font-bold leading-[1.35] text-slate-900 transition-colors group-hover:text-teal-900">
            {job.title}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{job.company}</p>
        </div>
        <ApplicationStatusBadge status={job.applicationStatus} className="shrink-0 text-[10px]" />
      </div>

      {metaItems.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-700">
          {metaItems.map((item) => (
            <span
              key={`${item.kind}-${item.label}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5"
            >
              <MetaIcon kind={item.kind} />
              <span className="truncate">{item.label}</span>
            </span>
          ))}
        </div>
      ) : null}

      <p className="mt-4 text-xs font-medium text-slate-500">Posted {formatPostedDate(job.date)}</p>

      <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:flex-wrap">
        <Link
          href={`/jobs/${job.slug}`}
          className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_-24px_rgba(15,118,110,0.3)] transition hover:bg-teal-800"
          aria-label={`View details for ${job.title} at ${job.company}`}
        >
          View details
        </Link>

        {job.applyLink ? (
          <Link
            href={`/api/apply/${job.slug}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900"
            aria-label={`Apply for ${job.title} at ${job.company}`}
          >
            Apply
          </Link>
        ) : null}
      </div>
    </article>
  );
}
