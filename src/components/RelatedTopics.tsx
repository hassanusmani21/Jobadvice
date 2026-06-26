import Link from "@/components/AppLink";
import type { InternalLinkTarget } from "@/lib/internal-linking/link-priority";

type RelatedTopicsProps = {
  title?: string;
  topics: InternalLinkTarget[];
  className?: string;
};

export function RelatedTopics({
  title = "Related topics",
  topics,
  className = "",
}: RelatedTopicsProps) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <section className={className}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {topics.slice(0, 10).map((topic) => (
          <Link
            key={topic.id}
            href={topic.href}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
          >
            {topic.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

