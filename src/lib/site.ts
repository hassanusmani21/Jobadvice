const fallbackSiteUrl = "https://jobadvice.netlify.app";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || fallbackSiteUrl;
