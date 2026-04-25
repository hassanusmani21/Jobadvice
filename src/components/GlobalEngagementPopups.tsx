import HomeEngagementPopups from "@/components/HomeEngagementPopups";
import { getAllJobs } from "@/lib/jobs";

const toTopValues = (values: string[], limit = 12) => {
  const counts = new Map<string, number>();

  for (const value of values) {
    const normalizedValue = value.trim().replace(/\s+/g, " ");
    if (!normalizedValue) {
      continue;
    }

    counts.set(normalizedValue, (counts.get(normalizedValue) || 0) + 1);
  }

  return [...counts.entries()]
    .sort(
      (firstItem, secondItem) =>
        secondItem[1] - firstItem[1] || firstItem[0].localeCompare(secondItem[0]),
    )
    .slice(0, limit)
    .map(([value]) => value);
};

export default async function GlobalEngagementPopups() {
  const allJobs = await getAllJobs();
  const titleOptions = toTopValues(allJobs.map((job) => job.title), 40);
  const skillOptions = toTopValues(allJobs.flatMap((job) => job.skills), 40);

  return (
    <HomeEngagementPopups
      titleOptions={titleOptions}
      skillOptions={skillOptions}
    />
  );
}
