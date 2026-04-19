import type { MetadataRoute } from "next";
import { getAllBlogs } from "@/lib/blogs";
import { getAllJobs } from "@/lib/jobs";
import { siteUrl } from "@/lib/site";
import {
  getAllBlogTopicLandings,
  getAllJobLocationLandings,
} from "@/lib/taxonomies";

export const dynamic = "force-static";
export const revalidate = 60 * 60;

const staticRoutes = [
  "/",
  "/jobs",
  "/jobs/freshers",
  "/jobs/internships",
  "/jobs/experienced",
  "/jobs/remote",
  "/resume-builder",
  "/blog",
  "/about",
  "/how-we-verify-jobs",
  "/contact",
  "/privacy-policy",
];
const toAbsoluteUrl = (route: string) => {
  const normalizedRoute = route === "/" ? "/" : `${route.replace(/\/+$/, "")}/`;
  return `${siteUrl}${normalizedRoute}`;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, blogs] = await Promise.all([getAllJobs(), getAllBlogs()]);
  const now = new Date();
  const locationLandings = getAllJobLocationLandings(jobs);
  const topicLandings = getAllBlogTopicLandings(blogs);

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: toAbsoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: toAbsoluteUrl(`/jobs/${job.slug}`),
    lastModified: new Date(job.updatedAt || job.date),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: toAbsoluteUrl(`/blog/${blog.slug}`),
    lastModified: new Date(blog.updatedAt || blog.date),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const locationEntries: MetadataRoute.Sitemap = locationLandings.map((item) => ({
    url: toAbsoluteUrl(`/jobs/location/${item.slug}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.75,
  }));

  const topicEntries: MetadataRoute.Sitemap = topicLandings.map((item) => ({
    url: toAbsoluteUrl(`/blog/topic/${item.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.72,
  }));

  return [
    ...staticEntries,
    ...jobEntries,
    ...blogEntries,
    ...locationEntries,
    ...topicEntries,
  ];
}
