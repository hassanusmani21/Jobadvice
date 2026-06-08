import { NextResponse } from "next/server";
import { recordAnalyticsEvent, type AnalyticsTrackInput } from "@/lib/analyticsStore";

export const dynamic = "force-dynamic";

const jsonHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};
const trustedFetchSiteValues = new Set(["same-origin", "same-site", "none"]);

const extractOrigin = (value: string | null) => {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
};

const getTargetOrigin = (request: Request) => {
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const forwardedProto = request.headers.get("x-forwarded-proto") || "";

  if (forwardedHost) {
    const requestOrigin = extractOrigin(request.url);
    const fallbackProto = requestOrigin ? new URL(requestOrigin).protocol.replace(":", "") : "https";
    return `${forwardedProto || fallbackProto}://${forwardedHost}`;
  }

  return extractOrigin(request.url);
};

const hasTrustedAnalyticsOrigin = (request: Request) => {
  const targetOrigin = getTargetOrigin(request);

  if (!targetOrigin) {
    return false;
  }

  const fetchSite = String(request.headers.get("sec-fetch-site") || "")
    .trim()
    .toLowerCase();

  if (fetchSite && !trustedFetchSiteValues.has(fetchSite)) {
    return false;
  }

  const originHeader = extractOrigin(request.headers.get("origin"));
  if (originHeader) {
    return originHeader === targetOrigin;
  }

  const refererOrigin = extractOrigin(request.headers.get("referer"));
  if (refererOrigin) {
    return refererOrigin === targetOrigin;
  }

  return trustedFetchSiteValues.has(fetchSite);
};

export async function POST(request: Request) {
  if (!hasTrustedAnalyticsOrigin(request)) {
    return NextResponse.json(
      {
        success: false,
        error: "InvalidOrigin",
      },
      {
        headers: jsonHeaders,
        status: 403,
      },
    );
  }

  const payload = (await request.json().catch(() => null)) as AnalyticsTrackInput | null;

  if (!payload?.eventName) {
    return NextResponse.json(
      {
        success: false,
        error: "MissingEventName",
      },
      {
        headers: jsonHeaders,
        status: 400,
      },
    );
  }

  await recordAnalyticsEvent(payload);

  return NextResponse.json(
    {
      success: true,
    },
    {
      headers: jsonHeaders,
    },
  );
}
