import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "@/components/AppLink";
import { getAllowedAdminSession } from "@/lib/adminSession";
import { getAnalyticsDashboard } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Analytics",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminAnalyticsPageProps = {
  searchParams?: {
    from?: string | string[];
    to?: string | string[];
  };
};

const toSingleValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || "" : value || "";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);

const formatDuration = (seconds: number) => {
  if (seconds <= 0) {
    return "0s";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds}s`;
};

const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(value * 100)}%`;

const metricCards = (dashboard: Awaited<ReturnType<typeof getAnalyticsDashboard>>) => [
  {
    label: "Visitors",
    value: formatNumber(dashboard.totals.visitors),
    note: "Anonymous sessions",
  },
  {
    label: "Page Views",
    value: formatNumber(dashboard.totals.pageViews),
    note: `${formatNumber(dashboard.totals.events)} total events`,
  },
  {
    label: "Job Clicks",
    value: formatNumber(dashboard.totals.jobClicks),
    note: `${formatPercent(dashboard.totals.jobClickThroughRate)} CTR`,
  },
  {
    label: "Avg. Duration",
    value: formatDuration(dashboard.totals.averageSessionDurationSeconds),
    note: "Based on page exits",
  },
  {
    label: "Blog Clicks",
    value: formatNumber(dashboard.totals.blogClicks),
    note: "Internal blog links",
  },
  {
    label: "Alert Signups",
    value: formatNumber(dashboard.totals.jobAlertSignups),
    note: "Saved search starts",
  },
];

const maxSeriesValue = (series: Awaited<ReturnType<typeof getAnalyticsDashboard>>["series"]) =>
  Math.max(1, ...series.map((day) => day.pageViews));

export default async function AdminAnalyticsPage({
  searchParams,
}: AdminAnalyticsPageProps) {
  const session = await getAllowedAdminSession();

  if (!session) {
    redirect("/admin/login?callbackUrl=%2Fadmin%2Fanalytics");
  }

  const dashboard = await getAnalyticsDashboard({
    from: toSingleValue(searchParams?.from),
    to: toSingleValue(searchParams?.to),
  });
  const cards = metricCards(dashboard);
  const maxViews = maxSeriesValue(dashboard.series);

  return (
    <section className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 lg:px-6">
      <div className="admin-analytics-surface overflow-hidden rounded-2xl border border-slate-200 bg-white/[0.94] shadow-[0_18px_56px_-44px_rgba(15,23,42,0.32)] backdrop-blur">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-blue-700">
                Admin
              </p>
              <h1 className="mt-1.5 text-[1.45rem] font-black leading-tight text-slate-950 sm:text-[1.8rem]">
                Website Analytics
              </h1>
              <p className="mt-1.5 max-w-2xl text-[0.84rem] leading-5 text-slate-600">
                Privacy-friendly daily aggregates for traffic, clicks, searches, and alert
                signups. No IP addresses, emails, or user agents are stored.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
              <Link
                href="/admin"
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 text-[0.8rem] font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Back to editor
              </Link>
              <Link
                href="/admin/alerts"
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border border-blue-200 bg-blue-50 px-3 text-[0.8rem] font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
              >
                Alert subscribers
              </Link>
            </div>
          </div>

          <form className="mt-4 grid gap-2 sm:grid-cols-[10rem_10rem_auto]">
            <label className="grid gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
              From
              <input
                type="date"
                name="from"
                defaultValue={dashboard.dateFrom}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] font-semibold normal-case tracking-normal text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="grid gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
              To
              <input
                type="date"
                name="to"
                defaultValue={dashboard.dateTo}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-[0.82rem] font-semibold normal-case tracking-normal text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-4 text-[0.82rem] font-bold text-white shadow-[0_12px_28px_-20px_rgba(37,99,235,0.8)] transition hover:bg-blue-700"
              >
                Apply filters
              </button>
            </div>
          </form>
        </div>

        {!dashboard.storageConfigured ? (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 sm:px-5">
            Analytics storage is not configured for this deployment. Provider selected:{" "}
            {dashboard.storageProvider}. Set `ANALYTICS_STORAGE` plus the matching Blob
            credentials, or use `local` for development only.
          </div>
        ) : null}

        <div className="grid gap-3 border-b border-slate-200 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-6">
          {cards.map((card) => (
            <div
              key={card.label}
              className="admin-analytics-surface rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3"
            >
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-black text-slate-950">{card.value}</p>
              <p className="mt-0.5 text-[0.72rem] font-medium text-slate-500">{card.note}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 px-4 py-4 sm:px-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
          <div className="admin-analytics-surface rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Traffic
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">Daily page views</h2>
              </div>
              <p className="text-[0.74rem] font-semibold text-slate-500">
                {dashboard.dateFrom} to {dashboard.dateTo}
              </p>
            </div>

            <div className="mt-5 flex h-52 items-end gap-1.5 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 px-3 pb-3 pt-4">
              {dashboard.series.map((day) => (
                <div key={day.date} className="flex min-w-8 flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400"
                    style={{
                      height: `${Math.max(6, Math.round((day.pageViews / maxViews) * 160))}px`,
                    }}
                    title={`${day.date}: ${day.pageViews} views`}
                  />
                  <span className="text-[0.62rem] font-semibold text-slate-400">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-analytics-surface rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-blue-700">
              Sources
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Traffic sources</h2>
            <div className="mt-4 grid gap-2">
              {dashboard.topSources.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  No source data yet.
                </p>
              ) : (
                dashboard.topSources.map((source) => (
                  <div key={source.key} className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold text-slate-700">
                      {source.key}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                      {formatNumber(source.count)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-slate-200 px-4 py-4 sm:px-5 lg:grid-cols-2">
          <RankList title="Most Visited Pages" items={dashboard.topPages} empty="No page views yet." />
          <RankList title="Most Clicked Jobs" items={dashboard.topJobs} empty="No job clicks yet." />
          <RankList title="Most Clicked Blogs" items={dashboard.topBlogs} empty="No blog clicks yet." />
          <RankList
            title="Most Clicked Universities"
            items={dashboard.topUniversities}
            empty="No university clicks yet."
          />
          <KeywordList items={dashboard.topSearchKeywords} />
          <div className="admin-analytics-surface rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-blue-700">
              Email
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Alert email stats</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Open and email-click counters are ready in the data model, but the email template
              does not inject tracking pixels or redirect links yet. That keeps delivery clean for
              Gmail while leaving a place to add Resend webhook events later.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Opens
                </p>
                <p className="mt-1 text-lg font-black text-slate-950">
                  {formatNumber(dashboard.totals.emailOpens)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Clicks
                </p>
                <p className="mt-1 text-lg font-black text-slate-950">
                  {formatNumber(dashboard.totals.emailClicks)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RankList({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{
    key: string;
    label: string;
    count: number;
    path?: string;
    meta?: string;
  }>;
  empty: string;
}) {
  return (
    <div className="admin-analytics-surface rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-blue-700">
        Ranking
      </p>
      <h2 className="mt-1 text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-2">
        {items.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">{empty}</p>
        ) : (
          items.map((item) => (
            <div
              key={item.key}
              className="grid gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-bold text-slate-800">{item.label}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                  {formatNumber(item.count)}
                </span>
              </div>
              <p className="truncate text-xs font-medium text-slate-500">
                {item.path || item.key}
                {item.meta ? ` • ${item.meta}` : ""}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function KeywordList({
  items,
}: {
  items: Array<{
    key: string;
    count: number;
  }>;
}) {
  return (
    <div className="admin-analytics-surface rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-blue-700">
        Search
      </p>
      <h2 className="mt-1 text-lg font-black text-slate-950">Popular keywords</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.length === 0 ? (
          <p className="w-full rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
            No search keywords yet.
          </p>
        ) : (
          items.map((item) => (
            <span
              key={item.key}
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800"
            >
              {item.key}
              <span className="text-xs text-blue-500">{formatNumber(item.count)}</span>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
