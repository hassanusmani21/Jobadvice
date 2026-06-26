"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

export type AdminAlertRecord = {
  signature: string;
  email: string;
  name: string;
  summary: string;
  titles: string[];
  skills: string[];
  locations: string[];
  categories: string[];
  type: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSentAt: string | null;
  sentJobsTracked: number;
};

type AdminAlertsManagerProps = {
  initialSubscriptions: AdminAlertRecord[];
};

type NoticeState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const initialNotice: NoticeState = {
  tone: "idle",
  message: "",
};

const pageSizeOptions = [25, 50, 100] as const;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not yet";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatDateShort = (value: string | null) => {
  if (!value) {
    return "Not yet";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const toSearchText = (record: AdminAlertRecord) =>
  [
    record.name,
    record.email,
    record.summary,
    ...record.titles,
    ...record.skills,
    ...record.locations,
    ...record.categories,
    record.type,
    record.status,
  ]
    .join(" ")
    .toLowerCase();

const getFilterChips = (record: AdminAlertRecord) => [
  ...record.titles.map((title) => `Title: ${title}`),
  ...record.skills.map((skill) => `Skill: ${skill}`),
  ...record.locations.map((location) => `City: ${location}`),
  ...record.categories.map((category) => `Category: ${category}`),
  ...(record.type ? [`Type: ${record.type}`] : []),
  ...(record.status ? [`Status: ${record.status}`] : []),
];

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

export default function AdminAlertsManager({
  initialSubscriptions,
}: AdminAlertsManagerProps) {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<NoticeState>(initialNotice);
  const [deletingSignature, setDeletingSignature] = useState("");
  const [isRunningDigest, setIsRunningDigest] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeCount = useMemo(
    () => subscriptions.filter((subscription) => subscription.isActive).length,
    [subscriptions],
  );
  const inactiveCount = subscriptions.length - activeCount;
  const sentCount = useMemo(
    () => subscriptions.reduce((total, subscription) => total + subscription.sentJobsTracked, 0),
    [subscriptions],
  );

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return subscriptions.filter((subscription) => {
      if (statusFilter === "active" && !subscription.isActive) {
        return false;
      }

      if (statusFilter === "inactive" && subscription.isActive) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return toSearchText(subscription).includes(normalizedQuery);
    });
  }, [query, statusFilter, subscriptions]);

  const totalPages = Math.max(1, Math.ceil(filteredSubscriptions.length / pageSize));
  const visibleSubscriptions = filteredSubscriptions.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const refreshSubscriptions = () => {
    setNotice(initialNotice);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/alerts", {
          headers: {
            Accept: "application/json",
          },
        });
        const payload = (await response.json().catch(() => null)) as
          | { records?: AdminAlertRecord[]; error?: string }
          | null;

        if (!response.ok || !Array.isArray(payload?.records)) {
          throw new Error(payload?.error || "Unable to refresh subscribers.");
        }

        setSubscriptions(payload.records);
        setNotice({
          tone: "success",
          message: `Refreshed ${pluralize(payload.records.length, "subscriber")}.`,
        });
      } catch (error) {
        setNotice({
          tone: "error",
          message: error instanceof Error ? error.message : "Unable to refresh subscribers.",
        });
      }
    });
  };

  const deleteSubscription = (record: AdminAlertRecord) => {
    const confirmed = window.confirm(
      `Delete alert subscription for ${record.email}? This removes it from the alert store.`,
    );

    if (!confirmed) {
      return;
    }

    setNotice(initialNotice);
    setDeletingSignature(record.signature);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/alerts", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signature: record.signature,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        if (!response.ok) {
          throw new Error(payload?.error || "Unable to delete subscription.");
        }

        setSubscriptions((currentSubscriptions) =>
          currentSubscriptions.filter(
            (subscription) => subscription.signature !== record.signature,
          ),
        );
        setNotice({
          tone: "success",
          message: `Deleted alert for ${record.email}.`,
        });
      } catch (error) {
        setNotice({
          tone: "error",
          message: error instanceof Error ? error.message : "Unable to delete subscription.",
        });
      } finally {
        setDeletingSignature("");
      }
    });
  };

  const runDigestNow = () => {
    setNotice(initialNotice);
    setIsRunningDigest(true);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/alerts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "run-digest",
            force: true,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              error?: string;
              result?: {
                activeAlerts: number;
                emailConfigured: boolean;
                emailsSent: number;
                errors?: string[];
                matchedJobs: number;
                skippedAlerts: number;
                skippedAlreadySentToday: number;
                skippedNoNewMatches: number;
                storageProvider?: string;
                uniqueRecipients: number;
              };
            }
          | null;

        if (!response.ok || !payload?.result) {
          throw new Error(payload?.error || "Unable to run the digest.");
        }

        const result = payload.result;
        setNotice({
          tone: result.emailsSent > 0 || result.activeAlerts === 0 ? "success" : "error",
          message:
            `Digest checked ${result.activeAlerts} active alerts across ${result.uniqueRecipients} recipients. ` +
            `Sent ${result.emailsSent} emails for ${result.matchedJobs} jobs. ` +
            `Skipped ${result.skippedAlerts} alerts (${result.skippedNoNewMatches} with no new matches). ` +
            `Email config: ${result.emailConfigured ? "ready" : "missing"}.` +
            (result.errors?.length ? ` First error: ${result.errors[0]}` : ""),
        });
        refreshSubscriptions();
      } catch (error) {
        setNotice({
          tone: "error",
          message: error instanceof Error ? error.message : "Unable to run the digest.",
        });
      } finally {
        setIsRunningDigest(false);
      }
    });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 lg:px-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/[0.92] shadow-[0_18px_56px_-44px_rgba(15,23,42,0.32)] backdrop-blur">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-teal-700">
                Admin
              </p>
              <h1 className="mt-1.5 font-serif text-[1.45rem] leading-tight text-slate-950 sm:text-[1.72rem]">
                Job Alert Subscribers
              </h1>
              <p className="mt-1.5 max-w-2xl text-[0.82rem] leading-5 text-slate-600">
                Manage saved email alerts in a compact sheet view. Search, filter, export, refresh,
                and delete a single subscriber without touching the rest.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 lg:flex-nowrap lg:justify-end">
              <a
                href="/admin"
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 text-[0.8rem] font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Back to editor
              </a>
              <a
                href="/api/admin/alerts?format=csv"
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-3 text-[0.8rem] font-semibold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
              >
                Export CSV
              </a>
              <button
                type="button"
                onClick={runDigestNow}
                disabled={isPending || isRunningDigest}
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 text-[0.8rem] font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunningDigest ? "Running..." : "Run Digest Now"}
              </button>
              <button
                type="button"
                onClick={refreshSubscriptions}
                disabled={isPending || isRunningDigest}
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 text-[0.8rem] font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending && !deletingSignature ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Total
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-950">{subscriptions.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Active
              </p>
              <p className="mt-0.5 text-lg font-semibold text-emerald-900">{activeCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Inactive
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-950">{inactiveCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Sent Tracked
              </p>
              <p className="mt-0.5 text-lg font-semibold text-slate-950">{sentCount}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 px-4 py-2.5 sm:px-5">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_10rem_8rem]">
            <label className="min-w-0">
              <span className="sr-only">Search alert subscribers</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by email, name, title, skill, city..."
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            <label>
              <span className="sr-only">Filter status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | "active" | "inactive")
                }
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] font-semibold text-slate-700 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              >
                <option value="all">All status</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </label>

            <label>
              <span className="sr-only">Rows per page</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] font-semibold text-slate-700 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}/page
                  </option>
                ))}
              </select>
            </label>
          </div>

          {notice.tone !== "idle" ? (
            <p
              className={`mt-2 rounded-xl px-3 py-2 text-sm font-medium ${
                notice.tone === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800"
              }`}
              aria-live="polite"
            >
              {notice.message}
            </p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-separate border-spacing-0 text-left text-[0.82rem]">
            <thead>
              <tr className="bg-slate-50 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                <th className="border-b border-slate-200 px-3 py-2.5">Subscriber</th>
                <th className="border-b border-slate-200 px-3 py-2.5">Saved alert</th>
                <th className="border-b border-slate-200 px-3 py-2.5">Status</th>
                <th className="border-b border-slate-200 px-3 py-2.5">Created</th>
                <th className="border-b border-slate-200 px-3 py-2.5">Last sent</th>
                <th className="border-b border-slate-200 px-3 py-2.5 text-right">Sent</th>
                <th className="border-b border-slate-200 px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                    No alert subscribers match this view.
                  </td>
                </tr>
              ) : (
                visibleSubscriptions.map((subscription) => {
                  const chips = getFilterChips(subscription);
                  const visibleChips = chips.slice(0, 3);
                  const extraChipCount = Math.max(0, chips.length - visibleChips.length);
                  const isDeleting = deletingSignature === subscription.signature;

                  return (
                    <tr
                      key={subscription.signature}
                      className="align-top transition hover:bg-slate-50/80"
                    >
                      <td className="border-b border-slate-100 px-3 py-2.5">
                        <div className="min-w-0 max-w-[15rem]">
                          <p className="truncate font-semibold text-slate-950">
                            {subscription.email}
                          </p>
                          <p className="mt-0.5 truncate text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-teal-700">
                            {subscription.name || "No name"}
                          </p>
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5">
                        <div className="max-w-[28rem]">
                          <p className="line-clamp-2 text-[0.82rem] leading-5 text-slate-700">
                            {subscription.summary}
                          </p>
                          {chips.length > 0 ? (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {visibleChips.map((chip) => (
                                <span
                                  key={`${subscription.signature}-${chip}`}
                                  className="inline-flex max-w-[14rem] rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[0.68rem] font-medium leading-5 text-slate-600"
                                >
                                  <span className="truncate">{chip}</span>
                                </span>
                              ))}
                              {extraChipCount > 0 ? (
                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.68rem] font-semibold leading-5 text-slate-500">
                                  +{extraChipCount}
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.12em] ${
                            subscription.isActive
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          {subscription.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td
                        className="whitespace-nowrap border-b border-slate-100 px-3 py-2.5 text-slate-600"
                        title={formatDateTime(subscription.createdAt)}
                      >
                        {formatDateShort(subscription.createdAt)}
                      </td>
                      <td
                        className="whitespace-nowrap border-b border-slate-100 px-3 py-2.5 text-slate-600"
                        title={formatDateTime(subscription.lastSentAt)}
                      >
                        {formatDateShort(subscription.lastSentAt)}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right font-semibold text-slate-700">
                        {subscription.sentJobsTracked}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteSubscription(subscription)}
                          disabled={Boolean(deletingSignature)}
                          className="inline-flex h-7 items-center justify-center whitespace-nowrap rounded-full border border-rose-200 bg-white px-2.5 text-[0.72rem] font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-2.5 text-[0.82rem] text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p>
            Showing{" "}
            <span className="font-semibold text-slate-900">{visibleSubscriptions.length}</span> of{" "}
            <span className="font-semibold text-slate-900">{filteredSubscriptions.length}</span>{" "}
            filtered subscribers
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page <= 1}
              className="inline-flex h-7 items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 text-[0.72rem] font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="min-w-16 text-center text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
              disabled={page >= totalPages}
              className="inline-flex h-7 items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 text-[0.72rem] font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
