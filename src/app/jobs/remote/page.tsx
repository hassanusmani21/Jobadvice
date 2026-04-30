import type { Metadata } from "next";
import JobSegmentPage from "@/components/JobSegmentPage";
import { getAllJobs } from "@/lib/jobs";
import { getJobSegmentConfig, getJobsForSegment } from "@/lib/jobSegments";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 60 * 60;

const segment = "remote" as const;
const config = getJobSegmentConfig(segment);

export const metadata: Metadata = createPageMetadata({
  title: config.pageTitle,
  description: config.pageDescription,
  path: `${config.href}/`,
  keywords: ["remote jobs", "work from home jobs", "remote jobs India"],
});

export default async function RemoteJobsPage() {
  const jobs = getJobsForSegment(await getAllJobs(), segment);

  return <JobSegmentPage jobs={jobs} segment={segment} />;
}
