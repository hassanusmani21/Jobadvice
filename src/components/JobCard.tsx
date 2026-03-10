import type { CSSProperties } from "react";
import Link from "@/components/AppLink";
import { formatPostedDate, type JobPost } from "@/lib/jobs";

type JobCardProps = {
  job: JobPost;
  style?: CSSProperties;
};

type HeaderIconProps = {
  kind: "briefcase" | "code" | "internship" | "ai" | "date";
  className?: string;
};

function HeaderIcon({ kind, className = "h-4 w-4" }: HeaderIconProps) {
  if (kind === "date") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`text-amber-700 ${className}`}>
        <path
          d="M5.2 3.5v2.2m9.6-2.2v2.2M4.4 6.2h11.2A1.4 1.4 0 0 1 17 7.6v7A1.4 1.4 0 0 1 15.6 16H4.4A1.4 1.4 0 0 1 3 14.6v-7a1.4 1.4 0 0 1 1.4-1.4Zm0 3.1H17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (kind === "code") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-teal-800`}>
        <path
          d="m7.2 6.4-3.4 3.6 3.4 3.6m5.6-7.2 3.4 3.6-3.4 3.6M11.2 4.8 8.8 15.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (kind === "internship") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-teal-800`}>
        <path
          d="m3.4 7.6 6.6-3.1 6.6 3.1-6.6 3.1-6.6-3.1Zm2.4 1.8V12c0 1.6 2 2.8 4.2 2.8S14.2 13.6 14.2 12V9.4m2.4.5v3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  if (kind === "ai") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-teal-800`}>
        <path
          d="M10 3.4v2.1m0 9v2.1M4.7 5.4l1.5 1.5m7.6 7.6 1.5 1.5m0-10.6-1.5 1.5m-7.6 7.6-1.5 1.5M3.4 10h2.1m9 0h2.1M10 6.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`text-teal-800 ${className}`}>
      <path
        d="M4 6.8h12v7.4A1.8 1.8 0 0 1 14.2 16H5.8A1.8 1.8 0 0 1 4 14.2V6.8Zm3-2.8h6a1.8 1.8 0 0 1 1.8 1.8v1H5.2v-1A1.8 1.8 0 0 1 7 4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function LocationIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-slate-500`}>
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

function ExperienceIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-slate-500`}>
      <path
        d="M10 5.1v5l3.2 1.8M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function WorkModeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-slate-500`}>
      <path
        d="M4.2 6.6h11.6a1.2 1.2 0 0 1 1.2 1.2v6a1.2 1.2 0 0 1-1.2 1.2H4.2A1.2 1.2 0 0 1 3 13.8v-6a1.2 1.2 0 0 1 1.2-1.2Zm3-2.1h5.6a1.2 1.2 0 0 1 1.2 1.2v.9H6v-.9a1.2 1.2 0 0 1 1.2-1.2Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function HighlightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`${className} text-amber-500`}>
      <path
        d="M7.8 12.9h4.4m-4 2.3h3.6M8.1 11.1V10c0-.8.3-1.6.9-2.2l.5-.6a2.8 2.8 0 1 0-4.9-1.9c0 .8.3 1.6.9 2.2l.5.6c.6.6.9 1.4.9 2.2v1.1m3.9 0V10c0-.8.3-1.6.9-2.2l.5-.6a2.8 2.8 0 1 0-4.9-1.9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

