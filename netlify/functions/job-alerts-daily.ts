export const config = {
  schedule: "30 3 * * *",
};

const fallbackSiteUrl = "https://jobadvice.in";

const resolveBaseUrl = () => {
  const candidates = [
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
    fallbackSiteUrl,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    return candidate.replace(/\/+$/, "");
  }

  return fallbackSiteUrl;
};

export default async function handler() {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/api/cron/job-alerts`, {
    method: "POST",
    headers: process.env.JOB_ALERTS_CRON_SECRET
      ? {
          "x-job-alerts-cron-secret": process.env.JOB_ALERTS_CRON_SECRET,
        }
      : undefined,
  });

  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
}
