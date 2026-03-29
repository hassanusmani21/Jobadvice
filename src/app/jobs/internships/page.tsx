import type { Metadata } from "next";
import JobSegmentPage from "@/components/JobSegmentPage";
import { getAllJobs } from "@/lib/jobs";
import { getJobSegmentConfig, getJobsForSegment } from "@/lib/jobSegments";

export const revalidate = 60 * 60;

const segment = "internships" as const;
const config = getJobSegmentConfig(segment);

export const metadata: Metadata = {
  title: config.pageTitle,
  description: config.pageDescription,
  alternates: {
    canonical: `${config.href}/`,
  },
};

export default async function InternshipJobsPage() {
  const jobs = getJobsForSegment(await getAllJobs(), segment);

  return <JobSegmentPage jobs={jobs} segment={segment} />;
}
