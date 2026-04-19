import HomeEngagementPopups from "@/components/HomeEngagementPopups";
import { getAllJobs } from "@/lib/jobs";

const cityAliases: Record<string, string> = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  bombay: "Mumbai",
  gurgaon: "Gurugram",
  gurugram: "Gurugram",
  mysore: "Mysuru",
  mysuru: "Mysuru",
};

const normalizePopupCity = (location: string) => {
  const rawCity = location.split(",")[0]?.trim() || "";
  if (!rawCity) {
    return "";
  }

  const canonical = cityAliases[rawCity.toLowerCase()] || rawCity;
  return canonical.replace(/\s+/g, " ").trim();
};

const toTopLocations = (locations: string[], limit = 12) => {
  const locationCounts = new Map<string, number>();

  for (const location of locations) {
    const normalizedLocation = normalizePopupCity(location);
    if (!normalizedLocation) {
      continue;
    }

    locationCounts.set(
      normalizedLocation,
      (locationCounts.get(normalizedLocation) || 0) + 1,
    );
  }

  return [...locationCounts.entries()]
    .sort(
      (firstItem, secondItem) =>
        secondItem[1] - firstItem[1] || firstItem[0].localeCompare(secondItem[0]),
    )
    .slice(0, limit)
    .map(([location]) => location);
};

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
  const locationOptions = toTopLocations(allJobs.map((job) => job.location));
  const titleOptions = toTopValues(allJobs.map((job) => job.title), 10);
  const skillOptions = toTopValues(allJobs.flatMap((job) => job.skills), 12);

  return (
    <HomeEngagementPopups
      locationOptions={locationOptions}
      titleOptions={titleOptions}
      skillOptions={skillOptions}
    />
  );
}
