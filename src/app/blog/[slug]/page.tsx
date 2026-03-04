import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/AppLink";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import BlogCard from "@/components/BlogCard";
import {
  formatBlogDate,
  getAllBlogs,
  getBlogBySlug,
  type BlogPost,
} from "@/lib/blogs";
import { decodeMarkdownEscapes, markdownToBlocks } from "@/lib/markdown";
import { organizationId, siteLogoUrl, siteName, siteUrl } from "@/lib/site";

type BlogDetailPageProps = {
  params: {
    slug: string;
  };
};

export const dynamicParams = false;

const getBlogDescription = (blog: BlogPost) =>
  blog.summary || blog.excerpt || `${blog.title} | JobAdvice Blog`;

const getRelatedBlogs = (allBlogs: BlogPost[], currentBlog: BlogPost) => {
  const currentTags = new Set(currentBlog.tags.map((tag) => tag.toLowerCase()));

  const scoredBlogs = allBlogs
    .filter((blog) => blog.slug !== currentBlog.slug)
    .map((blog) => {
      const tagScore = blog.tags.reduce(
        (score, tag) => score + (currentTags.has(tag.toLowerCase()) ? 1 : 0),
        0,
      );

      const topicScore =
        blog.topic.toLowerCase() === currentBlog.topic.toLowerCase() ? 2 : 0;

      return {
        blog,
        score: tagScore + topicScore,
      };
    })
    .sort((firstItem, secondItem) => secondItem.score - firstItem.score);

  return scoredBlogs.map((item) => item.blog).slice(0, 4);
};

const toBlogJsonLd = (blog: BlogPost) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: blog.title,
  description: getBlogDescription(blog),
  datePublished: blog.date,
  dateModified: blog.updatedAt,
  ...(blog.topic ? { articleSection: blog.topic } : {}),
  keywords: [blog.topic, ...blog.tags].filter(Boolean).join(", "),
  author: {
    "@type": "Person",
    name: blog.author || "JobAdvice",
  },
  publisher: {
    "@id": organizationId,
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: siteLogoUrl,
    },
  },
  ...(blog.coverImage ? { image: [blog.coverImage] } : {}),
  mainEntityOfPage: `${siteUrl}/blog/${blog.slug}`,
});

