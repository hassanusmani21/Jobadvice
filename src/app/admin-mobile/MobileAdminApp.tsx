"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import {
  type AdminCollection,
  type AdminMobileBlogEntry,
  type AdminMobileEntry,
  type AdminMobileJobEntry,
  type AdminMobileRecord,
  createEmptyBlogEntry,
  createEmptyJobEntry,
} from "@/lib/adminMobile";

type MobileAdminAppProps = {
  adminEmail: string;
  initialCollection: AdminCollection;
  initialSlug: string;
};

type RecordsState = Record<AdminCollection, AdminMobileRecord[]>;
type LoadingState = Record<AdminCollection, boolean>;

const listToText = (items: string[]) => items.join("\n");

const textToList = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*•\s]+/, "").trim())
    .filter((item) => item.length > 0);

const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const defaultRecordsState: RecordsState = {
  jobs: [],
  blogs: [],
};

const defaultLoadingState: LoadingState = {
  jobs: false,
  blogs: false,
};

const parseLegacyAdminHash = (hash: string) => {
  const match = hash.match(/collections\/(jobs|blogs)(?:\/entries\/([^/?#]+)|\/new)?/i);
  if (!match) {
    return null;
  }

  return {
    collection: match[1] as AdminCollection,
    slug: match[2] ? decodeURIComponent(match[2]) : "",
  };
};

const formatRecordMeta = (record: AdminMobileRecord) => {
  if ("company" in record) {
    return `${record.company || "No company"} • ${record.location || "No location"}`;
  }

  return record.topic || "No topic";
};

const buildEmptyEntry = (collection: AdminCollection) =>
  collection === "jobs" ? createEmptyJobEntry() : createEmptyBlogEntry();

const toExtractString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toExtractStringList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => toExtractString(item))
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return textToList(value);
  }

  return [] as string[];
};

const jobStringFieldKeys = [
  "title",
  "date",
  "company",
  "location",
  "workMode",
  "employmentType",
  "salary",
  "experience",
  "eligibilityCriteria",
  "workingDays",
  "jobTiming",
  "applyLink",
  "applicationStartDate",
  "applicationEndDate",
] as const;

const jobListFieldKeys = ["education", "skills", "responsibilities"] as const;

const blogStringFieldKeys = [
  "title",
  "slug",
  "summary",
  "topic",
  "author",
  "coverImage",
  "date",
  "body",
] as const;

const applyJobExtractedData = (
  current: AdminMobileJobEntry,
  data: Record<string, unknown>,
) => {
  let updatedCount = 0;
  const nextEntry = { ...current };

  for (const key of jobStringFieldKeys) {
    const nextValue = toExtractString(data[key]);
    if (!nextValue || nextEntry[key] === nextValue) {
      continue;
    }

    nextEntry[key] = nextValue;
    updatedCount += 1;
  }

  for (const key of jobListFieldKeys) {
    const nextValue = toExtractStringList(data[key]);
    if (
      nextValue.length === 0 ||
      nextEntry[key].join("\n") === nextValue.join("\n")
    ) {
      continue;
    }

    nextEntry[key] = nextValue;
    updatedCount += 1;
  }

  return {
    entry: nextEntry,
    updatedCount,
  };
};

const applyBlogExtractedData = (
  current: AdminMobileBlogEntry,
  data: Record<string, unknown>,
) => {
  let updatedCount = 0;
  const nextEntry = { ...current };

  for (const key of blogStringFieldKeys) {
    const nextValue = toExtractString(data[key]);
    if (!nextValue || nextEntry[key] === nextValue) {
      continue;
    }

    nextEntry[key] = nextValue;
    updatedCount += 1;
  }

  const nextTags = toExtractStringList(data.tags);
  if (nextTags.length > 0 && nextEntry.tags.join("\n") !== nextTags.join("\n")) {
    nextEntry.tags = nextTags;
    updatedCount += 1;
  }

  if (data.isTrending === true && nextEntry.isTrending !== true) {
    nextEntry.isTrending = true;
    updatedCount += 1;
  }

  return {
    entry: nextEntry,
    updatedCount,
  };
};

export default function MobileAdminApp({
  adminEmail,
  initialCollection,
  initialSlug,
}: MobileAdminAppProps) {
  const [collection, setCollection] = useState<AdminCollection>(initialCollection);
  const [recordsByCollection, setRecordsByCollection] =
    useState<RecordsState>(defaultRecordsState);
  const [recordsLoading, setRecordsLoading] =
    useState<LoadingState>(defaultLoadingState);
  const [recordsError, setRecordsError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [editorEntry, setEditorEntry] = useState<AdminMobileEntry>(buildEmptyEntry(initialCollection));
  const [editorOpen, setEditorOpen] = useState(Boolean(initialSlug));
  const [entryLoading, setEntryLoading] = useState(Boolean(initialSlug));
  const [originalSlug, setOriginalSlug] = useState(initialSlug);
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [saveMode, setSaveMode] = useState<"draft" | "publish" | "">("");
  const [uploading, setUploading] = useState(false);
  const [uploadedAssetUrl, setUploadedAssetUrl] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [extractorOpen, setExtractorOpen] = useState(false);
  const [extractSourceText, setExtractSourceText] = useState("");
  const [extractSourceUrl, setExtractSourceUrl] = useState("");
  const [extractMode, setExtractMode] = useState<"text" | "url" | "">("");
  const [extractError, setExtractError] = useState("");
  const [extractNotice, setExtractNotice] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const activeRecords = recordsByCollection[collection];
  const totalDrafts =
    recordsByCollection.jobs.filter((record) => record.draft).length +
    recordsByCollection.blogs.filter((record) => record.draft).length;
  const activeDraftCount = activeRecords.filter((record) => record.draft).length;
  const accountLabel = adminEmail.split("@")[0] || "admin";
  const accountInitial = accountLabel.charAt(0).toUpperCase() || "A";
  const query = searchValue.trim().toLowerCase();
  const filteredRecords = !query
    ? activeRecords
    : activeRecords.filter((record) => {
        const haystack = [
          record.title,
          record.slug,
          "company" in record ? record.company : record.topic,
          "location" in record ? record.location : "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      });

  useEffect(() => {
    const fetchRecords = async (nextCollection: AdminCollection) => {
      setRecordsLoading((current) => ({ ...current, [nextCollection]: true }));

      try {
        const response = await fetch(`/api/admin/${nextCollection}/records/`, {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/admin/login?callbackUrl=/admin-mobile";
          return;
        }

        const result = (await response.json()) as {
          records?: AdminMobileRecord[];
          success?: boolean;
        };

        if (!response.ok || result.success === false) {
          throw new Error("Unable to load entries.");
        }

        setRecordsByCollection((current) => ({
          ...current,
          [nextCollection]: Array.isArray(result.records) ? result.records : [],
        }));
      } catch (error) {
        setRecordsError(error instanceof Error ? error.message : "Unable to load entries.");
      } finally {
        setRecordsLoading((current) => ({ ...current, [nextCollection]: false }));
      }
    };

    fetchRecords("jobs");
    fetchRecords("blogs");
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!accountMenuRef.current) {
        return;
      }

      const eventTarget = event.target;
      if (eventTarget instanceof Node && !accountMenuRef.current.contains(eventTarget)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    const applyRouteState = (nextCollection: AdminCollection, nextSlug: string, open: boolean) => {
      const nextUrl = new URL(window.location.href);
      nextUrl.pathname = "/admin-mobile";
      nextUrl.searchParams.set("collection", nextCollection);

      if (open && nextSlug) {
        nextUrl.searchParams.set("slug", nextSlug);
      } else {
        nextUrl.searchParams.delete("slug");
      }

      window.history.replaceState(window.history.state, "", nextUrl.toString());
    };

    applyRouteState(collection, originalSlug || editorEntry.slug, editorOpen);
  }, [collection, editorEntry.slug, editorOpen, originalSlug]);

  useEffect(() => {
    const legacyState = parseLegacyAdminHash(window.location.hash || "");
    if (!legacyState) {
      return;
    }

    startTransition(() => {
      setCollection(legacyState.collection);
    });

    if (legacyState.slug) {
      setEntryLoading(true);
      setEditorOpen(true);

      fetch(
        `/api/admin/mobile/entry?collection=${legacyState.collection}&slug=${encodeURIComponent(
          legacyState.slug,
        )}`,
        {
          cache: "no-store",
          credentials: "same-origin",
        },
      )
        .then(async (response) => {
          if (response.status === 401 || response.status === 403) {
            window.location.href = "/admin/login?callbackUrl=/admin-mobile";
            return null;
          }

          const result = (await response.json()) as {
            entry?: AdminMobileEntry;
            success?: boolean;
          };

          if (!response.ok || result.success === false || !result.entry) {
            throw new Error("Unable to open entry.");
          }

          return result.entry;
        })
        .then((entry) => {
          if (!entry) {
            return;
          }

          setEditorEntry(entry);
          setOriginalSlug(entry.slug);
        })
        .catch((error) => {
          setFormError(error instanceof Error ? error.message : "Unable to open entry.");
        })
        .finally(() => {
          setEntryLoading(false);
        });
    }
  }, []);

  useEffect(() => {
    if (!initialSlug) {
      return;
    }

    setEntryLoading(true);

    fetch(
      `/api/admin/mobile/entry?collection=${initialCollection}&slug=${encodeURIComponent(
        initialSlug,
      )}`,
      {
        cache: "no-store",
        credentials: "same-origin",
      },
    )
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/admin/login?callbackUrl=/admin-mobile";
          return null;
        }

        const result = (await response.json()) as {
          entry?: AdminMobileEntry;
          success?: boolean;
        };

        if (!response.ok || result.success === false || !result.entry) {
          throw new Error("Unable to open entry.");
        }

        return result.entry;
      })
      .then((entry) => {
        if (!entry) {
          return;
        }

        setEditorEntry(entry);
        setOriginalSlug(entry.slug);
        setEditorOpen(true);
      })
      .catch((error) => {
        setFormError(error instanceof Error ? error.message : "Unable to open entry.");
      })
      .finally(() => {
        setEntryLoading(false);
      });
  }, [initialCollection, initialSlug]);

  const openNewEntry = (nextCollection: AdminCollection) => {
    setCollection(nextCollection);
    setEditorEntry(buildEmptyEntry(nextCollection));
    setOriginalSlug("");
    setFormError("");
    setFormNotice("");
    setExtractError("");
    setExtractNotice("");
    setUploadedAssetUrl("");
    setEditorOpen(true);
  };

  const openExistingEntry = async (nextCollection: AdminCollection, slug: string) => {
    setCollection(nextCollection);
    setEntryLoading(true);
    setEditorOpen(true);
    setFormError("");
    setFormNotice("");
    setExtractError("");
    setExtractNotice("");

    try {
      const response = await fetch(
        `/api/admin/mobile/entry?collection=${nextCollection}&slug=${encodeURIComponent(slug)}`,
        {
          cache: "no-store",
          credentials: "same-origin",
        },
      );

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/admin/login?callbackUrl=/admin-mobile";
        return;
      }

      const result = (await response.json()) as {
        entry?: AdminMobileEntry;
        success?: boolean;
      };

      if (!response.ok || result.success === false || !result.entry) {
        throw new Error("Unable to load the selected entry.");
      }

      setEditorEntry(result.entry);
      setOriginalSlug(result.entry.slug);
      setUploadedAssetUrl("");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to load the selected entry.",
      );
    } finally {
      setEntryLoading(false);
    }
  };

  const updateEntry = (patch: Partial<AdminMobileEntry>) => {
    setEditorEntry((current) => ({
      ...current,
      ...patch,
    }) as AdminMobileEntry);
  };

  const runAutoExtract = async (mode: "text" | "url") => {
    const sourceText = extractSourceText.trim();
    const sourceUrl = extractSourceUrl.trim();

    if (mode === "url" && !sourceUrl) {
      setExtractError("Paste a public URL first.");
      setExtractNotice("");
      setExtractorOpen(true);
      return;
    }

    if (mode === "text" && !sourceText) {
      setExtractError("Paste source text first.");
      setExtractNotice("");
      setExtractorOpen(true);
      return;
    }

    setExtractMode(mode);
    setExtractError("");
    setExtractNotice("");
    setExtractorOpen(true);

    try {
      const response = await fetch("/api/admin/auto-extract", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collection,
          sourceText: mode === "text" ? sourceText : "",
          sourceUrl: mode === "url" ? sourceUrl : "",
        }),
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/admin/login?callbackUrl=/admin-mobile";
        return;
      }

      const result = (await response.json()) as {
        data?: Record<string, unknown>;
        error?: string;
        mode?: string;
        reason?: string;
        resolvedSourceUrl?: string;
        sourceText?: string;
        success?: boolean;
      };

      if (!response.ok || result.success === false || !result.data) {
        throw new Error(result.error || "Auto extraction failed.");
      }

      if (typeof result.sourceText === "string" && result.sourceText.trim()) {
        setExtractSourceText(result.sourceText.trim());
      }

      if (typeof result.resolvedSourceUrl === "string" && result.resolvedSourceUrl.trim()) {
        setExtractSourceUrl(result.resolvedSourceUrl.trim());
      }

      const appliedResult =
        editorEntry.collection === "jobs"
          ? applyJobExtractedData(editorEntry, result.data)
          : applyBlogExtractedData(editorEntry, result.data);

      setEditorEntry(appliedResult.entry);

      const resultMode =
        typeof result.mode === "string" && result.mode.trim()
          ? result.mode.trim()
          : mode === "url"
            ? "remote"
            : "unknown";

      let nextNotice =
        appliedResult.updatedCount > 0
          ? `Updated ${appliedResult.updatedCount} field${
              appliedResult.updatedCount === 1 ? "" : "s"
            } (${resultMode}).`
          : `No new fields were updated (${resultMode}).`;

      if (resultMode === "fallback" && typeof result.reason === "string" && result.reason.trim()) {
        nextNotice += ` ${result.reason.trim()}`;
      }

      setExtractNotice(nextNotice);
    } catch (error) {
      setExtractError(
        error instanceof Error ? error.message : "Auto extraction failed.",
      );
    } finally {
      setExtractMode("");
    }
  };

  const saveEntry = async (draft: boolean) => {
    setSaveMode(draft ? "draft" : "publish");
    setFormError("");
    setFormNotice("");

    try {
      const nextEntry = {
        ...editorEntry,
        draft,
      };

      const response = await fetch("/api/admin/mobile/entry", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          collection,
          originalSlug,
          entry: nextEntry,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/admin/login?callbackUrl=/admin-mobile";
        return;
      }

      const result = (await response.json()) as {
        entry?: AdminMobileEntry;
        error?: string;
        issues?: string[];
        record?: AdminMobileRecord;
        success?: boolean;
      };

      if (!response.ok || result.success === false || !result.entry || !result.record) {
        const issuesText = Array.isArray(result.issues) ? result.issues.join(" ") : "";
        throw new Error([result.error, issuesText].filter(Boolean).join(" ") || "Save failed.");
      }

      const nextRecord = result.record;
      setEditorEntry(result.entry);
      setOriginalSlug(result.entry.slug);
      setFormNotice(draft ? "Draft saved." : "Published successfully.");
      setRecordsByCollection((current) => {
        const existingRecords = current[collection].filter(
          (record) => record.slug !== originalSlug && record.slug !== nextRecord.slug,
        );

        return {
          ...current,
          [collection]: [nextRecord, ...existingRecords].sort((firstRecord, secondRecord) =>
            secondRecord.date.localeCompare(firstRecord.date),
          ),
        };
      });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save entry.");
    } finally {
      setSaveMode("");
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setFormError("");
    setFormNotice("");

    try {
      const formData = new FormData();
      formData.set("collection", collection);
      formData.set("file", file);

      const response = await fetch("/api/admin/mobile/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/admin/login?callbackUrl=/admin-mobile";
        return;
      }

      const result = (await response.json()) as {
        error?: string;
        success?: boolean;
        url?: string;
      };

      if (!response.ok || result.success === false || !result.url) {
        throw new Error(result.error || "Upload failed.");
      }

      setUploadedAssetUrl(result.url);
      setFormNotice("Image uploaded.");
      if (editorEntry.collection === "blogs" && !editorEntry.coverImage) {
        updateEntry({ coverImage: result.url } as Partial<AdminMobileBlogEntry>);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const copyUploadedAsset = async () => {
    if (!uploadedAssetUrl || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(uploadedAssetUrl);
      setFormNotice("Image URL copied.");
    } catch {
      setFormNotice("Image uploaded.");
    }
  };

  const insertUploadedAsset = () => {
    if (!uploadedAssetUrl) {
      return;
    }

    updateEntry({
      body: `${editorEntry.body.trim()}\n\n![Image](${uploadedAssetUrl})\n`.trim(),
    } as Partial<AdminMobileEntry>);
    setFormNotice("Image markdown inserted.");
  };

  const activeTitle =
    editorEntry.collection === "jobs"
      ? editorEntry.title || "New job"
      : editorEntry.title || "New blog";

  return (
    <div data-admin-mobile-root className="min-h-[100dvh] px-3 py-3 sm:px-5 sm:py-5">
      <section className="mx-auto overflow-hidden rounded-[2rem] border border-white/75 bg-white/90 shadow-[0_35px_80px_-44px_rgba(15,23,42,0.45)] backdrop-blur">
        <div className="border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,246,0.92)_100%)] px-4 py-3 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-700">
                Mobile Admin
              </p>
              <h1 className="mt-1 font-serif text-2xl leading-tight text-slate-900 sm:text-[2rem]">
                {collection === "jobs" ? "Jobs workspace" : "Blogs workspace"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {activeRecords.length} {collection} • {activeDraftCount} drafts • {totalDrafts} total drafts
              </p>
            </div>

            <div ref={accountMenuRef} className="relative shrink-0">
              <button
                type="button"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAccountMenuOpen((current) => !current)}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-900 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.34)] transition hover:border-teal-300 hover:text-teal-700"
              >
                {accountInitial}
              </button>

              {accountMenuOpen ? (
                <div className="absolute top-[calc(100%+0.6rem)] right-0 z-20 w-[15.5rem] rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-[0_28px_52px_-26px_rgba(15,23,42,0.35)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Signed In
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-900">
                    {adminEmail}
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <a
                      href="/admin/?desktop_admin=1"
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Open Desktop Admin
                    </a>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/admin/login" })}
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside
            className={cn(
              "border-b border-slate-200/80 bg-[linear-gradient(180deg,#f4f7f5_0%,#f8fafc_100%)] p-4 lg:border-r lg:border-b-0 lg:p-5",
              editorOpen ? "hidden lg:block" : "block",
            )}
          >
            <div className="rounded-[1.5rem] border border-white/75 bg-white/88 p-4 shadow-[0_22px_42px_-36px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Workspace
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-slate-900">Entries</h2>
                </div>
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {activeDraftCount} drafts
                </span>
              </div>

              <button
                type="button"
                onClick={() => openNewEntry(collection)}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-teal-600 px-4 text-sm font-semibold text-white shadow-[0_12px_28px_-18px_rgba(13,148,136,0.8)] transition hover:bg-teal-700"
              >
                New {collection === "jobs" ? "Job" : "Blog"}
              </button>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/75 bg-white/88 p-4 shadow-[0_22px_42px_-36px_rgba(15,23,42,0.35)]">
              <div className="inline-flex w-full rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm">
                {(["jobs", "blogs"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCollection(item);
                      setSearchValue("");
                      setExtractError("");
                      setExtractNotice("");
                      if (editorEntry.collection !== item) {
                        setEditorEntry(buildEmptyEntry(item));
                        setOriginalSlug("");
                        setUploadedAssetUrl("");
                        setFormError("");
                        setFormNotice("");
                      }
                    }}
                    className={cn(
                      "min-h-11 flex-1 rounded-full px-4 text-sm font-semibold transition",
                      collection === item
                        ? "bg-teal-700 text-white shadow-[0_10px_24px_-18px_rgba(15,118,110,0.7)]"
                        : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    {item === "jobs" ? "Jobs" : "Blogs"}
                  </button>
                ))}
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Search
                </span>
                <input
                  type="search"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={`Search ${collection}`}
                  className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                />
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <div className="rounded-[1rem] bg-slate-100 px-3 py-2">
                  {filteredRecords.length} shown
                </div>
                <div className="rounded-[1rem] bg-slate-100 px-3 py-2">
                  {collection === "jobs" ? recordsByCollection.jobs.length : recordsByCollection.blogs.length} total
                </div>
              </div>
            </div>

            {recordsError ? (
              <p className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {recordsError}
              </p>
            ) : null}

            <div className="mt-4 space-y-3">
              {recordsLoading[collection] ? (
                <p className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Loading {collection}...
                </p>
              ) : null}

              {!recordsLoading[collection] && filteredRecords.length === 0 ? (
                <p className="rounded-[1rem] border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                  No {collection} found for this filter.
                </p>
              ) : null}

              {filteredRecords.map((record) => (
                <button
                  key={`${collection}-${record.slug}`}
                  type="button"
                  onClick={() => openExistingEntry(collection, record.slug)}
                  className="block w-full rounded-[1.35rem] border border-white/85 bg-white/92 px-4 py-4 text-left shadow-[0_18px_36px_-32px_rgba(15,23,42,0.32)] transition hover:border-teal-300 hover:shadow-[0_20px_44px_-32px_rgba(13,148,136,0.3)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{record.title || "Untitled"}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatRecordMeta(record)}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                        record.draft
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800",
                      )}
                    >
                      {record.draft ? "Draft" : "Live"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{record.date || "No date"}</span>
                    <span>{record.slug}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition",
                  editorOpen
                    ? "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100",
                )}
              >
                {editorOpen ? "Back to entries" : "Browse entries"}
              </button>

              <button
                type="button"
                onClick={() => openNewEntry(collection)}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
              >
                New
              </button>
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-white/80 bg-[linear-gradient(180deg,#fbfcfd_0%,#f4f7fa_100%)] p-4 shadow-[0_24px_48px_-36px_rgba(15,23,42,0.28)] sm:p-5">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {collection === "jobs" ? "Job editor" : "Blog editor"}
                  </p>
                  <h2 className="mt-1 font-serif text-2xl text-slate-900">{activeTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {editorEntry.collection === "jobs"
                      ? "Write the full job post once, then save draft or publish."
                      : "Write the article, upload the cover image, then publish from the same screen."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]",
                      editorEntry.draft
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800",
                    )}
                  >
                    {editorEntry.draft ? "Draft" : "Published"}
                  </span>
                  <span className="inline-flex rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    {editorEntry.slug || "new-entry"}
                  </span>
                </div>
              </div>

              {formError ? (
                <p className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </p>
              ) : null}

              {formNotice ? (
                <p className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {formNotice}
                </p>
              ) : null}

              {entryLoading ? (
                <p className="mt-4 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Loading entry...
                </p>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Title
                      </span>
                      <input
                        type="text"
                        value={editorEntry.title}
                        onChange={(event) => updateEntry({ title: event.target.value })}
                        className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                        placeholder={
                          editorEntry.collection === "jobs"
                            ? "Software Engineer"
                            : "AI roadmap for freshers"
                        }
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Publish date
                      </span>
                      <input
                        type="date"
                        value={editorEntry.date}
                        onChange={(event) => updateEntry({ date: event.target.value })}
                        className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                      />
                    </label>
                  </div>

                  {editorEntry.collection === "jobs" ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Company
                          </span>
                          <input
                            type="text"
                            value={editorEntry.company}
                            onChange={(event) => updateEntry({ company: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Capgemini"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Location
                          </span>
                          <input
                            type="text"
                            value={editorEntry.location}
                            onChange={(event) => updateEntry({ location: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Bangalore, India"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Work mode
                          </span>
                          <input
                            type="text"
                            value={editorEntry.workMode}
                            onChange={(event) => updateEntry({ workMode: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Remote, Hybrid, On-site"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Employment type
                          </span>
                          <input
                            type="text"
                            value={editorEntry.employmentType}
                            onChange={(event) =>
                              updateEntry({ employmentType: event.target.value })
                            }
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Full-time"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Salary
                          </span>
                          <input
                            type="text"
                            value={editorEntry.salary}
                            onChange={(event) => updateEntry({ salary: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="6-8 LPA"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Experience
                          </span>
                          <input
                            type="text"
                            value={editorEntry.experience}
                            onChange={(event) => updateEntry({ experience: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="1-3 years"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Apply link
                          </span>
                          <input
                            type="url"
                            value={editorEntry.applyLink}
                            onChange={(event) => updateEntry({ applyLink: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="https://company.com/jobs/apply"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Application start
                          </span>
                          <input
                            type="date"
                            value={editorEntry.applicationStartDate}
                            onChange={(event) =>
                              updateEntry({ applicationStartDate: event.target.value })
                            }
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Application end
                          </span>
                          <input
                            type="date"
                            value={editorEntry.applicationEndDate}
                            onChange={(event) =>
                              updateEntry({ applicationEndDate: event.target.value })
                            }
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Working days
                          </span>
                          <input
                            type="text"
                            value={editorEntry.workingDays}
                            onChange={(event) => updateEntry({ workingDays: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Monday-Friday"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Job timing
                        </span>
                        <input
                          type="text"
                          value={editorEntry.jobTiming}
                          onChange={(event) => updateEntry({ jobTiming: event.target.value })}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="9:30 AM - 6:30 PM"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Eligibility criteria
                        </span>
                        <textarea
                          value={editorEntry.eligibilityCriteria}
                          onChange={(event) =>
                            updateEntry({ eligibilityCriteria: event.target.value })
                          }
                          rows={4}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="One point per line"
                        />
                      </label>

                      <div className="grid gap-4 lg:grid-cols-3">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Education
                          </span>
                          <textarea
                            value={listToText(editorEntry.education)}
                            onChange={(event) =>
                              updateEntry({ education: textToList(event.target.value) })
                            }
                            rows={6}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="B.Tech&#10;MCA"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Skills
                          </span>
                          <textarea
                            value={listToText(editorEntry.skills)}
                            onChange={(event) =>
                              updateEntry({ skills: textToList(event.target.value) })
                            }
                            rows={6}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="React&#10;TypeScript&#10;SQL"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Responsibilities
                          </span>
                          <textarea
                            value={listToText(editorEntry.responsibilities)}
                            onChange={(event) =>
                              updateEntry({ responsibilities: textToList(event.target.value) })
                            }
                            rows={6}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Build APIs&#10;Collaborate with design"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Job details markdown
                        </span>
                        <textarea
                          value={editorEntry.body}
                          onChange={(event) => updateEntry({ body: event.target.value })}
                          rows={12}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="Paste the full job description or notes here."
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Topic
                          </span>
                          <input
                            type="text"
                            value={editorEntry.topic}
                            onChange={(event) => updateEntry({ topic: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Career Growth"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Author
                          </span>
                          <input
                            type="text"
                            value={editorEntry.author}
                            onChange={(event) => updateEntry({ author: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Hassan Usmani"
                          />
                        </label>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Summary
                        </span>
                        <textarea
                          value={editorEntry.summary}
                          onChange={(event) => updateEntry({ summary: event.target.value })}
                          rows={3}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="Short summary for cards and previews."
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Tags
                        </span>
                        <textarea
                          value={listToText(editorEntry.tags)}
                          onChange={(event) => updateEntry({ tags: textToList(event.target.value) })}
                          rows={4}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="ai&#10;roadmap&#10;career growth"
                        />
                      </label>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Cover image URL
                          </span>
                          <input
                            type="url"
                            value={editorEntry.coverImage}
                            onChange={(event) => updateEntry({ coverImage: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="/uploads/cover-image.jpg"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Trending
                          </span>
                          <button
                            type="button"
                            onClick={() => updateEntry({ isTrending: !editorEntry.isTrending })}
                            className={cn(
                              "flex min-h-[52px] w-full items-center justify-between rounded-[1rem] border px-4 text-sm font-semibold transition",
                              editorEntry.isTrending
                                ? "border-amber-300 bg-amber-50 text-amber-800"
                                : "border-slate-200 bg-white text-slate-600",
                            )}
                          >
                            <span>{editorEntry.isTrending ? "Trending enabled" : "Trending off"}</span>
                            <span>{editorEntry.isTrending ? "On" : "Off"}</span>
                          </button>
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            CTA label
                          </span>
                          <input
                            type="text"
                            value={editorEntry.ctaLabel}
                            onChange={(event) => updateEntry({ ctaLabel: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="Apply now"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            CTA link
                          </span>
                          <input
                            type="url"
                            value={editorEntry.ctaLink}
                            onChange={(event) => updateEntry({ ctaLink: event.target.value })}
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                            placeholder="https://example.com"
                          />
                        </label>
                      </div>

                      <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Image upload</p>
                            <p className="text-sm text-slate-500">
                              Upload once, then use it as the cover image or insert it into the article.
                            </p>
                          </div>
                          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800">
                            {uploading ? "Uploading..." : "Upload image"}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                              className="hidden"
                              onChange={(event) => {
                                const nextFile = event.target.files?.[0];
                                if (nextFile) {
                                  uploadImage(nextFile);
                                }

                                event.currentTarget.value = "";
                              }}
                            />
                          </label>
                        </div>

                        {editorEntry.coverImage ? (
                          <div className="mt-4 overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-50">
                            <div
                              aria-hidden="true"
                              className="h-48 w-full bg-cover bg-center"
                              style={{ backgroundImage: `url("${editorEntry.coverImage}")` }}
                            />
                          </div>
                        ) : null}

                        {uploadedAssetUrl ? (
                          <div className="mt-4 rounded-[1rem] border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-sm font-medium break-all text-emerald-800">
                              {uploadedAssetUrl}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => updateEntry({ coverImage: uploadedAssetUrl })}
                                className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
                              >
                                Use as cover
                              </button>
                              <button
                                type="button"
                                onClick={insertUploadedAsset}
                                className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                              >
                                Insert in article
                              </button>
                              <button
                                type="button"
                                onClick={copyUploadedAsset}
                                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                Copy URL
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Article markdown
                        </span>
                        <textarea
                          value={editorEntry.body}
                          onChange={(event) => updateEntry({ body: event.target.value })}
                          rows={16}
                          className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          placeholder="# Headline&#10;&#10;Start writing..."
                        />
                      </label>
                    </>
                  )}

                  <div className="rounded-[1.25rem] border border-teal-100 bg-[linear-gradient(180deg,rgba(240,253,250,0.96)_0%,rgba(255,255,255,0.98)_100%)] p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-700">
                          AI Extractor
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Auto-fill this {collection === "jobs" ? "job" : "blog"} form from a URL or pasted source text.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExtractorOpen((current) => !current)}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        {extractorOpen ? "Hide panel" : "Open panel"}
                      </button>
                    </div>

                    {extractorOpen ? (
                      <div className="mt-4 space-y-4">
                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Source URL
                          </span>
                          <input
                            type="url"
                            value={extractSourceUrl}
                            onChange={(event) => setExtractSourceUrl(event.target.value)}
                            placeholder={
                              collection === "jobs"
                                ? "https://company.com/careers/job-posting"
                                : "https://example.com/post"
                            }
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          />
                        </label>

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Source text
                          </span>
                          <textarea
                            value={extractSourceText}
                            onChange={(event) => setExtractSourceText(event.target.value)}
                            rows={5}
                            placeholder={
                              collection === "jobs"
                                ? "Paste complete job details text here if you are not using a URL."
                                : "Paste complete blog content/details here if you are not using a URL."
                            }
                            className="w-full rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500"
                          />
                        </label>

                        {extractError ? (
                          <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {extractError}
                          </p>
                        ) : null}

                        {extractNotice ? (
                          <p className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {extractNotice}
                          </p>
                        ) : null}

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            disabled={extractMode !== ""}
                            onClick={() => runAutoExtract("url")}
                            className={cn(
                              "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-white transition",
                              extractMode !== ""
                                ? "cursor-not-allowed bg-slate-300"
                                : "bg-slate-900 hover:bg-slate-800",
                            )}
                          >
                            {extractMode === "url" ? "Fetching URL..." : "Fetch URL + Extract"}
                          </button>
                          <button
                            type="button"
                            disabled={extractMode !== ""}
                            onClick={() => runAutoExtract("text")}
                            className={cn(
                              "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-white transition",
                              extractMode !== ""
                                ? "cursor-not-allowed bg-teal-300"
                                : "bg-teal-700 hover:bg-teal-800",
                            )}
                          >
                            {extractMode === "text" ? "Extracting..." : "Auto Extract Text"}
                          </button>
                          <button
                            type="button"
                            disabled={extractMode !== ""}
                            onClick={() => {
                              setExtractSourceUrl("");
                              setExtractSourceText("");
                              setExtractError("");
                              setExtractNotice("");
                            }}
                            className={cn(
                              "inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition",
                              extractMode !== ""
                                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                            )}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/96 px-4 pt-4 pb-1 backdrop-blur sm:-mx-5 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        disabled={saveMode !== ""}
                        onClick={() => saveEntry(true)}
                        className={cn(
                          "inline-flex min-h-12 items-center justify-center rounded-full border px-5 text-sm font-semibold transition",
                          saveMode !== ""
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        {saveMode === "draft" ? "Saving draft..." : "Save draft"}
                      </button>
                      <button
                        type="button"
                        disabled={saveMode !== ""}
                        onClick={() => saveEntry(false)}
                        className={cn(
                          "inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-white shadow-[0_18px_34px_-20px_rgba(15,118,110,0.65)] transition",
                          saveMode !== ""
                            ? "cursor-not-allowed bg-teal-300"
                            : "bg-teal-600 hover:bg-teal-700",
                        )}
                      >
                        {saveMode === "publish" ? "Publishing..." : "Publish"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
