import { NextResponse } from "next/server";
import { runDailyJobAlerts } from "@/lib/jobAlerts";

export const dynamic = "force-dynamic";

const isDevelopment = process.env.NODE_ENV !== "production";
const cronSecret = (process.env.JOB_ALERTS_CRON_SECRET || "").trim();

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
  if (!isAuthorizedCronRequest(request)) {
    return buildUnauthorizedResponse();
  }

  const result = await runDailyJobAlerts();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return buildUnauthorizedResponse();
  }

  const result = await runDailyJobAlerts();
  return NextResponse.json(result);
}
