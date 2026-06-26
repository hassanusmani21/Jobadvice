import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

const decapStateCookie = "jobadvice_decap_oauth_state";
const githubAuthorizeUrl = "https://github.com/login/oauth/authorize";

const getProvider = (requestUrl: URL) => {
  const provider = requestUrl.searchParams.get("provider") || "github";
  return provider.trim().toLowerCase();
};

const getScope = (requestUrl: URL) => {
  const scope = requestUrl.searchParams.get("scope") || "repo";
  return scope.trim() || "repo";
};

const getSiteId = (requestUrl: URL) => {
  const siteId = requestUrl.searchParams.get("site_id");
  return (siteId || requestUrl.host).trim();
};

const getClientId = () => (process.env.DECAP_GITHUB_CLIENT_ID || "").trim();

const toHtmlResponse = (html: string) =>
  new NextResponse(html, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Type": "text/html; charset=utf-8",
    },
  });

const buildErrorPage = (message: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Decap OAuth Error</title>
  </head>
  <body>
    <script>
      (function () {
        var payload = ${JSON.stringify(message)};
        if (window.opener) {
          window.opener.postMessage(
            "authorization:github:error:" + JSON.stringify({ message: payload }),
            window.location.origin
          );
        }
        window.close();
        document.body.innerText = payload;
      })();
    </script>
  </body>
</html>`;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const provider = getProvider(requestUrl);

  if (provider !== "github") {
    return toHtmlResponse(buildErrorPage("Unsupported provider."));
  }

  const clientId = getClientId();
  if (!clientId) {
    return toHtmlResponse(buildErrorPage("Missing DECAP_GITHUB_CLIENT_ID."));
  }

  const siteId = getSiteId(requestUrl);
  const scope = getScope(requestUrl);
  const state = randomUUID();
  const callbackUrl = new URL("/api/decap/callback", requestUrl.origin);
  callbackUrl.searchParams.set("provider", provider);
  callbackUrl.searchParams.set("site_id", siteId);

  const authorizeUrl = new URL(githubAuthorizeUrl);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);

  const response = toHtmlResponse(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Connecting GitHub...</title>
  </head>
  <body>
    <script>
      (function () {
        var provider = ${JSON.stringify(provider)};
        var authorizeUrl = ${JSON.stringify(authorizeUrl.toString())};
        var openerOrigin = window.location.origin;
        var hasStarted = false;

        function startAuthorization() {
          if (hasStarted) {
            return;
          }

          hasStarted = true;
          window.location.replace(authorizeUrl);
        }

        window.addEventListener("message", function (event) {
          if (event.origin !== openerOrigin) {
            return;
          }

          if (event.data === "authorizing:" + provider) {
            startAuthorization();
          }
        });

        if (window.opener) {
          window.opener.postMessage("authorizing:" + provider, openerOrigin);
        } else {
          startAuthorization();
        }
      })();
    </script>
  </body>
</html>`);

  response.cookies.set(decapStateCookie, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/api/decap",
    maxAge: 60 * 10,
  });

  return response;
}
