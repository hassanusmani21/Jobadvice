import type { MetadataRoute } from "next";
import { getAllBlogs } from "@/lib/blogs";
import { getAllJobs } from "@/lib/jobs";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 60 * 60;

const staticRoutes = ["/", "/jobs", "/blog", "/about", "/contact", "/privacy-policy"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, blogs] = await Promise.all([getAllJobs(), getAllBlogs()]);
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${siteUrl}/jobs/${job.slug}`,
    lastModified: new Date(job.updatedAt || job.date),
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${siteUrl}/blog/${blog.slug}`,
    lastModified: new Date(blog.updatedAt || blog.date),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...jobEntries, ...blogEntries];
}
