import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import BlogCard from "@/components/BlogCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import {
  getAllBlogs,
  getTopBlogTopics,
  type BlogPost,
} from "@/lib/blogs";
import { siteName, siteUrl } from "@/lib/site";
import { toBlogTopicSlug } from "@/lib/taxonomies";

export const metadata: Metadata = {
  title: "Career Advice, Interview Tips, and Hiring News",
  description:
    "Read career advice, interview tips, hiring news, salary insights, and practical job-search guidance for students and early-career job seekers in India.",
  alternates: {
    canonical: "/blog/",
  },
};

type BlogPageProps = {
  searchParams?: {
    q?: string | string[];
  };
};

const toSearchQuery = (rawValue: string | string[] | undefined) => {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  return typeof value === "string" ? value.trim() : "";
};

const matchesSearch = (blog: BlogPost, query: string) => {
  const haystack = [
    blog.title,
    blog.summary,
    blog.topic,
    blog.excerpt,
    blog.tags.join(" "),
    blog.content,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
};

const toCollectionJsonLd = (blogs: BlogPost[]) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `${siteName} Blog`,
  description:
    "Career advice, hiring news, interview preparation, and tech job-market analysis for students and early-career professionals in India.",
  url: `${siteUrl}/blog/`,
  isPartOf: {
    "@type": "WebSite",
    url: siteUrl,
    name: siteName,
  },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: blogs.slice(0, 12).map((blog, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/blog/${blog.slug}/`,
      name: blog.title,
    })),
  },
});

const toBreadcrumbJsonLd = () => ({
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
  ],
});

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const query = toSearchQuery(searchParams?.q);
  const [allBlogs, topTopics] = await Promise.all([getAllBlogs(), getTopBlogTopics(8)]);

  const filteredBlogs = query
    ? allBlogs.filter((blog) => matchesSearch(blog, query))
    : allBlogs;
  const structuredData = [toCollectionJsonLd(allBlogs), toBreadcrumbJsonLd()];

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="fade-up jobs-directory-toolbar">
        <div className="jobs-directory-topbar">
          <div className="jobs-directory-title-line">
            <span className="jobs-directory-kicker">Career Articles</span>
            <h1 className="jobs-directory-inline-title">Blog</h1>
          </div>
          <div className="jobs-directory-count-pill jobs-directory-count-pill-desktop">
            {filteredBlogs.length} post{filteredBlogs.length === 1 ? "" : "s"}
          </div>
        </div>

        <form action="/blog" method="get" className="jobs-directory-mobile-form">
          <div className="jobs-directory-mobile-search-row">
            <label htmlFor="blog-mobile-search" className="sr-only">
              Search blog posts
            </label>
            <input
              id="blog-mobile-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search by title, topic, keyword, or tag"
              className="form-control jobs-directory-control jobs-directory-mobile-search-input"
            />

            <button
              type="submit"
              className="jobs-directory-mobile-search-button"
              aria-label="Search blog posts"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                <path
                  d="m14.5 14.5 3 3m-1.5-8a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </div>

          {query ? (
            <ActionButton
              href="/blog"
              variant="secondary"
              className="jobs-directory-action w-full"
            >
              Clear
            </ActionButton>
          ) : null}
        </form>

        <form
          action="/blog"
          method="get"
          className={`jobs-directory-desktop-form jobs-directory-toolbar-form blog-directory-filter-panel${
            query ? " blog-directory-filter-panel-has-clear" : ""
          }`}
        >
          <label htmlFor="blog-search" className="sr-only">
            Search blog posts
          </label>
          <input
            id="blog-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by title, topic, keyword, or tag"
            className="form-control jobs-directory-control"
          />
          <ActionButton
            variant="primary"
            buttonType="submit"
            className="jobs-directory-action w-full"
          >
            Search
          </ActionButton>
          {query ? (
            <ActionButton
              href="/blog"
              variant="secondary"
              className="jobs-directory-action w-full"
            >
              Clear
            </ActionButton>
          ) : null}
        </form>

        {topTopics.length > 0 ? (
          <div className="blog-directory-topic-row">
            {topTopics.map((item) => (
              <Link
                key={item.topic}
                href={`/blog/topic/${toBlogTopicSlug(item.topic)}`}
                className="content-chip blog-directory-topic-chip text-sm transition hover:border-teal-200 hover:text-teal-900"
              >
                {item.topic}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <ul className="blog-directory-grid">
        {filteredBlogs.map((blog) => (
          <li key={blog.slug} className="min-w-0">
            <BlogCard blog={blog} />
          </li>
        ))}
      </ul>

      {filteredBlogs.length === 0 && query ? (
        <p className="soft-note px-4 py-4">
          No blog posts matched your search. Try another keyword.
        </p>
      ) : null}

      {allBlogs.length === 0 ? <EmptyStateCard title="No blogs yet" /> : null}
    </div>
  );
}
