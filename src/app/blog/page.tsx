import type { Metadata } from "next";
import Link from "next/link";
import BlogCard from "@/components/BlogCard";
import EmptyStateCard from "@/components/EmptyStateCard";
import {
  getAllBlogs,
  getTopBlogTopics,
  getTrendingBlogs,
  type BlogPost,
} from "@/lib/blogs";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read daily career insights, tech updates, and hiring news from JobAdvice.",
  alternates: {
    canonical: "/blog",
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
  const [allBlogs, trendingBlogs, topTopics] = await Promise.all([
    getAllBlogs(),
    getTrendingBlogs(5),
    getTopBlogTopics(6),
  ]);

  const filteredBlogs = query
    ? allBlogs.filter((blog) => matchesSearch(blog, query))
    : allBlogs;

  return (
    <div className="grid gap-6 lg:grid-cols-10">
      <section className="space-y-6 lg:col-span-7">
        <div className="fade-up space-y-4">
          <h1 className="font-serif text-[1.5rem] leading-[1.2] text-slate-900">Blog</h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Daily articles on hiring trends, career growth, interview strategy, and
            practical tech updates.
          </p>

          <form action="/blog" method="get" className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label htmlFor="blog-search" className="sr-only">
              Search blog posts
            </label>
            <input
              id="blog-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search by title, topic, keyword, or tag"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none ring-teal-200 transition focus:border-teal-300 focus:ring-2 sm:col-span-2 xl:col-span-3"
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Search
            </button>
            {query ? (
              <Link
                href="/blog"
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900"
              >
                Clear
              </Link>
            ) : null}
          </form>

          <p className="text-sm text-slate-600">
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
          <p className="rounded-2xl bg-white/80 p-4 text-slate-600">
            No blog posts matched your search. Try another keyword.
          </p>
        ) : null}

        {allBlogs.length === 0 ? (
          <EmptyStateCard
            title="No blogs yet"
            description="This space will fill with articles once blog posts are published."
          />
        ) : null}
      </section>

      <aside className="space-y-5 lg:col-span-3">
        <section className="fade-up card-surface rounded-3xl p-5">
          <h2 className="text-lg font-bold text-slate-900">Top Trending Topics</h2>
          {topTopics.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {topTopics.map((item) => (
                <li key={item.topic} className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700">
                    {item.topic}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Score {item.score}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Trending topics will appear after posts are published.
            </p>
          )}
        </section>

        <section className="fade-up card-surface rounded-3xl p-5" style={{ animationDelay: "90ms" }}>
          <h2 className="text-lg font-bold text-slate-900">Top Trending Blogs</h2>
          {trendingBlogs.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {trendingBlogs.map((blog) => (
                <li key={blog.slug}>
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="block rounded-xl border border-slate-200 bg-white/80 px-4 py-3 transition hover:border-teal-200 hover:bg-teal-50/80"
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
            <p className="mt-3 text-sm text-slate-600">
              Trending posts will appear after publishing.
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