const getCompanyInitials = (company: string) => {
  const tokens = company
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

const getCompanyAvatarClasses = (company: string) => {
  const normalizedCompany = String(company || "").toLowerCase();

  if (normalizedCompany.includes("microsoft")) {
    return "bg-[linear-gradient(135deg,#dbeafe,#93c5fd)] text-blue-900";
  }

  if (normalizedCompany.includes("shell")) {
    return "bg-[linear-gradient(135deg,#fef08a,#fbbf24)] text-amber-950";
  }

  if (normalizedCompany.includes("honeywell")) {
    return "bg-[linear-gradient(135deg,#fecaca,#ef4444)] text-red-950";
  }

  if (normalizedCompany.includes("goldman sachs")) {
    return "bg-[linear-gradient(135deg,#bfdbfe,#67e8f9)] text-sky-950";
  }

  if (normalizedCompany.includes("amazon")) {
    return "bg-[linear-gradient(135deg,#fde68a,#fb923c)] text-orange-950";
  }

  if (normalizedCompany.includes("google")) {
    return "bg-[linear-gradient(135deg,#dbeafe,#bbf7d0)] text-slate-900";
  }

  return "bg-[linear-gradient(135deg,rgba(186,230,253,0.95),rgba(153,246,228,0.92))] text-teal-900";
};

const resolveJobIconKind = (job: JobPost): HeaderIconProps["kind"] => {
  const haystack = `${job.title} ${job.company} ${job.summary} ${job.excerpt}`.toLowerCase();

  if (
    haystack.includes("ai") ||
    haystack.includes("machine learning") ||
    haystack.includes("data science") ||
    haystack.includes("data engineer") ||
    haystack.includes("artificial intelligence")
  ) {
    return "ai";
  }

  if (haystack.includes("intern")) {
    return "internship";
  }

  if (
    haystack.includes("software") ||
    haystack.includes("developer") ||
    haystack.includes("engineer") ||
    haystack.includes("frontend") ||
    haystack.includes("backend") ||
    haystack.includes("full stack")
  ) {
    return "code";
  }

  return "briefcase";
};

const splitJobTitle = (title: string) => {
  const normalizedTitle = String(title || "").trim();
  const parentheticalMatch = normalizedTitle.match(/^(.*?)(?:\s*\(([^)]+)\))$/);

  if (parentheticalMatch) {
    const primaryTitle = parentheticalMatch[1]?.trim();
    const secondaryTitle = parentheticalMatch[2]?.trim();
    if (primaryTitle && secondaryTitle) {
      return {
        title: primaryTitle,
        subtitle: secondaryTitle,
      };
    }
  }

  return {
    title: normalizedTitle,
    subtitle: "",
  };
};

const compactLocationLabel = (location: string) => {
  const parts = String(location || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return `${parts[0]}, ${parts[parts.length - 1]}`;
  }

  return String(location || "").trim();
};

