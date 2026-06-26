import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminAlertsManager, {
  type AdminAlertRecord,
} from "@/components/AdminAlertsManager";
import { getAllowedAdminSession } from "@/lib/adminSession";
import { buildJobAlertSummary } from "@/lib/jobFilters";
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

const toAdminAlertRecord = (subscription: JobAlertSubscription): AdminAlertRecord => ({
  signature: subscription.signature,
  email: subscription.email,
  name: subscription.name || "",
  summary: buildJobAlertSummary(subscription.filters),
  titles: subscription.filters.jobTitles.length > 0
    ? subscription.filters.jobTitles
    : subscription.filters.query
      ? [subscription.filters.query]
      : [],
  skills: subscription.filters.skills.length > 0
    ? subscription.filters.skills
    : subscription.filters.skill
      ? [subscription.filters.skill]
      : [],
  locations: subscription.filters.locations,
  categories: subscription.filters.segments,
  type: subscription.filters.type,
  status: subscription.filters.status,
  isActive: subscription.isActive,
  createdAt: subscription.createdAt,
  updatedAt: subscription.updatedAt,
  lastSentAt: subscription.lastSentAt,
  sentJobsTracked: subscription.sentJobSlugs.length,
});

export default async function AdminAlertsPage() {
  const session = await getAllowedAdminSession();

  if (!session) {
    redirect("/admin/login?callbackUrl=%2Fadmin%2Falerts");
  }

  const subscriptions = (await listJobAlertSubscriptions()).map(toAdminAlertRecord);

  return <AdminAlertsManager initialSubscriptions={subscriptions} />;
}
