import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import BlogCard from "@/components/BlogCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import { getAllBlogs } from "@/lib/blogs";
import { createPageMetadata } from "@/lib/seo";
import {
  getAllBlogTopicLandings,
  getBlogTopicLandingBySlug,
  getBlogsForTopicSlug,
} from "@/lib/taxonomies";
import { siteName, siteUrl } from "@/lib/site";

type BlogTopicPageProps = {
  params: {
    topic: string;
  };
};

export const dynamicParams = false;
export const revalidate = 60 * 60;

const toCollectionJsonLd = (topic: string, slug: string, blogCount: number) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `${topic} Articles | ${siteName}`,
  description: `Browse ${topic} articles, explainers, and career guidance on ${siteName}.`,
  url: `${siteUrl}/blog/topic/${slug}/`,
  isPartOf: {
    "@type": "WebSite",
    url: siteUrl,
    name: siteName,
  },
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: blogCount,
  },
});

const toBreadcrumbJsonLd = (topic: string, slug: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Blog",
      item: `${siteUrl}/blog/`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: topic,
      item: `${siteUrl}/blog/topic/${slug}/`,
    },
  ],
});

export async function generateStaticParams() {
  const blogs = await getAllBlogs();
  return getAllBlogTopicLandings(blogs).map((item) => ({
    topic: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogTopicPageProps): Promise<Metadata> {
  const blogs = await getAllBlogs();
  const landing = getBlogTopicLandingBySlug(blogs, params.topic);

  if (!landing) {
    return {
      title: "Blog Topic",
    };
  }

  return {
    ...createPageMetadata({
      title: `${landing.label} Articles`,
      description: `Read ${landing.label} articles, explainers, hiring analysis, and job-search guidance on ${siteName}.`,
      path: `/blog/topic/${landing.slug}/`,
      keywords: [landing.label, `${landing.label} careers`, "career guidance"],
    }),
  };
}

export default async function BlogTopicPage({ params }: BlogTopicPageProps) {
  const blogs = await getAllBlogs();
  const landing = getBlogTopicLandingBySlug(blogs, params.topic);
  const topicBlogs = getBlogsForTopicSlug(blogs, params.topic);

  if (!landing || topicBlogs.length === 0) {
    notFound();
  }

  const alternateTopics = getAllBlogTopicLandings(blogs)
    .filter((item) => item.slug !== landing.slug)
    .slice(0, 8);
  const structuredData = [
    toCollectionJsonLd(landing.label, landing.slug, topicBlogs.length),
    toBreadcrumbJsonLd(landing.label, landing.slug),
  ];

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="fade-up page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <span className="page-kicker">Blog Topic</span>
        <h1 className="page-title">{landing.label} articles and guides</h1>
        <p className="page-copy">
          Read practical {landing.label.toLowerCase()} coverage from {siteName}, including explainers,
          trends, and career guidance written for students and early-career job seekers.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Articles
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {topicBlogs.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">Focused pieces in this topic cluster.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Latest Update
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {topicBlogs[0]?.date || "-"}
            </p>
            <p className="mt-1 text-sm text-slate-600">Recent publishing cadence for this theme.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Topic
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
              {landing.label}
            </p>
            <p className="mt-1 text-sm text-slate-600">A browsable content hub for this subject.</p>
          </div>
        </div>

        {alternateTopics.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/blog" className="content-chip content-chip-accent text-sm">
              All Articles
            </Link>
            {alternateTopics.map((item) => (
              <Link
                key={item.slug}
                href={`/blog/topic/${item.slug}`}
                className="content-chip text-sm transition hover:border-teal-200 hover:text-teal-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ActionButton href="/blog" variant="primary" className="sm:w-auto">
            Browse All Articles
          </ActionButton>
          <ActionButton href="/jobs" variant="secondary" className="sm:w-auto">
            Browse Jobs
          </ActionButton>
        </div>
      </section>

      <section className="space-y-5">
        <div className="fade-up section-header" style={{ animationDelay: "90ms" }}>
          <div className="section-header-body">
            <h2 className="section-header-title">{landing.label} posts</h2>
            <p className="section-header-copy">
              A topic hub for readers who want one place to catch up on this subject.
            </p>
          </div>
          <Link href="/blog" className="section-header-link group">
            <span>See full blog archive</span>
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>

        {topicBlogs.length > 0 ? (
          <ul className="blog-directory-grid">
            {topicBlogs.map((blog) => (
              <li key={blog.slug} className="min-w-0">
                <BlogCard blog={blog} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyStateCard title={`No articles found for ${landing.label}`} />
        )}
      </section>
    </div>
  );
}
