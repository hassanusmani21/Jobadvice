import Link from "@/components/AppLink";

type LearnBreadcrumbsItem = {
  label: string;
  href?: string;
};

type LearnBreadcrumbsProps = {
  items: LearnBreadcrumbsItem[];
};

export default function LearnBreadcrumbs({ items }: LearnBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition hover:text-slate-800">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "font-semibold text-slate-800" : undefined}>
                  {item.label}
                </span>
              )}

              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
