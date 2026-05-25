import Link from "@/components/AppLink";
import type { ReactNode } from "react";

type AutoInternalLinksProps = {
  text: string;
  className?: string;
};

const inlineLinkedMarkdownPattern =
  /(\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;

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

const renderInlineLinkedMarkdown = (text: string): ReactNode => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(inlineLinkedMarkdownPattern)) {
    const startIndex = match.index ?? 0;

    if (startIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, startIndex));
    }

    if (match[2] && match[3]) {
      const href = normalizeInternalHref(match[3]);
      const externalLink = /^https?:\/\//i.test(href);

      nodes.push(
        externalLink ? (
          <a
            key={`${href}-${startIndex}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-800 underline underline-offset-4 transition hover:text-teal-900"
          >
            {match[2]}
          </a>
        ) : (
          <Link
            key={`${href}-${startIndex}`}
            href={href}
            className="font-medium text-teal-800 underline underline-offset-4 transition hover:text-teal-900"
          >
            {match[2]}
          </Link>
        ),
      );
    } else if (match[4]) {
      nodes.push(
        <code
          key={`code-${startIndex}`}
          className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.95em] text-slate-900"
        >
          {match[4]}
        </code>,
      );
    } else if (match[5] || match[6]) {
      nodes.push(<strong key={`strong-${startIndex}`}>{match[5] || match[6]}</strong>);
    } else if (match[7] || match[8]) {
      nodes.push(<em key={`em-${startIndex}`}>{match[7] || match[8]}</em>);
    }

    lastIndex = startIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
};

export function AutoInternalLinks({ text, className }: AutoInternalLinksProps) {
  return <span className={className}>{renderInlineLinkedMarkdown(text)}</span>;
}

