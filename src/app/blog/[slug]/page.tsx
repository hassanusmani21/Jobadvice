import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/AppLink";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  formatBlogDate,
  getAllBlogs,
  getBlogBySlug,
  type BlogPost,
} from "@/lib/blogs";
import {
  decodeMarkdownEscapes,
  markdownToBlocks,
  type MarkdownBlock,
} from "@/lib/markdown";
import { toContentSlug } from "@/lib/slug";
import { organizationId, siteLogoUrl, siteName, siteUrl } from "@/lib/site";

type BlogDetailPageProps = {
  params: {
    slug: string;
  };
};

type OutlineItem = {
  id: string;
  level: 2 | 3;
  text: string;
};

type BlogCta = {
  label: string;
  href: string;
  sourceHost: string;
};

type ArticleHeadingBlock = Extract<MarkdownBlock, { type: "heading" }> & {
  anchorId: string;
};

type ArticleRenderBlock =
  | Exclude<MarkdownBlock, { type: "heading" }>
  | ArticleHeadingBlock;

export const dynamicParams = false;

const getBlogDescription = (blog: BlogPost) =>
  blog.summary || blog.excerpt || `${blog.title} | JobAdvice Blog`;

const getRelatedBlogs = (allBlogs: BlogPost[], currentBlog: BlogPost) => {
  const currentTags = new Set(currentBlog.tags.map((tag) => tag.toLowerCase()));
  const currentTopic = currentBlog.topic.toLowerCase();

  const scoredBlogs = allBlogs
    .filter((blog) => blog.slug !== currentBlog.slug)
    .map((blog) => {
      const sharedTagCount = blog.tags.reduce(
        (score, tag) => score + (currentTags.has(tag.toLowerCase()) ? 1 : 0),
        0,
      );
      const sameTopic = blog.topic.toLowerCase() === currentTopic;
      const score =
        (sameTopic ? 10 : 0) +
        sharedTagCount * 4 +
        (sameTopic && sharedTagCount > 0 ? 3 : 0) +
        (blog.isTrending ? 1 : 0);

      return {
        blog,
        freshness: new Date(blog.updatedAt || blog.date).getTime(),
        score,
      };
    })
    .sort((firstItem, secondItem) => {
      if (secondItem.score !== firstItem.score) {
        return secondItem.score - firstItem.score;
      }

      return secondItem.freshness - firstItem.freshness;
    });

  return scoredBlogs.map((item) => item.blog).slice(0, 4);
};

const toPersonJsonLd = (name: string, jobTitle?: string) => ({
  "@type": "Person",
  name,
  ...(jobTitle ? { jobTitle } : {}),
});

const toBlogJsonLd = (blog: BlogPost) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: blog.title,
  description: getBlogDescription(blog),
  datePublished: blog.date,
  dateModified: blog.updatedAt,
  ...(blog.topic ? { articleSection: blog.topic } : {}),
  keywords: [blog.topic, ...blog.tags].filter(Boolean).join(", "),
  author: toPersonJsonLd(blog.author || siteName, blog.authorRole),
  ...(blog.reviewedBy
    ? {
        reviewedBy: toPersonJsonLd(blog.reviewedBy, blog.reviewerRole),
      }
    : {}),
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
  mainEntityOfPage: `${siteUrl}/blog/${blog.slug}/`,
});

const toBreadcrumbJsonLd = (blog: BlogPost) => ({
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
    {
      "@type": "ListItem",
      position: 3,
      name: blog.title,
      item: `${siteUrl}/blog/${blog.slug}/`,
    },
  ],
});

const inlineMarkdownPattern =
  /(\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<]+)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;
const ctaKeywordPattern =
  /\b(register|registration|apply|application|join|sign\s?up|signup|enroll)\b/i;
const plainUrlPattern = /https?:\/\/[^\s<]+/gi;

