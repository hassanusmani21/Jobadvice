import { NextResponse } from "next/server";

const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0",
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse(null, { status: 404, headers: noStoreHeaders });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const event = typeof body.event === "string" ? body.event : "unknown";
  const version = typeof body.version === "string" ? body.version : "";
  const collection = typeof body.collection === "string" ? body.collection : "";
  const mode = typeof body.mode === "string" ? body.mode : "";
  const routeValue = typeof body.route === "string" ? body.route : "";
  const status = typeof body.status === "string" ? body.status : "";
  const message = typeof body.message === "string" ? body.message : "";

  console.info(
    `[auto-extract-debug] event=${event} version=${version} collection=${collection} mode=${mode} status=${status} route=${routeValue} message=${message}`,
  );

  return new NextResponse(null, { status: 204, headers: noStoreHeaders });
}
