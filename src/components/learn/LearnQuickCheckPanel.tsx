"use client";

import { useEffect, useMemo, useState } from "react";

type LearnQuickCheckPanelProps = {
  lessonKey: string;
  questions: string[];
};

const getStorageKey = (lessonKey: string) => `jobadvice:learn:quick-check:${lessonKey}`;

export default function LearnQuickCheckPanel({
  lessonKey,
  questions,
}: LearnQuickCheckPanelProps) {
  const [reviewedIndexes, setReviewedIndexes] = useState<number[]>([]);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(getStorageKey(lessonKey));
      if (!storedValue) {
        setReviewedIndexes([]);
        return;
      }

      const parsedValue = JSON.parse(storedValue);
      if (!Array.isArray(parsedValue)) {
        setReviewedIndexes([]);
        return;
      }

      setReviewedIndexes(parsedValue.filter((value): value is number => Number.isInteger(value)));
    } catch {
      setReviewedIndexes([]);
    }
  }, [lessonKey]);

  const reviewedSet = useMemo(() => new Set(reviewedIndexes), [reviewedIndexes]);
  const reviewedCount = reviewedIndexes.length;
  const progressPercentage = questions.length
    ? Math.round((reviewedCount / questions.length) * 100)
    : 0;

  const updateReviewedIndexes = (nextIndexes: number[]) => {
    setReviewedIndexes(nextIndexes);
    window.localStorage.setItem(getStorageKey(lessonKey), JSON.stringify(nextIndexes));
  };

  const toggleReviewed = (index: number) => {
    if (reviewedSet.has(index)) {
      updateReviewedIndexes(reviewedIndexes.filter((value) => value !== index));
      return;
    }

    updateReviewedIndexes([...reviewedIndexes, index].sort((left, right) => left - right));
  };

  const resetAll = () => {
    setReviewedIndexes([]);
    window.localStorage.removeItem(getStorageKey(lessonKey));
  };

  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-700">
            Quick Check
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Confirm the idea before moving on
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            These are reflection prompts, not locked exam questions. Review each one after you can
            answer it clearly in your own words.
          </p>
        </div>

        <button
          type="button"
          onClick={resetAll}
          className="job-action-button job-action-button-secondary"
        >
          Reset
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="h-3 w-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-500 transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="px-4 py-3 text-sm text-slate-600">
          {reviewedCount} of {questions.length} prompts reviewed
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {questions.map((question, index) => {
          const reviewed = reviewedSet.has(index);

          return (
            <article
              key={`${lessonKey}-question-${index}`}
              className={`rounded-2xl border px-4 py-4 transition ${
                reviewed ? "border-teal-200 bg-teal-50/70" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Prompt {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{question}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleReviewed(index)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    reviewed
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-teal-600 hover:text-teal-700"
                  }`}
                >
                  {reviewed ? "Reviewed" : "Mark Reviewed"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