const normalizeInternalHref = (href: string) => {
  if (!href.startsWith("/")) {
    return href;
  }

  const match = href.match(/^([^?#]*)(.*)$/);
  const pathname = match?.[1] || href;
  const suffix = match?.[2] || "";

  if (
    pathname === "/" ||
    pathname.endsWith("/") ||
    pathname.startsWith("/api") ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return href;
  }

  return `${pathname}/${suffix}`;
};

const trimTrailingUrlPunctuation = (value: string) =>
  value.replace(/[>)\],.;!?]+$/g, "");

const resolveCtaLabel = (value: string) => {
  const normalizedValue = value.toLowerCase();

  if (/\bregister|registration|sign\s?up|signup|enroll\b/.test(normalizedValue)) {
    return "Register Link";
  }

  if (/\bapply|application\b/.test(normalizedValue)) {
    return "Apply Link";
  }

  if (/\bjoin\b/.test(normalizedValue)) {
    return "Join Link";
  }

  return "Link";
};

const resolveUrlHost = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const extractBlogCta = (blog: BlogPost, articleBlocks: ArticleRenderBlock[]) => {
  if (blog.ctaLink) {
    return {
      label: blog.ctaLabel || "Open Link",
      href: blog.ctaLink,
      sourceHost: resolveUrlHost(blog.ctaLink),
    } satisfies BlogCta;
  }

  for (const block of articleBlocks) {
    if (block.type !== "paragraph") {
      continue;
    }

    const urls = Array.from(block.text.match(plainUrlPattern) || []).map(
      trimTrailingUrlPunctuation,
    );

    if (urls.length === 0 || !ctaKeywordPattern.test(block.text)) {
      continue;
    }

    const href = urls[0];
    return {
      label: resolveCtaLabel(block.text),
      href,
      sourceHost: resolveUrlHost(href),
    } satisfies BlogCta;
  }

  return null;
};

const shouldHideCtaParagraph = (block: MarkdownBlock, cta: BlogCta | null) => {
  if (!cta || block.type !== "paragraph" || !block.text.includes(cta.href)) {
    return false;
  }

  const normalizedText = block.text.replace(/\s+/g, " ").trim();
  if (ctaKeywordPattern.test(normalizedText)) {
    return true;
  }

  return normalizedText === cta.href;
};

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
      const href = normalizeInternalHref(match[3]);
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
    } else if (match[4]) {
      const href = trimTrailingUrlPunctuation(match[4]);

      nodes.push(
        <a
          key={`${href}-${startIndex}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium break-all text-teal-800 underline underline-offset-4 transition hover:text-teal-900"
        >
          {href}
        </a>,
      );
    } else if (match[5] || match[6]) {
      nodes.push(
        <strong key={`strong-${startIndex}`}>{match[5] || match[6]}</strong>,
      );
    } else if (match[7]) {
      nodes.push(
        <code
          key={`code-${startIndex}`}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.95em] text-slate-900"
        >
          {match[7]}
        </code>,
      );
    } else if (match[8] || match[9]) {
      nodes.push(<em key={`em-${startIndex}`}>{match[8] || match[9]}</em>);
    }

    lastIndex = startIndex + match[0].length;
  }

  if (lastIndex < normalizedText.length) {
    nodes.push(normalizedText.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : normalizedText;
};

const buildArticleStructure = (blocks: MarkdownBlock[], blogTitle: string) => {
  const anchorCounts = new Map<string, number>();
  const articleBlocks: ArticleRenderBlock[] = [];
  const outline: OutlineItem[] = [];
  const normalizedTitle = toContentSlug(blogTitle);

  for (const [index, block] of blocks.entries()) {
    if (block.type !== "heading") {
      articleBlocks.push(block);
      continue;
    }

    const normalizedHeading = toContentSlug(block.text);
    if (
      articleBlocks.length === 0 &&
      block.level === 1 &&
      normalizedHeading &&
      normalizedHeading === normalizedTitle
    ) {
      continue;
    }

    const baseId = normalizedHeading || `section-${index + 1}`;
    const currentCount = anchorCounts.get(baseId) || 0;
    const nextCount = currentCount + 1;
    anchorCounts.set(baseId, nextCount);

    const anchorId = nextCount === 1 ? baseId : `${baseId}-${nextCount}`;
    const headingBlock = {
      ...block,
      anchorId,
    };

    articleBlocks.push(headingBlock);

    if (block.level === 2 || block.level === 3) {
      outline.push({
        id: anchorId,
        level: block.level,
        text: decodeMarkdownEscapes(block.text),
      });
    }
  }

  return {
    articleBlocks,
    outline,
  };
};

const calloutStyles = {
  note: {
    container:
      "rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-700",
    label: "text-slate-500",
  },
  tip: {
    container:
      "rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950",
    label: "text-emerald-700",
  },
  warning: {
    container:
      "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950",
    label: "text-amber-700",
  },
} as const;

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
  const blogUrl = `${siteUrl}/blog/${blog.slug}/`;

  return {
    title,
    description,
    keywords: [blog.topic, ...blog.tags].filter(Boolean),
    alternates: {
      canonical: `/blog/${blog.slug}/`,
    },
    openGraph: {
      title,
      description,
      url: blogUrl,
      type: "article",
      ...(blog.coverImage
        ? { images: [{ url: blog.coverImage, alt: blog.title }] }
        : {}),
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
  const { articleBlocks, outline } = buildArticleStructure(
    markdownBlocks,
    blog.title,
  );
  const cta = extractBlogCta(blog, articleBlocks);
  const visibleArticleBlocks = articleBlocks.filter(
    (block) => !shouldHideCtaParagraph(block, cta),
  );
  const showTableOfContents =
    outline.length >= 3 || blog.readingTimeMinutes >= 5;
  const structuredData = [toBlogJsonLd(blog), toBreadcrumbJsonLd(blog)];
  const reviewedLabel = blog.reviewedBy
    ? [blog.reviewedBy, blog.reviewerRole].filter(Boolean).join(", ")
    : "";

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <article className="min-w-0 space-y-6 lg:col-span-7">
        <header className="fade-up card-surface min-w-0 rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
          <nav aria-label="Breadcrumb" className="overflow-hidden text-xs text-slate-500">
            <ol className="flex min-w-0 flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="transition hover:text-slate-900">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/blog" className="transition hover:text-slate-900">
                  Blog
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="min-w-0 max-w-full break-words text-slate-700">{blog.title}</li>
            </ol>
          </nav>

          {blog.coverImage ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <Image
                src={blog.coverImage}
                alt={blog.title}
                width={1200}
                height={675}
                priority
                sizes="(min-width: 1024px) 70vw, 100vw"
                className="h-56 w-full object-cover sm:h-72"
              />
            </div>
          ) : null}

          {blog.topic ? (
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-teal-700">
              {blog.topic}
            </p>
          ) : null}

          <h1 className="mt-2 break-words font-serif text-[1.5rem] leading-[1.2] text-slate-900 sm:text-[1.875rem]">
            {blog.title}
          </h1>

          {blog.summary ? (
            <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base">
              {blog.summary}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-600 sm:text-xs">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {blog.readingTimeMinutes} min read
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Published: {formatBlogDate(blog.date)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Updated: {formatBlogDate(blog.updatedAt)}
            </span>
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
                  className="max-w-full break-words rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {showTableOfContents ? (
          <section
            className="fade-up card-surface min-w-0 rounded-3xl px-5 py-4 lg:hidden"
            style={{ animationDelay: "60ms" }}
          >
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                On this page
              </summary>
              <ol className="mt-4 space-y-2 text-sm text-slate-600">
                {outline.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                    <a
                      href={`#${item.id}`}
                      className="transition hover:text-teal-900"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          </section>
        ) : null}

        <section
          className="fade-up card-surface min-w-0 rounded-3xl px-5 py-6 sm:px-8 sm:py-7"
          style={{ animationDelay: "90ms" }}
        >
          <div className="space-y-5 text-sm text-slate-700 sm:text-base">
            {visibleArticleBlocks.map((block, index) => {
              if (block.type === "rule") {
                return <hr key={`rule-${index}`} className="border-slate-200" />;
              }

              if (block.type === "heading") {
                const HeadingTag = block.level <= 2 ? "h2" : "h3";
                const headingClassName =
                  block.level <= 2
                    ? "scroll-mt-24 font-serif text-[1.45rem] leading-tight text-slate-900"
                    : "scroll-mt-24 font-serif text-[1.18rem] leading-tight text-slate-900";

                return (
                  <HeadingTag
                    key={`${block.anchorId}-${index}`}
                    id={block.anchorId}
                    className={headingClassName}
                  >
                    <a
                      href={`#${block.anchorId}`}
                      className="group inline-flex max-w-full items-start gap-2 break-words transition hover:text-teal-900"
                    >
                      <span>{renderInlineMarkdown(block.text)}</span>
                      <span
                        aria-hidden="true"
                        className="pt-1 text-sm text-slate-400 opacity-0 transition group-hover:opacity-100"
                      >
                        #
                      </span>
                    </a>
                  </HeadingTag>
                );
              }

              if (block.type === "callout") {
                const styles = calloutStyles[block.tone];

                return (
                  <div key={`callout-${index}`} className={styles.container}>
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${styles.label}`}
                    >
                      {block.tone}
                    </p>
                    <p className="mt-1 leading-7">
                      {renderInlineMarkdown(block.text)}
                    </p>
                  </div>
                );
              }

              if (block.type === "list") {
                const ListTag = block.ordered ? "ol" : "ul";

                return (
                  <ListTag
                    key={`list-${index}`}
                    className={
                      block.ordered
                        ? "list-decimal space-y-1.5 pl-5 leading-7 marker:font-semibold marker:text-slate-400"
                        : "list-disc space-y-1.5 pl-5 leading-7 marker:text-slate-400"
                    }
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
                    className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"
                  >
                    <table className="min-w-full border-collapse text-left text-sm leading-6">
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
                                className="border-b border-slate-100 px-4 py-3 align-top text-slate-700 last:border-b-0"
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
                <p key={`${block.text}-${index}`} className="whitespace-pre-line break-words leading-7">
                  {renderInlineMarkdown(block.text)}
                </p>
              );
            })}
          </div>

          {cta ? (
            <section className="mt-8 overflow-hidden rounded-2xl border border-teal-200 bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(15,23,42,0.04))]">
              <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="min-w-0">
                  <h2 className="font-serif text-xl text-slate-900">{cta.label}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {cta.sourceHost ? `Official source: ${cta.sourceHost}` : "Official link"}
                  </p>
                </div>
                <a
                  href={cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(15,118,110,0.55)] transition hover:bg-teal-800"
                >
                  Open
                </a>
              </div>
            </section>
          ) : null}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Article information
            </p>
            <div className="mt-3 flex flex-col gap-2 leading-6">
              <p>
                <span className="font-semibold text-slate-900">By:</span>{" "}
                {blog.author || siteName}
                {blog.authorRole ? `, ${blog.authorRole}` : ""}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Published:</span>{" "}
                {formatBlogDate(blog.date)}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Updated:</span>{" "}
                {formatBlogDate(blog.updatedAt)}
              </p>
              {reviewedLabel ? (
                <p>
                  <span className="font-semibold text-slate-900">
                    Reviewed by:
                  </span>{" "}
                  {reviewedLabel}
                  {blog.reviewedAt
                    ? ` on ${formatBlogDate(blog.reviewedAt)}`
                    : ""}
                </p>
              ) : null}
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-500">
              We verify job and career information against official source pages
              where available.{" "}
              <Link
                href="/about#how-we-verify-information"
                className="font-medium text-slate-700 underline underline-offset-4 transition hover:text-slate-900"
              >
                How we verify information
              </Link>
            </p>
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

      <aside className="min-w-0 space-y-5 lg:col-span-3">
        {showTableOfContents ? (
          <section className="fade-up min-w-0 hidden lg:block lg:sticky lg:top-24">
            <div className="card-surface rounded-3xl p-5">
              <h2 className="text-lg font-bold text-slate-900">On this page</h2>
              <ol className="mt-4 space-y-2 text-sm text-slate-600">
                {outline.map((item) => (
                  <li key={item.id} className={item.level === 3 ? "pl-4" : ""}>
                    <a
                      href={`#${item.id}`}
                      className="transition hover:text-teal-900"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        <section
          className="fade-up card-surface min-w-0 rounded-3xl p-5"
          style={{ animationDelay: showTableOfContents ? "90ms" : "0ms" }}
        >
          <h2 className="text-lg font-bold text-slate-900">Read next</h2>
          {relatedBlogs.length > 0 ? (
            <div className="mt-4 space-y-3">
              {relatedBlogs.map((relatedBlog) => (
                <Link
                  key={relatedBlog.slug}
                  href={`/blog/${relatedBlog.slug}`}
                  className="block rounded-2xl border border-slate-200 bg-white/85 p-4 transition hover:border-teal-200 hover:bg-teal-50/70"
                >
                  <p className="break-words text-sm font-semibold leading-6 text-slate-900">
                    {relatedBlog.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {relatedBlog.topic ? `${relatedBlog.topic} • ` : ""}
                    {relatedBlog.readingTimeMinutes} min read
                  </p>
                  {relatedBlog.excerpt ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {relatedBlog.excerpt}
                    </p>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No related articles yet.</p>
          )}
        </section>
      </aside>
    </div>
  );
}
