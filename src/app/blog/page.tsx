import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import BlogCard from "@/components/BlogCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import {
  formatBlogDate,
  getAllBlogs,
  getLatestBlogs,
  getTopBlogTopics,
  type BlogPost,
} from "@/lib/blogs";
import { siteName, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read career advice, hiring news, interview preparation tips, salary insights, and practical tech updates for job seekers in India.",
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

const topicDescriptions: Record<string, string> = {
  "Hiring News":
    "Track company updates, fresher openings, campus drives, layoffs, and hiring signals that matter to job seekers in India.",
  "Interview Prep":
    "Use practical interview breakdowns, test strategy notes, and role-specific preparation guidance before you apply.",
  AI: "Follow how AI is changing hiring, salaries, developer workflows, and entry-level career paths across tech and non-tech roles.",
  "Career Growth":
    "Read about promotions, skill building, workplace patterns, and decisions that affect salary growth and role progression.",
  "Study Abroad":
    "Understand admissions, costs, exams, scholarships, and planning steps for Indian students considering international education.",
  "Work From Home":
    "Find realistic remote-work guidance, student-friendly role ideas, and context around flexible job options.",
};

const getTopicDescription = (topic: string) =>
  topicDescriptions[topic] ||
  "Explore curated career writing, job-market context, and practical guidance connected to current hiring trends.";

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
  const [allBlogs, latestBlogs, topTopics] = await Promise.all([
    getAllBlogs(),
    getLatestBlogs(5),
    getTopBlogTopics(6),
  ]);

  const filteredBlogs = query
    ? allBlogs.filter((blog) => matchesSearch(blog, query))
    : allBlogs;
  const latestPublishedBlog = allBlogs[0] || null;
  const topicCount = new Set(allBlogs.map((blog) => blog.topic).filter(Boolean)).size;
  const featuredTopics = topTopics.slice(0, 3);
  const structuredData = [toCollectionJsonLd(allBlogs), toBreadcrumbJsonLd()];

  return (
    <div className="grid gap-6 lg:grid-cols-10">
      <section className="space-y-6 lg:col-span-7">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <div className="fade-up page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
          <span className="page-kicker">Career Articles</span>
          <h1 className="page-title">Blog</h1>
          <p className="page-copy">
            JobAdvice publishes practical career writing for students, freshers, and
            early-career professionals in India. The blog focuses on hiring trends,
            interview preparation, salary signals, career growth decisions, and
            readable breakdowns of fast-moving tech news.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Published Posts
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{allBlogs.length}</p>
              <p className="mt-1 text-sm text-slate-600">
                Searchable articles across job-market updates, interview prep, and career advice.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Covered Topics
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{topicCount}</p>
              <p className="mt-1 text-sm text-slate-600">
                Topic clusters designed to help readers find useful context, not just headlines.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Latest Update
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">
                {latestPublishedBlog ? formatBlogDate(latestPublishedBlog.date) : "Awaiting posts"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {latestPublishedBlog
                  ? `Newest article: ${latestPublishedBlog.title}`
                  : "New articles appear here as soon as they are published."}
              </p>
            </div>
          </div>

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

          <p className="mt-4 text-sm text-slate-600">
            {filteredBlogs.length} post{filteredBlogs.length === 1 ? "" : "s"}
            {query ? (
              <>
                {" "}
                for <span className="font-semibold text-slate-800">&quot;{query}&quot;</span>
              </>
            ) : null}
          </p>
        </div>

        <section
          className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8"
          style={{ animationDelay: "70ms" }}
        >
          <h2 className="font-serif text-2xl text-slate-900">Why this blog exists</h2>
          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700 sm:text-[15px]">
            <p>
              Most career content is either too generic or too reactive. This page is built as a
              central resource where readers can track real hiring shifts, understand what they
              mean, and quickly move from news to action.
            </p>
            <p>
              Alongside role updates on the jobs side of JobAdvice, the blog gives context around
              interviews, workplace trends, AI-driven changes in hiring, and decision-making for
              students and freshers planning their next move.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Hiring context</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Follow company updates, role demand, fresher openings, and job-market shifts with
                enough context to act on them.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Preparation support</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use interview prep posts, coding challenge guides, and selection insights to focus
                on the next round instead of searching scattered advice.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Career decisions</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Read practical breakdowns on salary, promotions, study paths, and AI&apos;s impact on
                long-term career planning in India.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
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

        {featuredTopics.length > 0 ? (
          <section
            className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8"
            style={{ animationDelay: "110ms" }}
          >
            <h2 className="font-serif text-2xl text-slate-900">Popular reading paths</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-[15px]">
              These topic clusters make the archive easier to navigate and help readers move from a
              broad interest area to specific articles.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {featuredTopics.map((item) => (
                <div
                  key={item.topic}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                    {item.topic}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {getTopicDescription(item.topic)}
                  </p>
                  <Link
                    href={{
                      pathname: "/blog",
                      query: { q: item.topic },
                    }}
                    className="inline-action-label mt-4 w-fit"
                  >
                    Explore topic
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <aside className="space-y-5 lg:col-span-3">
        <section
          className="fade-up card-surface rounded-3xl p-5"
          style={{ animationDelay: "60ms" }}
        >
          <h2 className="text-lg font-bold text-slate-900">What readers can do here</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <p>
              Use the blog to understand hiring signals before you apply, then switch to the
              <Link href="/jobs" className="ml-1 font-medium text-slate-900 underline underline-offset-4">
                jobs page
              </Link>
              to find active openings.
            </p>
            <p>
              If you want to understand how JobAdvice verifies information and organizes content,
              visit
              <Link
                href="/about#how-we-verify-information"
                className="ml-1 font-medium text-slate-900 underline underline-offset-4"
              >
                our verification process
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="fade-up card-surface rounded-3xl p-5">
          <h2 className="text-lg font-bold text-slate-900">Topics</h2>
          {topTopics.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {topTopics.map((item) => (
                <li key={item.topic}>
                  <Link
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
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No topics yet.</p>
          )}
        </section>

        <section
          className="fade-up card-surface rounded-3xl p-5"
          style={{ animationDelay: "90ms" }}
        >
          <h2 className="text-lg font-bold text-slate-900">Latest Reads</h2>
          {latestBlogs.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {latestBlogs.map((blog) => (
                <li key={blog.slug}>
                  <Link href={`/blog/${blog.slug}`} className="content-list-card px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{blog.title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {blog.topic ? `${blog.topic} • ` : ""}
                      {blog.readingTimeMinutes} min read
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No blogs yet.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
