export const savedJobsStorageKey = "jobadvice-saved-jobs-v1";
export const savedJobsUpdatedEvent = "jobadvice:saved-jobs-updated";

export type SavedJobRecord = {
  slug: string;
  savedAt: string;
};

const normalizeSlug = (slug: string) => slug.trim();

export const normalizeSavedJobRecords = (records: SavedJobRecord[]) => {
  const seenSlugs = new Set<string>();
  const normalizedRecords: SavedJobRecord[] = [];

  for (const record of records) {
    const slug = normalizeSlug(record.slug);
    if (!slug || seenSlugs.has(slug)) {
      continue;
    }

    seenSlugs.add(slug);
    normalizedRecords.push({
      slug,
      savedAt:
        typeof record.savedAt === "string" && record.savedAt.trim()
          ? record.savedAt
          : new Date(0).toISOString(),
    });
  }

  return normalizedRecords;
};

export const parseSavedJobRecords = (rawValue: string | null | undefined) => {
  if (!rawValue) {
    return [] as SavedJobRecord[];
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [] as SavedJobRecord[];
    }

    return normalizeSavedJobRecords(
      parsedValue
        .filter((value): value is SavedJobRecord => Boolean(value && typeof value === "object"))
        .map((value) => ({
          slug: typeof value.slug === "string" ? value.slug : "",
          savedAt: typeof value.savedAt === "string" ? value.savedAt : "",
        })),
    );
  } catch {
    return [] as SavedJobRecord[];
  }
};

export const readSavedJobs = () => {
  if (typeof window === "undefined") {
    return [] as SavedJobRecord[];
  }

  try {
    return parseSavedJobRecords(window.localStorage.getItem(savedJobsStorageKey));
  } catch {
    return [] as SavedJobRecord[];
  }
};

export const writeSavedJobs = (records: SavedJobRecord[]) => {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedRecords = normalizeSavedJobRecords(records);

  try {
    window.localStorage.setItem(savedJobsStorageKey, JSON.stringify(normalizedRecords));
  } catch {
    return;
  }

  window.dispatchEvent(new Event(savedJobsUpdatedEvent));
};

export const isSavedJobSlug = (records: SavedJobRecord[], slug: string) => {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return false;
  }

  return records.some((record) => record.slug === normalizedSlug);
};

export const addSavedJobRecord = (records: SavedJobRecord[], slug: string) => {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return normalizeSavedJobRecords(records);
  }

  return normalizeSavedJobRecords([
    {
      slug: normalizedSlug,
      savedAt: new Date().toISOString(),
    },
    ...records.filter((record) => record.slug !== normalizedSlug),
  ]);
};

export const removeSavedJobRecord = (records: SavedJobRecord[], slug: string) => {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return normalizeSavedJobRecords(records);
  }

  return normalizeSavedJobRecords(records.filter((record) => record.slug !== normalizedSlug));
};
