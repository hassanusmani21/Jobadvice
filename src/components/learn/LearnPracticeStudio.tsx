"use client";

import { useEffect, useMemo, useState } from "react";
import type { LearnPracticeCheck, LearnPracticeConfig } from "@/lib/learn/practice";

type LearnPracticeStudioProps = {
  lessonKey: string;
  practice: LearnPracticeConfig;
};

type CheckResult = {
  id: string;
  label: string;
  passed: boolean;
};

const getStorageKey = (lessonKey: string) => `jobadvice:learn:studio:${lessonKey}`;

const buildStarterState = (practice: LearnPracticeConfig) =>
  Object.fromEntries(practice.files.map((file) => [file.name, file.starter]));

const getCheckSource = (
  check: LearnPracticeCheck,
  fileContents: Record<string, string>,
  fallbackSource: string,
) => {
  if (check.file) {
    return fileContents[check.file] || "";
  }

  return fallbackSource;
};

const includesValue = (source: string, value: string, caseSensitive = false) => {
  if (caseSensitive) {
    return source.includes(value);
  }

  return source.toLowerCase().includes(value.toLowerCase());
};

const evaluateChecks = (
  checks: LearnPracticeCheck[],
  fileContents: Record<string, string>,
): CheckResult[] => {
  const fallbackSource = Object.values(fileContents).join("\n");

  return checks.map((check) => {
    const source = getCheckSource(check, fileContents, fallbackSource);

    if (check.type === "includes") {
      return {
        id: check.id,
        label: check.label,
        passed: includesValue(source, check.value, check.caseSensitive),
      };
    }

    if (check.type === "one_of") {
      return {
        id: check.id,
        label: check.label,
        passed: check.values.some((value) => includesValue(source, value, check.caseSensitive)),
      };
    }

    return {
      id: check.id,
      label: check.label,
      passed: source.trim().length >= check.value,
    };
  });
};

const injectIntoTag = (html: string, closingTag: string, content: string) => {
  if (html.includes(closingTag)) {
    return html.replace(closingTag, `${content}\n${closingTag}`);
  }

  return `${html}\n${content}`;
};

const buildPreviewDocument = (
  practice: LearnPracticeConfig,
  fileContents: Record<string, string>,
) => {
  const htmlFile = practice.previewEntryFile ? fileContents[practice.previewEntryFile] : "";
  if (!htmlFile) {
    return "";
  }

  let html = htmlFile;

  if (practice.previewStylesheetFile) {
    const css = fileContents[practice.previewStylesheetFile] || "";
    const stylesheetPattern = new RegExp(
      `<link[^>]*href=["']${practice.previewStylesheetFile.replace(".", "\\.")}["'][^>]*>`,
      "gi",
    );
    html = html.replace(stylesheetPattern, "");
    html = injectIntoTag(html, "</head>", `<style>${css}</style>`);
  }

  if (practice.previewScriptFile) {
    const js = (fileContents[practice.previewScriptFile] || "").replace(
      /<\/script/gi,
      "<\\/script",
    );
    const scriptPattern = new RegExp(
      `<script[^>]*src=["']${practice.previewScriptFile.replace(".", "\\.")}["'][^>]*><\\/script>`,
      "gi",
    );
    html = html.replace(scriptPattern, "");
    html = injectIntoTag(html, "</body>", `<script>${js}</script>`);
  }

  return html;
};

