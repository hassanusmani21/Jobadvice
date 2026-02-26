import type { JobApplicationStatus } from "@/lib/jobs";

type ApplicationStatusBadgeProps = {
  status: JobApplicationStatus;
  className?: string;
};

const badgeStyleByState: Record<JobApplicationStatus["state"], string> = {
  upcoming: "border-sky-200 bg-sky-50 text-sky-800",
  open: "border-teal-200 bg-teal-50 text-teal-900",
  expiring_soon: "border-amber-200 bg-amber-100 text-amber-900",
  expires_today: "border-orange-200 bg-orange-100 text-orange-900",
  expired: "border-rose-200 bg-rose-100 text-rose-900",
  no_expiry: "border-slate-200 bg-slate-100 text-slate-700",
};

export default function ApplicationStatusBadge({
  status,
  className,
}: ApplicationStatusBadgeProps) {
  const badgeClassName = badgeStyleByState[status.state];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClassName} ${
        className || ""
      }`.trim()}
    >
      {status.label}
    </span>
  );
}
