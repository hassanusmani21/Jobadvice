import Link from "@/components/AppLink";
import type { InternalLinkTarget } from "@/lib/internal-linking/link-priority";

type TopicClusterProps = {
  title: string;
  description?: string;
  links: InternalLinkTarget[];
};

export function TopicCluster({ title, description, links }: TopicClusterProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <section className="card-surface rounded-3xl p-5">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      <div className="mt-4 grid gap-2">
        {links.slice(0, 6).map((link) => (
          <Link
            key={link.id}
            href={link.href}
            className="content-list-card px-4 py-3 text-sm font-semibold text-slate-800 transition hover:text-teal-900"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

