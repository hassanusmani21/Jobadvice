"use client";

import { usePathname } from "next/navigation";
import Link from "@/components/AppLink";
import { useSavedJobs } from "@/lib/useSavedJobs";

type SavedJobsHeaderLinkProps = {
  mobile?: boolean;
};

const formatSavedJobCount = (count: number) => {
  if (count > 9) {
    return "9+";
  }

  return String(count);
};

function BookmarkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0">
      <path
        d="M6 4.5h8a1.5 1.5 0 0 1 1.5 1.5V17l-5.5-3-5.5 3V6A1.5 1.5 0 0 1 6 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function SavedJobsHeaderLink({
  mobile = false,
}: SavedJobsHeaderLinkProps) {
  const pathname = usePathname();
  const { hasLoaded, savedJobCount } = useSavedJobs();
  const isActive = pathname === "/saved-jobs" || pathname.startsWith("/saved-jobs/");
  const countLabel = hasLoaded && savedJobCount > 0 ? formatSavedJobCount(savedJobCount) : "";

  return (
    <Link
      href="/saved-jobs"
      aria-label={countLabel ? `Saved jobs (${savedJobCount})` : "Saved jobs"}
      className={`utility-button saved-jobs-nav-link ${
        mobile ? "saved-jobs-nav-link-mobile" : ""
      } ${mobile ? "text-slate-700 hover:text-teal-800" : ""} ${
        isActive ? "saved-jobs-nav-link-active" : ""
      }`.trim()}
    >
      <BookmarkIcon />
      {mobile ? <span className="sr-only">Saved jobs</span> : <span>Saved</span>}
      {countLabel ? <span className="saved-jobs-nav-count">{countLabel}</span> : null}
    </Link>
  );
}
