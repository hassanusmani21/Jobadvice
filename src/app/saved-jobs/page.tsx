import type { Metadata } from "next";
import SavedJobsPageClient from "@/components/SavedJobsPageClient";
import { getAllJobs } from "@/lib/jobs";

export const metadata: Metadata = {
  title: "Saved Jobs",
  description: "Revisit the jobs you bookmarked on this device and continue your application flow.",
  alternates: {
    canonical: "/saved-jobs/",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SavedJobsPage() {
  const jobs = await getAllJobs();

  return <SavedJobsPageClient jobs={jobs} />;
}
