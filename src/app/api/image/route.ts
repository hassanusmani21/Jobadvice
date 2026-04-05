import { NextResponse } from "next/server";

const allowedProtocols = new Set(["http:", "https:"]);
const crawlerControlHeaders = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const imageResponseHeaders = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
  ...crawlerControlHeaders,
};

const badRequest = (message: string, status = 400) =>
  NextResponse.json(
    { error: message },
    {
      status,
      headers: crawlerControlHeaders,
    },
  );

const escapeSvgText = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const placeholderImage = (hostLabel: string) => {
  const safeHostLabel = escapeSvgText(hostLabel);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="720" viewBox="0 0 1200 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="88" y1="56" x2="1090" y2="650" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0F172A"/>
      <stop offset="0.55" stop-color="#111827"/>
      <stop offset="1" stop-color="#0F3D3E"/>
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1020 112) rotate(132.496) scale(392.541 280.321)">
      <stop stop-color="#2DD4BF" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#2DD4BF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="720" rx="36" fill="url(#bg)"/>
  <rect width="1200" height="720" rx="36" fill="url(#glow)"/>
  <rect x="84" y="88" width="264" height="54" rx="27" fill="#10373A" stroke="#2DD4BF" stroke-opacity="0.34"/>
  <text x="112" y="122" fill="#99F6E4" font-size="22" font-family="Inter, Arial, sans-serif" font-weight="700" letter-spacing="4">JOBADVICE</text>
  <text x="84" y="314" fill="#F8FAFC" font-size="64" font-family="Georgia, Times New Roman, serif" font-weight="700">Image unavailable</text>
  <text x="84" y="374" fill="#CBD5E1" font-size="28" font-family="Inter, Arial, sans-serif">The original cover from ${safeHostLabel} could not be loaded.</text>
  <text x="84" y="418" fill="#94A3B8" font-size="24" font-family="Inter, Arial, sans-serif">Using a branded fallback to keep the layout clean.</text>
  <rect x="84" y="508" width="360" height="72" rx="24" fill="#0B2430" stroke="#334155"/>
  <text x="120" y="554" fill="#E2E8F0" font-size="26" font-family="Inter, Arial, sans-serif" font-weight="600">${safeHostLabel}</text>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      ...imageResponseHeaders,
    },
  });
};

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
    return placeholderImage(parsedUrl.hostname.replace(/^www\./, ""));
  }

  if (!upstreamResponse.ok) {
    return placeholderImage(parsedUrl.hostname.replace(/^www\./, ""));
  }

  const contentType = upstreamResponse.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return placeholderImage(parsedUrl.hostname.replace(/^www\./, ""));
  }

  const body = upstreamResponse.body;
  if (!body) {
    return placeholderImage(parsedUrl.hostname.replace(/^www\./, ""));
  }

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      ...imageResponseHeaders,
    },
  });
}
