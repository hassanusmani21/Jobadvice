import Link from "next/link";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import { formatApplicationWindow, formatPostedDate, type JobPost } from "@/lib/jobs";

type JobCardProps = {
  job: JobPost;
};

export default function JobCard({ job }: JobCardProps) {
  const workMode = job.workMode;
  const employmentType = job.employmentType || job.jobType;
  const experience = job.experience || job.experienceYears || job.experienceLevel;

  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="group fade-up card-surface flex h-full flex-col rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      aria-label={`View details for ${job.title} at ${job.company}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Posted: {formatPostedDate(job.date)}
        </p>
        <ApplicationStatusBadge status={job.applicationStatus} />
      </div>
      <p className="mt-2 text-xs font-medium text-slate-600">
        Apply Window: {formatApplicationWindow(job.applicationStartDate, job.applicationEndDate)}
      </p>
      <h2 className="mt-2 text-xl font-bold text-slate-900 transition-colors group-hover:text-teal-900">
        {job.title}
      </h2>
      <p className="mt-1 text-sm font-semibold text-slate-700">{job.company}</p>
      {job.location ? <p className="mt-1 text-sm text-slate-600">{job.location}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-700">
        {workMode ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1">Mode: {workMode}</span>
        ) : null}
        {employmentType ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1">Type: {employmentType}</span>
        ) : null}
        {experience ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1">Experience: {experience}</span>
        ) : null}
      </div>
      <span className="mt-5 inline-flex w-fit rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 transition-colors group-hover:border-teal-300 group-hover:bg-teal-100">
        View Details
      </span>
    </Link>
  );
}
