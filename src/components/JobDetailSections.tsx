"use client";

import Link from "@/components/AppLink";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const visibleSections = useMemo(
    () =>
      sections.filter((section) => {
        if (section.content.kind === "text") {
          return Boolean(section.content.value.trim());
        }

        return section.content.items.length > 0;
      }),
    [sections],
  );
  const [openSectionId, setOpenSectionId] = useState<string | null>(
    visibleSections[0]?.id || null,
  );

  useEffect(() => {
    setOpenSectionId((current) => {
      if (current && visibleSections.some((section) => section.id === current)) {
        return current;
      }

      return visibleSections[0]?.id || null;
    });
  }, [visibleSections]);

  if (visibleSections.length === 0) {
    return null;
  }

  const handleOpenSection = (sectionId: string) => {
    setOpenSectionId(sectionId);

    requestAnimationFrame(() => {
      const button = buttonRefs.current[sectionId];

      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const topSafeZone = 108;
      const bottomSafeZone = window.innerHeight - 120;

      if (rect.top < topSafeZone || rect.bottom > bottomSafeZone) {
        button.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    });
  };

  return (
    <>
      <div className="space-y-6 md:hidden">
        {visibleSections.map((section) => {
          const isOpen = openSectionId === section.id;

          return (
            <section
              key={section.id}
              className={joinClasses(
                "fade-up resume-accordion-section card-surface rounded-3xl",
                isOpen && "resume-accordion-section-open",
              )}
              style={
                section.animationDelayMs
                  ? { animationDelay: `${section.animationDelayMs}ms` }
                  : undefined
              }
            >
              <button
                type="button"
                className="resume-accordion-toggle px-6 py-6 sm:px-8 sm:py-6"
                aria-expanded={isOpen}
                ref={(element) => {
                  buttonRefs.current[section.id] = element;
                }}
                onClick={() => handleOpenSection(section.id)}
              >
                <span className="resume-accordion-head">
                  <span className="font-serif text-2xl text-slate-900">
                    {section.title}
                  </span>
                </span>
                <span className="resume-accordion-icon" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              <div
                className={joinClasses(
                  "resume-accordion-panel",
                  isOpen && "resume-accordion-panel-open",
                )}
                aria-hidden={!isOpen}
              >
                <div className="resume-accordion-panel-inner">
                  <div className="resume-accordion-body px-6 pb-6 sm:px-8 sm:pb-6">
                    {renderSectionContent(section.content)}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
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
