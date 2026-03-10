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
      className="group fade-up card-surface flex h-full flex-col p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-32px_rgba(15,23,42,0.2)]"
      aria-label={`Read ${blog.title}`}
      style={style}
    >
      {coverImageSrc ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <Image
            src={coverImageSrc}
            alt={blog.title}
            width={1200}
            height={720}
            className="h-32 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-36"
            loading="lazy"
            sizes="(min-width: 1024px) 24rem, (min-width: 768px) 50vw, 100vw"
          />
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
        {blog.topic ? <span className="text-teal-700">{blog.topic}</span> : null}
        {blog.isTrending ? (
          <span className="content-chip content-chip-amber">
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
        <span className="content-chip">
          {formatBlogDate(blog.date)}
        </span>
        <span className="content-chip">
          {blog.readingTimeMinutes} min read
        </span>
      </div>
      {blog.tags.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {blog.tags.slice(0, 2).map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="content-chip text-[11px]"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
      <span className="inline-action-label mt-4 w-fit">
        Read Article
      </span>
    </Link>
  );
}
