import { NextResponse } from "next/server";

const decapStateCookie = "jobadvice_decap_oauth_state";
const githubAccessTokenUrl = "https://github.com/login/oauth/access_token";

const getProvider = (requestUrl: URL) => {
  const provider = requestUrl.searchParams.get("provider") || "github";
  return provider.trim().toLowerCase();
};

const getClientId = () => (process.env.DECAP_GITHUB_CLIENT_ID || "").trim();
const getClientSecret = () => (process.env.DECAP_GITHUB_CLIENT_SECRET || "").trim();

const toHtmlResponse = (html: string) =>
  new NextResponse(html, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Type": "text/html; charset=utf-8",
    },
  });

const buildCallbackPage = (message: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>GitHub Authorization</title>
  </head>
  <body>
    <script>
      (function () {
        var message = ${JSON.stringify(message)};
        if (window.opener) {
          window.opener.postMessage(message, window.location.origin);
        }
        window.close();
        document.body.innerText = "Completing authorization...";
      })();
    </script>
  </body>
</html>`;

const buildErrorResponse = (message: string) =>
  toHtmlResponse(
    buildCallbackPage(
      `authorization:github:error:${JSON.stringify({
        message,
      })}`,
    ),
  );

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const provider = getProvider(requestUrl);

  if (provider !== "github") {
    return buildErrorResponse("Unsupported provider.");
  }

  const code = requestUrl.searchParams.get("code") || "";
  const state = requestUrl.searchParams.get("state") || "";
  const error = requestUrl.searchParams.get("error") || "";
  const errorDescription = requestUrl.searchParams.get("error_description") || "";
  const savedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${decapStateCookie}=`))
    ?.split("=")[1];

  if (error) {
    return buildErrorResponse(errorDescription || error);
  }

  if (!code || !state) {
    return buildErrorResponse("Missing OAuth code or state.");
  }

  if (!savedState || savedState !== state) {
    return buildErrorResponse("OAuth state validation failed.");
  }

  const clientId = getClientId();
  const clientSecret = getClientSecret();
  if (!clientId || !clientSecret) {
    return buildErrorResponse("Missing Decap GitHub OAuth credentials.");
  }

  const redirectUri = new URL("/api/decap/callback", requestUrl.origin);
  redirectUri.searchParams.set("provider", provider);
  const siteId = requestUrl.searchParams.get("site_id");
  if (siteId) {
    redirectUri.searchParams.set("site_id", siteId);
  }

  const tokenResponse = await fetch(githubAccessTokenUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      state,
      redirect_uri: redirectUri.toString(),
    }),
  });

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
  };

  if (!tokenResponse.ok || !tokenPayload.access_token) {
    return buildErrorResponse(
      tokenPayload.error_description || tokenPayload.error || "GitHub token exchange failed.",
    );
  }

  const successPayload = {
    provider,
    token: tokenPayload.access_token,
    ...(tokenPayload.refresh_token ? { refresh_token: tokenPayload.refresh_token } : {}),
    ...(tokenPayload.scope ? { scope: tokenPayload.scope } : {}),
    ...(tokenPayload.token_type ? { token_type: tokenPayload.token_type } : {}),
  };

  const response = toHtmlResponse(
    buildCallbackPage(
      `authorization:github:success:${JSON.stringify(successPayload)}`,
    ),
  );

  response.cookies.set(decapStateCookie, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/api/decap",
    maxAge: 0,
  });

  return response;
}
