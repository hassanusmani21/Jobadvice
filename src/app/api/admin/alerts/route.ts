import { buildJobAlertSummary } from "@/lib/jobFilters";
import { requireAdminApiRequest } from "@/lib/adminSession";
import {
  deleteJobAlertSubscription,
  getJobAlertRuntimeStatus,
  listJobAlertSubscriptions,
  runDailyJobAlerts,
  type JobAlertSubscription,
} from "@/lib/jobAlerts";
import { noStoreJson } from "@/lib/requestSecurity";

export const dynamic = "force-dynamic";

type AdminAlertRecord = {
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

const csvHeaders = [
  "Name",
  "Email",
  "Active",
  "Summary",
  "Titles",
  "Skills",
  "Locations",
  "Categories",
  "Type",
  "Status",
  "Created At",
  "Updated At",
  "Last Sent At",
  "Sent Jobs Tracked",
  "Signature",
];

const escapeCsvCell = (value: string | number | boolean | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const toCsv = (records: AdminAlertRecord[]) => {
  const rows = records.map((record) => [
    record.name,
    record.email,
    record.isActive ? "Active" : "Inactive",
    record.summary,
    record.titles.join("; "),
    record.skills.join("; "),
    record.locations.join("; "),
    record.categories.join("; "),
    record.type,
    record.status,
    record.createdAt,
    record.updatedAt,
    record.lastSentAt || "",
    record.sentJobsTracked,
    record.signature,
  ]);

  return [
    csvHeaders.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\n");
};

export async function GET(request: Request) {
  const unauthorizedResponse = await requireAdminApiRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const requestUrl = new URL(request.url);
  const format = String(requestUrl.searchParams.get("format") || "").trim().toLowerCase();
  const records = (await listJobAlertSubscriptions()).map(toAdminAlertRecord);

  if (format === "csv") {
    return new Response(toCsv(records), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Content-Disposition": `attachment; filename="job-alert-subscribers-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  return noStoreJson({
    success: true,
    diagnostics: getJobAlertRuntimeStatus(),
    total: records.length,
    records,
  });
}

export async function DELETE(request: Request) {
  const unauthorizedResponse = await requireAdminApiRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const payload = (await request.json().catch(() => null)) as { signature?: string } | null;
  const signature = String(payload?.signature || "").trim();

  if (!signature) {
    return noStoreJson(
      {
        success: false,
        error: "MissingSubscriptionSignature",
      },
      { status: 400 },
    );
  }

  const deletedSubscription = await deleteJobAlertSubscription(signature);

  if (!deletedSubscription) {
    return noStoreJson(
      {
        success: false,
        error: "SubscriptionNotFound",
      },
      { status: 404 },
    );
  }

  return noStoreJson({
    success: true,
    deletedSignature: deletedSubscription.signature,
  });
}

export async function POST(request: Request) {
  const unauthorizedResponse = await requireAdminApiRequest(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  const payload = (await request.json().catch(() => null)) as {
    action?: string;
    force?: boolean;
    includeAlreadySent?: boolean;
  } | null;

  if (payload?.action !== "run-digest") {
    return noStoreJson(
      {
        success: false,
        error: "UnsupportedAlertAction",
      },
      { status: 400 },
    );
  }

  try {
    const result = await runDailyJobAlerts({
      force: Boolean(payload.force),
      includeAlreadySent: Boolean(payload.includeAlreadySent),
    });

    return noStoreJson({
      success: true,
      diagnostics: getJobAlertRuntimeStatus(),
      result,
    });
  } catch (error) {
    return noStoreJson(
      {
        success: false,
        diagnostics: getJobAlertRuntimeStatus(),
        error: error instanceof Error ? error.message : "UnableToRunDigest",
      },
      { status: 500 },
    );
  }
}
