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
export const siteVerifiedPublisherName = "Hassan Usmani";
export const siteVerifiedPublisherRole = "Founder, JobAdvice";
export const siteVerifiedPublisherPhotoPath = "/uploads/hassan-author-verified.jpeg";
export const siteWhatsappChannelUrl =
  "https://whatsapp.com/channel/0029Vb7MyM0BPzjaKwa1cr1f";
export const siteWhatsappGroupUrl =
  "https://chat.whatsapp.com/L6Qh1hBedLZ3vfL3kQMB4r";
export const siteSocialProfiles = [
  "https://www.instagram.com/jobadvices/",
  "https://youtube.com/@jobadvices?si=vMW4l3TDMBwCIjl5",
  "https://www.linkedin.com/company/jobadvices/",
  "https://x.com/jobadvices",
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
