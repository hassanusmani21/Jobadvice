import type { Metadata } from "next";
import ActionButton from "@/components/ActionButton";
import Link from "@/components/AppLink";
import {
  filterQuestionPaperRecords,
  getAllQuestionPaperRecords,
  getQuestionPaperFilterOptions,
  normalizeQuestionPaperFilters,
  questionPaperResourceOptions,
  sortQuestionPaperRecords,
  type QuestionPaperFilters,
} from "@/lib/questionPapers";
import { createPageMetadata } from "@/lib/seo";

type QuestionPapersPageProps = {
  searchParams?: {
    q?: string | string[];
    resource?: string | string[];
    course?: string | string[];
    branch?: string | string[];
    semester?: string | string[];
    session?: string | string[];
    year?: string | string[];
  };
};

export const metadata: Metadata = createPageMetadata({
  title: "Mumbai University Question Papers and Study Resources",
  description:
    "Search and filter Mumbai University resources including question papers, syllabus, solutions, timetables, model answers, and result notices.",
  path: "/question-papers",
  keywords: [
    "MU question papers",
    "Mumbai University syllabus",
    "MU model answers",
    "MU timetable",
    "semester papers",
  ],
});

const toSingleValue = (rawValue: string | string[] | undefined) => {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  return typeof value === "string" ? value.trim() : "";
};

const hasActiveFilters = (filters: QuestionPaperFilters) =>
  Boolean(
    filters.query ||
      filters.resourceType ||
      filters.course ||
      filters.branch ||
      filters.semester ||
      filters.examSession ||
      filters.examYear,
  );

const quickBranchLinks = [
  { label: "BE Computer Engineering", href: "/question-papers?course=BE&branch=Computer+Engineering" },
  { label: "BE Information Technology", href: "/question-papers?course=BE&branch=Information+Technology" },
  { label: "BSC Information Technology", href: "/question-papers?course=Science&branch=BSC+Information+Technology" },
  { label: "MCA", href: "/question-papers?course=Technology&branch=MCA" },
];

export default function QuestionPapersPage({ searchParams }: QuestionPapersPageProps) {
  const filters = normalizeQuestionPaperFilters({
    query: toSingleValue(searchParams?.q),
    resourceType: toSingleValue(searchParams?.resource),
    course: toSingleValue(searchParams?.course),
    branch: toSingleValue(searchParams?.branch),
    semester: toSingleValue(searchParams?.semester),
    examSession: toSingleValue(searchParams?.session),
    examYear: toSingleValue(searchParams?.year),
  });

  const allRecords = getAllQuestionPaperRecords();
  const filteredRecords = filterQuestionPaperRecords(allRecords, filters);
  const sortedRecords = sortQuestionPaperRecords(filteredRecords);

  const optionsBase = filterQuestionPaperRecords(
    allRecords,
    normalizeQuestionPaperFilters({
      resourceType: filters.resourceType,
      course: filters.course,
      branch: filters.branch,
    }),
  );
  const options = getQuestionPaperFilterOptions(optionsBase.length > 0 ? optionsBase : allRecords);

  return (
    <section className="space-y-6">
      <div className="jobs-directory-toolbar">
        <div className="jobs-directory-topbar">
          <div className="jobs-directory-title-line">
            <span className="jobs-directory-kicker">MU Resources</span>
            <h1 className="jobs-directory-inline-title">Question Papers</h1>
          </div>
          <div className="jobs-directory-count-pill jobs-directory-count-pill-desktop">
            {sortedRecords.length} result{sortedRecords.length === 1 ? "" : "s"}
          </div>
        </div>

        <form
          action="/question-papers"
          method="get"
          className={`jobs-directory-desktop-form jobs-directory-toolbar-form jobs-directory-filter-panel${
            hasActiveFilters(filters) ? " jobs-directory-filter-panel-has-clear" : ""
          }`}
        >
          <label htmlFor="papers-search" className="sr-only">
            Search resource
          </label>
          <input
            id="papers-search"
            name="q"
            type="search"
            defaultValue={filters.query}
            placeholder="Search by subject, branch, or semester"
            className="form-control jobs-directory-control"
          />

          <select
            name="resource"
            defaultValue={filters.resourceType}
            className="form-control jobs-directory-control"
          >
            <option value="">All resources</option>
            {questionPaperResourceOptions.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.label}
              </option>
            ))}
          </select>

          <select name="course" defaultValue={filters.course} className="form-control jobs-directory-control">
            <option value="">All courses</option>
            {options.courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>

          <select name="branch" defaultValue={filters.branch} className="form-control jobs-directory-control">
            <option value="">All branches</option>
            {options.branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>

          <select
            name="semester"
            defaultValue={filters.semester}
            className="form-control jobs-directory-control"
          >
            <option value="">All semesters</option>
            {options.semesters.map((semester) => (
              <option key={semester} value={semester}>
                {semester}
              </option>
            ))}
          </select>

          <select
            name="session"
            defaultValue={filters.examSession}
            className="form-control jobs-directory-control"
          >
            <option value="">All sessions</option>
            {options.sessions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>

          <select name="year" defaultValue={filters.examYear} className="form-control jobs-directory-control">
            <option value="">All years</option>
            {options.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button type="submit" className="jobs-directory-action jobs-directory-action-submit">
            Submit
          </button>

          {hasActiveFilters(filters) ? (
            <Link
              href="/question-papers"
              className="jobs-directory-action jobs-directory-action-clear"
            >
              Reset
            </Link>
          ) : null}
        </form>
      </div>

      <section className="card-surface rounded-2xl p-4 sm:p-5">
        <h2 className="text-base font-semibold text-slate-900">Quick filters</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickBranchLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      {sortedRecords.length > 0 ? (
        <div className="grid gap-4">
          {sortedRecords.map((record) => (
            <article key={record.id} className="card-surface rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.11em] text-emerald-700">
                    {questionPaperResourceOptions.find((resource) => resource.id === record.resourceType)?.label}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold leading-7 text-slate-900">{record.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {record.course} • {record.branch} • {record.semester}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {record.examSession} {record.examYear} • {record.subject} • Source: {record.source}
                  </p>
                </div>

                <ActionButton
                  href={record.fileUrl}
                  external
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  className="sm:w-auto"
                >
                  Open PDF
                </ActionButton>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="card-surface rounded-2xl p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900">No matching resources found</h2>
          <p className="mt-2 text-sm text-slate-600">
            Try clearing one or two filters, or search by just subject name.
          </p>
          <div className="mt-4">
            <ActionButton href="/question-papers" variant="secondary" className="sm:w-auto">
              Reset filters
            </ActionButton>
          </div>
        </section>
      )}
    </section>
  );
}