export default function LearnPracticeStudio({
  lessonKey,
  practice,
}: LearnPracticeStudioProps) {
  const starterState = useMemo(() => buildStarterState(practice), [practice]);
  const [activeFile, setActiveFile] = useState(practice.files[0]?.name || "");
  const [fileContents, setFileContents] = useState<Record<string, string>>(starterState);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [hasRunChecks, setHasRunChecks] = useState(false);
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);

  useEffect(() => {
    const defaultFile = practice.files[0]?.name || "";
    setActiveFile(defaultFile);
    setHasRunChecks(false);
    setCheckResults([]);

    try {
      const storedValue = window.localStorage.getItem(getStorageKey(lessonKey));
      if (!storedValue) {
        setFileContents(starterState);
        setHasHydrated(true);
        return;
      }

      const parsedValue = JSON.parse(storedValue);
      if (!parsedValue || typeof parsedValue !== "object") {
        setFileContents(starterState);
        setHasHydrated(true);
        return;
      }

      setFileContents({
        ...starterState,
        ...Object.fromEntries(
          Object.entries(parsedValue).filter((entry): entry is [string, string] => {
            return typeof entry[0] === "string" && typeof entry[1] === "string";
          }),
        ),
      });
      setHasHydrated(true);
    } catch {
      setFileContents(starterState);
      setHasHydrated(true);
    }
  }, [lessonKey, practice.files, starterState]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(getStorageKey(lessonKey), JSON.stringify(fileContents));
  }, [fileContents, hasHydrated, lessonKey]);

  const activeFileContent = fileContents[activeFile] || "";
  const previewDocument = useMemo(
    () => buildPreviewDocument(practice, fileContents),
    [fileContents, practice],
  );
  const passedCount = checkResults.filter((result) => result.passed).length;

  const updateFileContent = (value: string) => {
    setFileContents((current) => ({
      ...current,
      [activeFile]: value,
    }));
  };

  const runChecks = () => {
    setCheckResults(evaluateChecks(practice.checks, fileContents));
    setHasRunChecks(true);
  };

  const resetStarter = () => {
    setFileContents(starterState);
    setCheckResults([]);
    setHasRunChecks(false);
    window.localStorage.removeItem(getStorageKey(lessonKey));
  };

  const modeLabel =
    practice.mode === "browser_preview"
      ? "Live Preview"
      : practice.mode === "code_editor"
        ? "Code Practice"
        : "Writing Lab";

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
            Practice Studio
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{practice.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{practice.summary}</p>
        </div>

        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
          {modeLabel}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <h3 className="text-lg font-semibold text-slate-900">How to use this lecture workspace</h3>
            <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
              {practice.instructions.map((instruction) => (
                <li key={instruction} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-teal-600" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <div className="flex flex-wrap gap-2">
              {practice.files.map((file) => {
                const isActive = file.name === activeFile;

                return (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => setActiveFile(file.name)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-teal-600 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-teal-500 hover:text-teal-700"
                    }`}
                  >
                    {file.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activeFile}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {practice.files.find((file) => file.name === activeFile)?.language}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={runChecks}
                    className="job-action-button job-action-button-primary"
                  >
                    Run Checks
                  </button>
                  <button
                    type="button"
                    onClick={resetStarter}
                    className="job-action-button job-action-button-secondary"
                  >
                    Reset Starter
                  </button>
                </div>
              </div>

              <textarea
                value={activeFileContent}
                onChange={(event) => updateFileContent(event.target.value)}
                spellCheck={false}
                className="mt-4 min-h-[320px] w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-100 outline-none transition focus:border-teal-500"
              />

              {practice.files.find((file) => file.name === activeFile)?.helperText ? (
                <p className="mt-3 text-sm text-slate-500">
                  {practice.files.find((file) => file.name === activeFile)?.helperText}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {practice.mode === "browser_preview" ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-slate-300">
                <span>Preview</span>
                <span>Rendered from your lesson files</span>
              </div>
              <iframe
                title={`${practice.title} preview`}
                sandbox="allow-scripts"
                srcDoc={previewDocument}
                className="h-[380px] w-full bg-white"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Output
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">
                Use the checks to validate your practice
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                This lesson focuses on structure and thinking, so the useful feedback is whether
                your draft includes the required pieces clearly.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Check Results
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">
                  {hasRunChecks
                    ? `${passedCount} of ${practice.checks.length} checks passed`
                    : "Run checks to see your current result"}
                </h3>
              </div>

              {hasRunChecks ? (
                <div className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                  {Math.round((passedCount / practice.checks.length) * 100)}%
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {(hasRunChecks ? checkResults : practice.checks.map((check) => ({
                id: check.id,
                label: check.label,
                passed: false,
              }))).map((result) => (
                <div
                  key={result.id}
                  className={`rounded-2xl border px-4 py-4 ${
                    hasRunChecks
                      ? result.passed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{result.label}</p>
                    <span className="rounded-full border border-current/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                      {hasRunChecks ? (result.passed ? "Pass" : "Needs Work") : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
