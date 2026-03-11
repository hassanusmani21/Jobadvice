const fallbackSiteUrl = "https://jobadvice.in";

export const siteName = "JobAdvice";
export const siteDescription =
  "Find verified jobs and internships in India with direct apply links, daily updates, and practical career guidance.";
export const siteEmail = "hassan.usmani.career@gmail.com";
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || fallbackSiteUrl;
export const siteLogoPath = "/jobadvice-logo.svg";
export const siteLogoUrl = `${siteUrl}${siteLogoPath}`;
export const organizationId = `${siteUrl}#organization`;
export const websiteId = `${siteUrl}#website`;
export const siteSocialProfiles = [
  "https://www.instagram.com/jobsadvice.in?utm_source=qr&igsh=MTM0eGhud3VtNGNvcw==",
  "https://www.linkedin.com/in/hassan-usmani21",
  "https://www.youtube.com/@JobAdvice4u",
  "https://t.me/jobadvice4u",
];
export const siteKeywords = [
  "job updates",
  "fresher jobs",
  "tech jobs",
  "entry level jobs",
  "direct apply jobs",
  "job advice",
];
