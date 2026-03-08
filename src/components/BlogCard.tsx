import Link from "@/components/AppLink";
import { formatBlogDate, type BlogPost } from "@/lib/blogs";

type BlogCardProps = {
  blog: BlogPost;
  style?: React.CSSProperties;
};

export default function BlogCard({ blog, style }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group fade-up card-surface flex h-full flex-col p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-32px_rgba(15,23,42,0.2)]"
      aria-label={`Read ${blog.title}`}
      style={style}
    >
      {blog.coverImage ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="h-32 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-36"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
        {blog.topic ? <span className="text-teal-700">{blog.topic}</span> : null}
        {blog.isTrending ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
            Trending
          </span>
        ) : null}
      </div>
      <h2
        className="mt-2 text-base font-bold leading-[1.35] text-slate-900 transition-colors group-hover:text-teal-900 sm:text-[1.05rem]"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {blog.title}
      </h2>
      {blog.excerpt ? (
        <p
          className="mt-2 text-sm leading-5 text-slate-600"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {blog.excerpt}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {formatBlogDate(blog.date)}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {blog.readingTimeMinutes} min read
        </span>
      </div>
      {blog.tags.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {blog.tags.slice(0, 2).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      <span className="mt-4 inline-flex w-fit rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 transition-colors group-hover:border-teal-300 group-hover:bg-teal-100">
        Read Article
      </span>
    </Link>
  );
}
