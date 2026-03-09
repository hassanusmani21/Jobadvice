import { NextResponse } from "next/server";

const allowedProtocols = new Set(["http:", "https:"]);

const badRequest = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url")?.trim();

  if (!rawUrl) {
    return badRequest("Missing image url.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return badRequest("Invalid image url.");
  }

  if (!allowedProtocols.has(parsedUrl.protocol)) {
    return badRequest("Unsupported image url protocol.");
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(parsedUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; JobAdviceImageProxy/1.0)",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });
  } catch {
    return badRequest("Unable to fetch image.", 502);
  }

  if (!upstreamResponse.ok) {
    return badRequest("Remote image request failed.", 502);
  }

  const contentType = upstreamResponse.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return badRequest("Remote url did not return an image.", 415);
  }

  const body = upstreamResponse.body;
  if (!body) {
    return badRequest("Remote image body was empty.", 502);
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