const normalizeCardText = (value: string | undefined) =>
  String(value || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cropCardText = (value: string | undefined, maxLength = 58) => {
  const normalizedValue = normalizeCardText(value);
  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  const croppedValue = normalizedValue.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${croppedValue.trim()}...`;
};

const resolveCardHighlight = (job: JobPost, includeExperienceInPrimaryRow: boolean) => {
  const candidates = [
    job.summary,
    job.excerpt,
    includeExperienceInPrimaryRow ? "" : job.experience || job.experienceYears || job.experienceLevel,
    job.eligibilityCriteria,
    job.skills.length > 0 ? `Skills: ${job.skills.slice(0, 2).join(", ")}` : "",
  ];

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeCardText(candidate)
      .replace(/^summary\s*[:\-]\s*/i, "")
      .replace(/^overview\s*[:\-]\s*/i, "")
      .replace(/^no prior professional experience required/i, "No prior experience required")
      .replace(/^basic knowledge or academic experience/i, "Basic knowledge or academic experience")
      .replace(/^candidates with strong programming,?\s*/i, "Strong programming skills ")
      .replace(/^candidates with strong experience in\s*/i, "Strong experience in ")
      .replace(/skills problem solving/gi, "skills and problem-solving")
      .replace(/minimum 60%\s+in academic[^,.;]*/i, "Minimum 60% academic record")
      .replace(/^candidates pursuing bachelor's degree/i, "Candidates pursuing a bachelor's degree");

    if (normalizedCandidate) {
      return cropCardText(normalizedCandidate, 46);
    }
  }

  return "";
};

export default function JobCard({ job, style }: JobCardProps) {
  const workMode = job.workMode;
  const employmentType = job.employmentType || job.jobType;
  const experience = normalizeCardText(
    job.experience || job.experienceYears || job.experienceLevel || "",
  );
  const companyInitials = getCompanyInitials(job.company);
  const companyAvatarClasses = getCompanyAvatarClasses(job.company);
  const jobIconKind = resolveJobIconKind(job);
  const titleParts = splitJobTitle(job.title);
  const includeExperienceInPrimaryRow = Boolean(experience) && experience.length <= 18;
  const cardHighlight = resolveCardHighlight(job, includeExperienceInPrimaryRow);
  const primaryMetaItems = [
    job.location
      ? {
          icon: LocationIcon,
          label: cropCardText(compactLocationLabel(job.location), 24),
        }
      : null,
    includeExperienceInPrimaryRow
      ? {
          icon: ExperienceIcon,
          label: cropCardText(experience, 18),
        }
      : null,
    workMode || employmentType
      ? {
          icon: WorkModeIcon,
          label: workMode || employmentType || "",
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: typeof LocationIcon;
    label: string;
  }>;
  return (
    <article
      className="group fade-up relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,251,0.96)_58%,rgba(242,247,246,0.94)_100%)] px-5 py-5 shadow-[0_10px_28px_-18px_rgba(15,23,42,0.14),0_18px_40px_-30px_rgba(20,184,166,0.10),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] sm:px-6"
      style={style}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/80" />
      <div className="pointer-events-none absolute -bottom-10 left-2 h-24 w-28 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.12)_0%,rgba(125,211,252,0.05)_42%,rgba(255,255,255,0)_74%)]" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex min-h-[4.6rem] items-start gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-teal-50/80 ring-1 ring-teal-100/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
            <HeaderIcon kind={jobIconKind} className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              className="text-[1.125rem] font-semibold leading-[1.3] tracking-[-0.01em] text-slate-900 transition-colors group-hover:text-teal-900"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
            >
              {titleParts.title}
            </h2>
            {titleParts.subtitle ? (
              <p className="mt-1 truncate text-[0.875rem] font-medium leading-[1.35] text-gray-500">
                {titleParts.subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3.5 min-w-0">
          <div className="flex min-w-0 items-start gap-3 text-[0.9375rem] text-slate-600">
            <span
              className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold leading-none tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ${companyAvatarClasses}`}
            >
              {companyInitials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.97rem] font-semibold leading-tight text-slate-800">
                {job.company}
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-[0.8rem] leading-none text-gray-500">
                <HeaderIcon kind="date" className="h-3.5 w-3.5 text-slate-400" />
                <span>Posted {formatPostedDate(job.date)}</span>
              </p>
            </div>
          </div>
        </div>

        {primaryMetaItems.length > 0 || cardHighlight ? (
          <div className="mt-3 space-y-2">
            {primaryMetaItems.length > 0 ? (
              <div className="flex min-h-[2.25rem] flex-wrap gap-2">
                {primaryMetaItems.map((item) => {
                  const MetaIcon = item.icon;
                  return (
                    <span
                      key={item.label}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/72 px-3 py-1.5 text-[0.82rem] font-medium leading-none text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                    >
                      <MetaIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">{item.label}</span>
                    </span>
                  );
                })}
              </div>
            ) : null}
            {cardHighlight ? (
              <div className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] font-normal leading-[1.35] text-gray-500">
                <HighlightIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span
                  className="min-w-0 flex-1 overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 1,
                  }}
                >
                  {cardHighlight}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

        <div className="mt-auto grid gap-4 pt-4 sm:grid-cols-2">
          {job.applyLink ? (
            <a
              href={`/api/apply/${job.slug}`}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0d9488_0%,#0f766e_60%,#34d399_118%)] px-5 py-3 text-[0.98rem] font-semibold text-white shadow-[0_6px_16px_rgba(16,185,129,0.25),inset_0_-2px_0_rgba(6,78,59,0.34),inset_0_1px_0_rgba(255,255,255,0.22)] transition duration-200 hover:-translate-y-0.5 hover:brightness-[1.05]"
              aria-label={`Apply for ${job.title} at ${job.company}`}
            >
              Apply Now
            </a>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-100/85 px-5 py-3 text-[0.98rem] font-semibold text-slate-500 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.2)]">
              Apply Unavailable
            </span>
          )}

          <Link
            href={`/jobs/${job.slug}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border-[1.5px] border-slate-300/85 bg-white/92 px-5 py-3 text-[0.98rem] font-semibold text-slate-900 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.84)] transition duration-200 hover:border-teal-200 hover:text-teal-900"
            aria-label={`View details for ${job.title} at ${job.company}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
