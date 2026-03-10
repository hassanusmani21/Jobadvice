import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import BlogCard from "@/components/BlogCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import {
  getAllBlogs,
  getLatestBlogs,
  getTopBlogTopics,
  type BlogPost,
} from "@/lib/blogs";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read daily career insights, tech updates, and hiring news from JobAdvice.",
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

  return (
    <div className="grid gap-6 lg:grid-cols-10">
      <section className="space-y-6 lg:col-span-7">
        <div className="fade-up page-intro-surface px-5 py-6 sm:px-8 sm:py-8">
          <span className="page-kicker">Career Articles</span>
          <h1 className="page-title">Blog</h1>
          <p className="page-copy">
            Daily articles on hiring trends, career growth, interview strategy, and
            practical tech updates.
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

        {allBlogs.length === 0 ? (
          <EmptyStateCard title="No blogs yet" />
        ) : null}
      </section>

      <aside className="space-y-5 lg:col-span-3">
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

        <section className="fade-up card-surface rounded-3xl p-5" style={{ animationDelay: "90ms" }}>
          <h2 className="text-lg font-bold text-slate-900">Latest Reads</h2>
          {latestBlogs.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {latestBlogs.map((blog) => (
                <li key={blog.slug}>
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="content-list-card px-4 py-3"
                  >
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
