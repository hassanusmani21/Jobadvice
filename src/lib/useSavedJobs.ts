"use client";

import { useEffect, useState } from "react";
import {
  addSavedJobRecord,
  isSavedJobSlug,
  readSavedJobs,
  removeSavedJobRecord,
  savedJobsStorageKey,
  savedJobsUpdatedEvent,
  type SavedJobRecord,
  writeSavedJobs,
} from "@/lib/savedJobs";

export const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState<SavedJobRecord[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const syncSavedJobs = () => {
      setSavedJobs(readSavedJobs());
      setHasLoaded(true);
    };

    syncSavedJobs();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== savedJobsStorageKey) {
        return;
      }

      syncSavedJobs();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(savedJobsUpdatedEvent, syncSavedJobs as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(savedJobsUpdatedEvent, syncSavedJobs as EventListener);
    };
  }, []);

  const persistSavedJobs = (nextSavedJobs: SavedJobRecord[]) => {
    writeSavedJobs(nextSavedJobs);
    setSavedJobs(nextSavedJobs);
    setHasLoaded(true);
  };

  const saveJob = (slug: string) => {
    persistSavedJobs(addSavedJobRecord(readSavedJobs(), slug));
  };

  const removeSavedJob = (slug: string) => {
    persistSavedJobs(removeSavedJobRecord(readSavedJobs(), slug));
  };

  const toggleSavedJob = (slug: string) => {
    const currentSavedJobs = readSavedJobs();
    const wasSaved = isSavedJobSlug(currentSavedJobs, slug);
    const nextSavedJobs = wasSaved
      ? removeSavedJobRecord(currentSavedJobs, slug)
      : addSavedJobRecord(currentSavedJobs, slug);

    persistSavedJobs(nextSavedJobs);
    return !wasSaved;
  };

  const clearSavedJobs = () => {
    persistSavedJobs([]);
  };

  return {
    clearSavedJobs,
    hasLoaded,
    isSavedJob: (slug: string) => isSavedJobSlug(savedJobs, slug),
    removeSavedJob,
    saveJob,
    savedJobCount: savedJobs.length,
    savedJobs,
    toggleSavedJob,
  };
};
