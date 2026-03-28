import Image from "next/image";
import Link from "@/components/AppLink";
import { toDisplayImageSrc } from "@/lib/images";
import { formatBlogDate, type BlogPost } from "@/lib/blogs";

type BlogCardProps = {
  blog: BlogPost;
  style?: React.CSSProperties;
};

export default function BlogCard({ blog, style }: BlogCardProps) {
  const coverImageSrc = toDisplayImageSrc(blog.coverImage);

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group fade-up card-surface flex h-full flex-col overflow-hidden p-0 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-32px_rgba(15,23,42,0.2)]"
      aria-label={`Read ${blog.title}`}
      style={style}
    >
      <div className="relative border-b border-slate-200 bg-slate-100">
        {coverImageSrc ? (
          <Image
            src={coverImageSrc}
            alt={blog.title}
            width={1200}
            height={720}
            className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            sizes="(min-width: 1024px) 24rem, (min-width: 768px) 50vw, 100vw"
          />
        ) : (
          <div className="flex h-48 items-end bg-[linear-gradient(135deg,#0f172a,#134e4a)] p-4">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90">
              {blog.topic || "JobAdvice"}
            </span>
          </div>
        )}
      </div>

      <div className="flex h-full flex-col p-4">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
          {blog.topic ? <span className="text-teal-700">{blog.topic}</span> : null}
          {blog.isTrending ? (
            <span className="content-chip content-chip-amber">
              Trending
            </span>
          ) : null}
        </div>
        <h2
          className="mt-3 text-lg font-bold leading-[1.35] text-slate-900 transition-colors group-hover:text-teal-900"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {blog.title}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-600">
          <span className="content-chip">
            {formatBlogDate(blog.date)}
          </span>
          <span className="content-chip">
            {blog.readingTimeMinutes} min read
          </span>
        </div>
        <span className="inline-action-label mt-4 w-fit">
          Read Article
        </span>
      </div>
    </Link>
  );
}