const inlineMarkdownPattern =
  /(\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;

const renderInlineMarkdown = (text: string): ReactNode => {
  const normalizedText = decodeMarkdownEscapes(text);
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of normalizedText.matchAll(inlineMarkdownPattern)) {
    const startIndex = match.index ?? 0;

    if (startIndex > lastIndex) {
      nodes.push(normalizedText.slice(lastIndex, startIndex));
    }

    if (match[2] && match[3]) {
      const href = match[3];
      const externalLink = /^https?:\/\//i.test(href);

      nodes.push(
        <a
          key={`${href}-${startIndex}`}
          href={href}
          {...(externalLink
            ? {
                target: "_blank",
                rel: "noopener noreferrer",
              }
            : {})}
          className="font-medium text-teal-800 underline underline-offset-4 transition hover:text-teal-900"
        >
          {match[2]}
        </a>,
      );
    } else if (match[4] || match[5]) {
      nodes.push(<strong key={`strong-${startIndex}`}>{match[4] || match[5]}</strong>);
    } else if (match[6]) {
      nodes.push(
        <code
          key={`code-${startIndex}`}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.95em] text-slate-900"
        >
          {match[6]}
        </code>,
      );
    } else if (match[7] || match[8]) {
      nodes.push(<em key={`em-${startIndex}`}>{match[7] || match[8]}</em>);
    }

    lastIndex = startIndex + match[0].length;
  }

  if (lastIndex < normalizedText.length) {
    nodes.push(normalizedText.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : normalizedText;
};

export async function generateStaticParams() {
  const blogs = await getAllBlogs();
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const blog = await getBlogBySlug(params.slug);

  if (!blog) {
    return {
      title: "Blog Not Found",
      description: "The requested blog post could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${blog.title} | JobAdvice Blog`;
  const description = getBlogDescription(blog);
  const blogUrl = `${siteUrl}/blog/${blog.slug}`;

  return {
    title,
    description,
    keywords: [blog.topic, ...blog.tags].filter(Boolean),
    alternates: {
      canonical: `/blog/${blog.slug}`,
    },
    openGraph: {
      title,
      description,
      url: blogUrl,
      type: "article",
      ...(blog.coverImage ? { images: [{ url: blog.coverImage, alt: blog.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(blog.coverImage ? { images: [blog.coverImage] } : {}),
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = params;

  const blog = await getBlogBySlug(slug);
  if (!blog) {
    notFound();
  }

  const allBlogs = await getAllBlogs();
  const relatedBlogs = getRelatedBlogs(allBlogs, blog);
  const markdownBlocks = markdownToBlocks(blog.content);
  const blogJsonLd = toBlogJsonLd(blog);

  return (
    <div className="grid gap-6 lg:grid-cols-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      <article className="space-y-6 lg:col-span-7">
        <header className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
          {blog.coverImage ? (
            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="h-56 w-full object-cover sm:h-72"
                loading="eager"
              />
            </div>
          ) : null}
          {blog.topic ? (
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              {blog.topic}
            </p>
          ) : null}
          <h1 className="mt-2 font-serif text-[1.5rem] leading-[1.2] text-slate-900 sm:text-[1.875rem]">{blog.title}</h1>
          {blog.summary ? <p className="mt-4 text-sm text-slate-700 sm:text-base">{blog.summary}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-600 sm:text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Published: {formatBlogDate(blog.date)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Updated: {formatBlogDate(blog.updatedAt)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {blog.readingTimeMinutes} min read
            </span>
            {blog.author ? (
              <span className="rounded-full bg-slate-100 px-3 py-1">By {blog.author}</span>
            ) : null}
            {blog.isTrending ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
                Trending
              </span>
            ) : null}
          </div>

          {blog.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <section
          className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-7"
          style={{ animationDelay: "90ms" }}
        >
          <div className="space-y-5 text-sm text-slate-700 sm:text-base">
            {markdownBlocks.map((block, index) => {
              if (block.type === "rule") {
                return <hr key={`rule-${index}`} className="border-slate-200" />;
              }

              if (block.type === "heading") {
                if (block.level <= 2) {
                  return (
                    <h2 key={`${block.text}-${index}`} className="font-serif text-2xl text-slate-900">
                      {renderInlineMarkdown(block.text)}
                    </h2>
                  );
                }

                return (
                  <h3 key={`${block.text}-${index}`} className="font-serif text-xl text-slate-900">
                    {renderInlineMarkdown(block.text)}
                  </h3>
                );
              }

              if (block.type === "list") {
                const ListTag = block.ordered ? "ol" : "ul";

                return (
                  <ListTag
                    key={`list-${index}`}
                    className={block.ordered ? "list-decimal space-y-2 pl-5" : "list-disc space-y-2 pl-5"}
                  >
                    {block.items.map((item) => (
                      <li key={item}>{renderInlineMarkdown(item)}</li>
                    ))}
                  </ListTag>
                );
              }

              if (block.type === "table") {
                return (
                  <div
                    key={`table-${index}`}
                    className="overflow-x-auto rounded-2xl border border-slate-200"
                  >
                    <table className="min-w-full border-collapse text-left text-sm">
                      <thead className="bg-slate-50 text-slate-900">
                        <tr>
                          {block.headers.map((header) => (
                            <th
                              key={header}
                              className="border-b border-slate-200 px-4 py-3 font-semibold"
                            >
                              {renderInlineMarkdown(header)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map((row, rowIndex) => (
                          <tr key={`${row.join("-")}-${rowIndex}`} className="bg-white">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={`${cell}-${cellIndex}`}
                                className="border-b border-slate-100 px-4 py-3 align-top text-slate-700"
                              >
                                {renderInlineMarkdown(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              return (
                <p key={`${block.text}-${index}`} className="leading-8">
                  {renderInlineMarkdown(block.text)}
                </p>
              );
            })}
          </div>
        </section>

        <div className="fade-up" style={{ animationDelay: "150ms" }}>
          <Link
            href="/blog"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:text-teal-900"
          >
            Back to all blogs
          </Link>
        </div>
      </article>

      <aside className="space-y-5 lg:col-span-3">
        <section className="fade-up card-surface rounded-3xl p-5">
          <h2 className="text-lg font-bold text-slate-900">Related Articles</h2>
          {relatedBlogs.length > 0 ? (
            <div className="mt-4 space-y-3">
              {relatedBlogs.map((relatedBlog) => (
                <div key={relatedBlog.slug} className="rounded-xl border border-slate-200 bg-white/80 p-3">
                  <Link
                    href={`/blog/${relatedBlog.slug}`}
                    className="text-sm font-semibold text-slate-900 transition hover:text-teal-900"
                  >
                    {relatedBlog.title}
                  </Link>
                  <p className="mt-1 text-xs text-slate-600">
                    {relatedBlog.topic ? `${relatedBlog.topic} • ` : ""}
                    {relatedBlog.readingTimeMinutes} min read
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No related articles yet.</p>
          )}
        </section>

        <section className="fade-up" style={{ animationDelay: "80ms" }}>
          {relatedBlogs.slice(0, 1).map((featuredBlog) => (
            <BlogCard key={featuredBlog.slug} blog={featuredBlog} />
          ))}
        </section>
      </aside>
    </div>
  );
}
