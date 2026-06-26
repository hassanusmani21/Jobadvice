import type { MetadataRoute } from "next";
import { getAllBlogs } from "@/lib/blogs";
import { getAllJobs, hasStrongPublicJobContent } from "@/lib/jobs";
import { siteUrl } from "@/lib/site";
import { getAllBlogTopicLandings } from "@/lib/taxonomies";

export const dynamic = "force-static";
export const revalidate = 60 * 60;

const staticRoutes = [
  "/",
  "/resume-builder",
  "/blog",
  "/about",
  "/editorial-policy",
  "/how-we-verify-jobs",
  "/contact",
  "/terms",
  "/privacy-policy",
];
const toAbsoluteUrl = (route: string) => {
  const normalizedRoute = route === "/" ? "/" : `${route.replace(/\/+$/, "")}/`;
  return `${siteUrl}${normalizedRoute}`;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [jobs, blogs] = await Promise.all([getAllJobs(), getAllBlogs()]);
  const now = new Date();
  const indexableJobs = jobs.filter(hasStrongPublicJobContent);
  const topicLandings = getAllBlogTopicLandings(blogs);

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: toAbsoluteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : 0.7,
  }));

  const jobEntries: MetadataRoute.Sitemap = indexableJobs
    .map((job) => ({
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
    ...topicEntries,
  ];
}
