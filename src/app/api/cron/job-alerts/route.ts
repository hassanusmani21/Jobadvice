import { NextResponse } from "next/server";
import { getJobAlertRuntimeStatus, runDailyJobAlerts } from "@/lib/jobAlerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const isDevelopment = process.env.NODE_ENV !== "production";
const cronSecret = (process.env.CRON_SECRET || process.env.JOB_ALERTS_CRON_SECRET || "").trim();

const isAuthorizedCronRequest = (request: Request) => {
  if (isDevelopment && !cronSecret) {
    return true;
  }

  const headerSecret =
    request.headers.get("x-job-alerts-cron-secret") ||
    request.headers.get("x-cron-secret") ||
    "";
  const bearerToken = request.headers.get("authorization") || "";

  if (headerSecret && headerSecret === cronSecret) {
    return true;
  }

  if (bearerToken === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
};

const isCronSecretMissing = () => !cronSecret && !isDevelopment;

const buildUnauthorizedResponse = () =>
  NextResponse.json(
    {
      message: "Unauthorized",
    },
    {
      status: 401,
    },
  );

export async function GET(request: Request) {
  if (isCronSecretMissing()) {
    console.error("[job-alerts-cron] Missing CRON_SECRET or JOB_ALERTS_CRON_SECRET.");
    return NextResponse.json(
      {
        message:
          "Cron secret is not configured. Set CRON_SECRET in production so Vercel Cron can authorize this route.",
        diagnostics: getJobAlertRuntimeStatus(),
      },
      {
        status: 503,
      },
    );
  }

  if (!isAuthorizedCronRequest(request)) {
    return buildUnauthorizedResponse();
  }

  try {
    const result = await runDailyJobAlerts();
    console.info("[job-alerts-cron] Daily job alerts completed", result);
    return NextResponse.json({
      ...result,
      diagnostics: getJobAlertRuntimeStatus(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown cron failure.";
    console.error("[job-alerts-cron] Daily job alerts failed", error);
    return NextResponse.json(
      {
        message,
        diagnostics: getJobAlertRuntimeStatus(),
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  if (isCronSecretMissing()) {
    console.error("[job-alerts-cron] Missing CRON_SECRET or JOB_ALERTS_CRON_SECRET.");
    return NextResponse.json(
      {
        message:
          "Cron secret is not configured. Set CRON_SECRET in production so Vercel Cron can authorize this route.",
        diagnostics: getJobAlertRuntimeStatus(),
      },
      {
        status: 503,
      },
    );
  }

  if (!isAuthorizedCronRequest(request)) {
    return buildUnauthorizedResponse();
  }

  try {
    const requestUrl = new URL(request.url);
    const result = await runDailyJobAlerts({
      force: requestUrl.searchParams.get("force") === "1",
      includeAlreadySent: requestUrl.searchParams.get("includeAlreadySent") === "1",
    });
    console.info("[job-alerts-cron] Manual job alerts completed", result);
    return NextResponse.json({
      ...result,
      diagnostics: getJobAlertRuntimeStatus(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown cron failure.";
    console.error("[job-alerts-cron] Manual job alerts failed", error);
    return NextResponse.json(
      {
        message,
        diagnostics: getJobAlertRuntimeStatus(),
      },
      {
        status: 500,
      },
    );
  }
}
