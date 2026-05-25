import Link from "@/components/AppLink";
import type { InternalLinkTarget } from "@/lib/internal-linking/link-priority";

type SmartRelatedLinksProps = {
  title?: string;
  links: InternalLinkTarget[];
};

export function SmartRelatedLinks({
  title = "Explore next",
  links,
}: SmartRelatedLinksProps) {
  if (links.length === 0) {
    return null;
  }

  return (
    <nav aria-label={title} className="card-surface rounded-3xl p-5">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <ul className="mt-4 space-y-2">
        {links.slice(0, 6).map((link) => (
          <li key={link.id}>
            <Link
              href={link.href}
              className="block rounded-2xl border border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-900"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

