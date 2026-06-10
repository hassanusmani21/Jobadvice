import Link from "@/components/AppLink";

type JobDetailSection = {
  id: string;
  title: string;
  content:
    | {
        kind: "text";
        value: string;
      }
    | {
        kind: "list";
        items: string[];
        bullet?: boolean;
      }
    | {
        kind: "chips";
        items: string[];
        tone: "teal" | "slate";
        links?: Record<string, string>;
      };
  animationDelayMs?: number;
};

type JobDetailSectionsProps = {
  sections: JobDetailSection[];
};

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const renderSectionContent = (content: JobDetailSection["content"]) => {
  if (content.kind === "text") {
    return <p className="whitespace-pre-line leading-7 text-slate-700">{content.value}</p>;
  }

  if (content.kind === "list") {
    return (
      <ul
        className={joinClasses(
          "mt-1 space-y-2 text-slate-700",
          content.bullet && "list-disc pl-5",
        )}
      >
        {content.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="mt-1 flex flex-wrap gap-2">
      {content.items.map((item) => (
        <li
          key={item}
          className={joinClasses(
            "rounded-full px-3 py-1 text-sm font-medium",
            content.tone === "teal"
              ? "border border-teal-200 bg-teal-50 text-teal-900"
              : "border border-slate-200 bg-slate-100 text-slate-800",
          )}
        >
          {content.links?.[item] ? (
            <Link href={content.links[item]} className="transition hover:text-teal-700">
              {item}
            </Link>
          ) : (
            item
          )}
        </li>
      ))}
    </ul>
  );
};

export default function JobDetailSections({
  sections,
}: JobDetailSectionsProps) {
  const visibleSections = sections.filter((section) => {
    if (section.content.kind === "text") {
      return Boolean(section.content.value.trim());
    }

    return section.content.items.length > 0;
  });

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {visibleSections.map((section) => (
          <section
            key={section.id}
            className="fade-up job-detail-mobile-section card-surface rounded-2xl px-5 py-5"
            style={
              section.animationDelayMs
                ? { animationDelay: `${section.animationDelayMs}ms` }
                : undefined
            }
          >
            <h2 className="font-serif text-[1.35rem] leading-tight text-slate-900">
              {section.title}
            </h2>
            <div className="mt-3 text-[0.95rem] leading-7">
              {renderSectionContent(section.content)}
            </div>
          </section>
        ))}
      </div>

      <div className="hidden space-y-6 md:block">
        {visibleSections.map((section) => (
          <section
            key={section.id}
            className="fade-up card-surface rounded-3xl px-8 py-8"
            style={
              section.animationDelayMs
                ? { animationDelay: `${section.animationDelayMs}ms` }
                : undefined
            }
          >
            <h2 className="font-serif text-3xl text-slate-900">{section.title}</h2>
            <div className="mt-5">{renderSectionContent(section.content)}</div>
          </section>
        ))}
      </div>
    </>
  );
}
