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

export const hasTrustedSameOrigin = (request: Request) => {
  const targetOrigin = extractOrigin(request.url);
  if (!targetOrigin) {
    return false;
  }

  const fetchSite = String(request.headers.get("sec-fetch-site") || "")
    .trim()
    .toLowerCase();

  if (fetchSite && !trustedFetchSiteValues.has(fetchSite)) {
    return false;
  }

  const originHeader = String(request.headers.get("origin") || "").trim();
  if (originHeader) {
    return originHeader === targetOrigin;
  }

  const refererOrigin = extractOrigin(request.headers.get("referer"));
  if (refererOrigin) {
    return refererOrigin === targetOrigin;
  }

  return false;
};

export const noStoreJson = (
  body: unknown,
  init: ResponseInit = {},
) => {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return Response.json(body, {
    ...init,
    headers,
  });
};
