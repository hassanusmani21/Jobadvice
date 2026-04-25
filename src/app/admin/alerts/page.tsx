import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAllowedAdminSession } from "@/lib/adminSession";
import {
  buildJobAlertSummary,
  type JobAlertFilters,
} from "@/lib/jobFilters";
import {
  listJobAlertSubscriptions,
  type JobAlertSubscription,
} from "@/lib/jobAlerts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Alerts",
  robots: {
    index: false,
    follow: false,
  },
};

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

const summarizeFilterBadges = (filters: JobAlertFilters) => {
  const badges: string[] = [];

  if (filters.jobTitles.length > 0) {
    for (const title of filters.jobTitles) {
      badges.push(`Title: ${title}`);
    }
  } else if (filters.query) {
    badges.push(`Role: ${filters.query}`);
  }

  if (filters.skills.length > 0) {
    for (const skill of filters.skills) {
      badges.push(`Skill: ${skill}`);
    }
  } else if (filters.skill) {
    badges.push(`Skill: ${filters.skill}`);
  }

  for (const city of filters.locations) {
    badges.push(`City: ${city}`);
  }

  for (const category of filters.segments) {
    badges.push(`Category: ${category}`);
  }

  if (filters.type) {
    badges.push(`Type: ${filters.type}`);
  }

  if (filters.status) {
    badges.push(`Status: ${filters.status}`);
  }

  return badges;
};

const countActive = (subscriptions: JobAlertSubscription[]) =>
  subscriptions.filter((subscription) => subscription.isActive).length;

export default async function AdminAlertsPage() {
  const session = await getAllowedAdminSession();

  if (!session) {
    redirect("/admin/login?callbackUrl=%2Fadmin%2Falerts");
  }

  const subscriptions = await listJobAlertSubscriptions();
  const activeCount = countActive(subscriptions);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-[1.8rem] border border-slate-200 bg-white/88 p-5 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.35)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-teal-700">
              Admin
            </p>
            <h1 className="mt-3 font-serif text-[2rem] leading-[1.02] text-slate-950">
              Job Alert Subscribers
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review active email alerts, the exact filters each visitor saved, and whether each
              subscription has received its latest digest.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Back to editor
            </a>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">
              {activeCount} active
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
              {subscriptions.length} total
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {subscriptions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-slate-600 md:col-span-2">
              No job alert subscriptions yet.
            </div>
          ) : (
            subscriptions.map((subscription) => {
              const badges = summarizeFilterBadges(subscription.filters);

              return (
                <article
                  key={subscription.signature}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {subscription.name ? (
                        <p className="truncate text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
                          {subscription.name}
                        </p>
                      ) : null}
                      <p className="truncate text-base font-semibold text-slate-950">
                        {subscription.email}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {buildJobAlertSummary(subscription.filters)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                        subscription.isActive
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {subscription.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {badges.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {badges.map((badge) => (
                        <span
                          key={`${subscription.signature}-${badge}`}
                          className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <dl className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Created
                      </dt>
                      <dd className="mt-1">{formatDateTime(subscription.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Updated
                      </dt>
                      <dd className="mt-1">{formatDateTime(subscription.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Last sent
                      </dt>
                      <dd className="mt-1">{formatDateTime(subscription.lastSentAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Sent jobs tracked
                      </dt>
                      <dd className="mt-1">{subscription.sentJobSlugs.length}</dd>
                    </div>
                  </dl>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
