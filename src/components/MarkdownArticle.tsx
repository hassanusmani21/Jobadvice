import type { ReactNode } from "react";
import Image from "next/image";
import { decodeMarkdownEscapes, type MarkdownBlock } from "@/lib/markdown";
import { toDisplayImageSrc } from "@/lib/images";

const inlineMarkdownPattern =
  /(\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s<]+)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;

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
      const href = match[4];

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

type MarkdownArticleProps = {
  blocks: MarkdownBlock[];
};

export default function MarkdownArticle({ blocks }: MarkdownArticleProps) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5 text-sm text-slate-700 sm:text-base">
      {blocks.map((block, index) => {
        if (block.type === "rule") {
          return <hr key={`rule-${index}`} className="border-slate-200" />;
        }

        if (block.type === "heading") {
          const HeadingTag = block.level <= 2 ? "h2" : "h3";
          const headingClassName =
            block.level <= 2
              ? "font-serif text-[1.45rem] leading-tight text-slate-900"
              : "font-serif text-[1.16rem] leading-tight text-slate-900";

          return (
            <HeadingTag key={`${block.text}-${index}`} className={headingClassName}>
              {renderInlineMarkdown(block.text)}
            </HeadingTag>
          );
        }

        if (block.type === "callout") {
          const styles = calloutStyles[block.tone];

          return (
            <div key={`callout-${index}`} className={styles.container}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${styles.label}`}>
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

        if (block.type === "image") {
          const imageSrc = toDisplayImageSrc(block.src);
          if (!imageSrc) {
            return null;
          }

          return (
            <figure
              key={`${block.src}-${index}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <Image
                src={imageSrc}
                alt={block.alt || "Article image"}
                width={1400}
                height={788}
                className="h-auto w-full"
                loading="lazy"
                sizes="(min-width: 1024px) 66vw, 100vw"
              />
              {block.title || block.alt ? (
                <figcaption className="px-4 py-3 text-xs leading-5 text-slate-500">
                  {block.title || block.alt}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        return (
          <p key={`${block.text}-${index}`} className="whitespace-pre-line break-words leading-7">
            {renderInlineMarkdown(block.text)}
          </p>
        );
      })}
    </div>
  );
}
