import Image from "next/image";
import Link from "@/components/AppLink";
import { toDisplayImageSrc } from "@/lib/images";
import { formatBlogDate, type BlogPost } from "@/lib/blogs";

type BlogCardProps = {
  blog: BlogPost;
  style?: React.CSSProperties;
};

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="blog-card-meta-icon">
      <path
        d="M6.25 2.917v2.5M13.75 2.917v2.5M3.75 7.083h12.5M5.417 4.583h9.166a1.667 1.667 0 0 1 1.667 1.667v8.333a1.667 1.667 0 0 1-1.667 1.667H5.417A1.667 1.667 0 0 1 3.75 14.583V6.25a1.667 1.667 0 0 1 1.667-1.667Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="blog-card-meta-icon">
      <path
        d="M10 17.083A7.083 7.083 0 1 0 10 2.917a7.083 7.083 0 0 0 0 14.166ZM10 6.667v3.125l2.083 1.458"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BlogCard({ blog, style }: BlogCardProps) {
  const coverImageSrc = toDisplayImageSrc(blog.coverImage);
  const summary = blog.summary || blog.excerpt;
  const topicLabel = blog.topic || blog.tags[0] || "Career";

  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group fade-up blog-card-surface"
      aria-label={`Read ${blog.title}`}
      style={style}
    >
      <div className="blog-card-media-shell">
        {coverImageSrc ? (
          <Image
            src={coverImageSrc}
            alt={blog.title}
            width={1200}
            height={720}
            className="blog-card-media-image"
            loading="lazy"
            sizes="(min-width: 1024px) 31vw, (min-width: 768px) 50vw, 100vw"
          />
        ) : (
          <div className="blog-card-media-fallback">
            <span className="blog-card-badge blog-card-badge-fallback">
              {topicLabel}
            </span>
          </div>
        )}
      </div>

      <div className="blog-card-content">
        <div className="blog-card-badge-row">
          <span className={`blog-card-badge${blog.isTrending ? " blog-card-badge-trending" : ""}`}>
            {topicLabel}
          </span>
        </div>

        <h2 className="blog-card-title">{blog.title}</h2>

        <p className="blog-card-summary">{summary}</p>

        <div className="blog-card-meta">
          <span className="blog-card-meta-item">
            <CalendarIcon />
            <span>{formatBlogDate(blog.date)}</span>
          </span>
          <span className="blog-card-meta-separator" aria-hidden="true">
            •
          </span>
          <span className="blog-card-meta-item">
            <ClockIcon />
            <span>{blog.readingTimeMinutes} min read</span>
          </span>
        </div>

        <span className="blog-card-cta">
          Read Article
          <span aria-hidden="true" className="blog-card-cta-arrow">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
