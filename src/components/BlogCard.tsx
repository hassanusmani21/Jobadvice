import Link from "@/components/AppLink";
import { formatBlogDate, type BlogPost } from "@/lib/blogs";

type BlogCardProps = {
  blog: BlogPost;
};

export default function BlogCard({ blog }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group fade-up card-surface flex h-full flex-col p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-32px_rgba(15,23,42,0.2)]"
      aria-label={`Read ${blog.title}`}
    >
      {blog.coverImage ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
        {blog.topic ? <span className="text-teal-700">{blog.topic}</span> : null}
        {blog.isTrending ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
            Trending
          </span>
        ) : null}
      </div>
      <h2 className="mt-3 text-[1.125rem] font-bold leading-[1.35] text-slate-900 transition-colors group-hover:text-teal-900">
        {blog.title}
      </h2>
      {blog.excerpt ? <p className="mt-2 text-sm leading-6 text-slate-600">{blog.excerpt}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {formatBlogDate(blog.date)}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {blog.readingTimeMinutes} min read
        </span>
      </div>
      {blog.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {blog.tags.slice(0, 3).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      <span className="mt-5 inline-flex w-fit rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900 transition-colors group-hover:border-teal-300 group-hover:bg-teal-100">
        Read Article
      </span>
    </Link>
  );
}
