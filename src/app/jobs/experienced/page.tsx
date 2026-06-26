import type { Metadata } from "next";
import JobSegmentPage from "@/components/JobSegmentPage";
import { getAllJobs } from "@/lib/jobs";
import { getJobSegmentConfig, getJobsForSegment } from "@/lib/jobSegments";
import { createPageMetadata } from "@/lib/seo";

export const revalidate = 60 * 60;

const segment = "experienced" as const;
const config = getJobSegmentConfig(segment);

export const metadata: Metadata = createPageMetadata({
  title: config.pageTitle,
  description: config.pageDescription,
  path: `${config.href}/`,
  keywords: ["experienced jobs", "professional jobs India", "career openings"],
  noIndex: true,
});

export default async function ExperiencedJobsPage() {
  const jobs = getJobsForSegment(await getAllJobs(), segment);

  return <JobSegmentPage jobs={jobs} segment={segment} />;
}
