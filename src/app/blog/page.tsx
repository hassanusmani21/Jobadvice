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

      <section className="fade-up page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
        <span className="page-kicker">Career Articles</span>
        <h1 className="page-title">Blog</h1>
        <p className="page-copy">
          Explore JobAdvice blog posts on hiring trends, interview preparation, salary insights,
          AI shifts, and career decisions for students, freshers, and early-career professionals.
        </p>

        <form action="/blog" method="get" className="filter-panel mt-5 sm:grid-cols-2 xl:grid-cols-4">
          <label htmlFor="blog-search" className="sr-only">
            Search blog posts
          </label>
          <input
            id="blog-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by title, topic, keyword, or tag"
            className="form-control sm:col-span-2 xl:col-span-3"
          />
          <ActionButton variant="primary" buttonType="submit" className="w-full">
            Search
          </ActionButton>
          {query ? (
            <ActionButton href="/blog" variant="secondary" className="w-full">
              Clear
            </ActionButton>
          ) : null}
        </form>

        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-600">
            {filteredBlogs.length} post{filteredBlogs.length === 1 ? "" : "s"}
            {query ? (
              <>
                {" "}
                for <span className="font-semibold text-slate-800">&quot;{query}&quot;</span>
              </>
            ) : null}
          </p>

          {topTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topTopics.map((item) => (
                <Link
                  key={item.topic}
                  href={{
                    pathname: "/blog",
                    query: { q: item.topic },
                  }}
                  className={`content-chip text-sm transition ${
                    query.toLowerCase() === item.topic.toLowerCase()
                      ? "content-chip-accent"
                      : "hover:border-teal-200 hover:text-teal-900"
                  }`}
                >
                  {item.topic}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredBlogs.map((blog) => (
          <BlogCard key={blog.slug} blog={blog} />
        ))}
      </div>

      {filteredBlogs.length === 0 && query ? (
        <p className="soft-note px-4 py-4 text-slate-600">
          No blog posts matched your search. Try another keyword.
        </p>
      ) : null}

      {allBlogs.length === 0 ? <EmptyStateCard title="No blogs yet" /> : null}
    </div>
  );
}
