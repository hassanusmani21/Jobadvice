"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  markJobAlertPopupCompleted,
  markJobAlertPopupDismissed,
} from "@/lib/jobAlertPopup";
import { trackEvent } from "@/lib/analytics";
import type { JobSegmentSlug } from "@/lib/jobSegments";

type JobAlertWelcomePopupProps = {
  delayMs?: number;
  onSettled?: () => void;
  skillOptions: string[];
  titleOptions: string[];
};

type SubmitState =
  | { tone: "idle"; message: string }
  | { tone: "success"; message: string }
  | { tone: "error"; message: string };

const initialSubmitState: SubmitState = {
  tone: "idle",
  message: "",
};

const popupCategoryOptions: Array<{ label: string; value: JobSegmentSlug }> = [
  { label: "Fresher", value: "freshers" },
  { label: "Internship", value: "internships" },
  { label: "Experienced", value: "experienced" },
];

const JOB_TITLE_TAG_LIMIT = 5;
const SKILL_TAG_LIMIT = 8;

const normalizeTagValue = (value: string) =>
  value
    .trim()
    .replace(/^[,;]+|[,;]+$/g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ");

const toNormalizedToken = (value: string) => normalizeTagValue(value).toLowerCase();

const canonicalTagValueMap = new Map<string, string>([
  ["artificial intelligence", "Artificial Intelligence"],
  ["business process outsourcing", "Business Process Outsourcing"],
  ["devops", "DevOps"],
  ["full stack", "Full Stack"],
  ["human resources", "Human Resources"],
  ["information technology", "Information Technology"],
  ["machine learning", "Machine Learning"],
  ["quality assurance", "Quality Assurance"],
  ["software development engineer", "Software Development Engineer"],
  ["software engineer", "Software Engineer"],
  ["user experience", "User Experience"],
  ["user interface", "User Interface"],
  ["ui ux", "UI/UX"],
  ["ui/ux", "UI/UX"],
]);

const canonicalAcronymMap = new Map<string, string>([
  ["ai", "AI"],
  ["api", "API"],
  ["aws", "AWS"],
  ["bpo", "BPO"],
  ["crm", "CRM"],
  ["css", "CSS"],
  ["erp", "ERP"],
  ["etl", "ETL"],
  ["html", "HTML"],
  ["html5", "HTML5"],
  ["hr", "HR"],
  ["hris", "HRIS"],
  ["it", "IT"],
  ["ml", "ML"],
  ["nlp", "NLP"],
  ["php", "PHP"],
  ["qa", "QA"],
  ["sap", "SAP"],
  ["sde", "SDE"],
  ["seo", "SEO"],
  ["sql", "SQL"],
  ["swe", "SWE"],
  ["ui", "UI"],
  ["ux", "UX"],
  ["ui/ux", "UI/UX"],
]);

const shortDisplayLabelMap = new Map<string, string>([
  ["ai", "AI"],
  ["artificial intelligence", "AI"],
  ["bpo", "BPO"],
  ["business process outsourcing", "BPO"],
  ["hr", "HR"],
  ["human resources", "HR"],
  ["it", "IT"],
  ["information technology", "IT"],
  ["machine learning", "ML"],
  ["ml", "ML"],
  ["qa", "QA"],
  ["quality assurance", "QA"],
  ["sde", "SDE"],
  ["software development engineer", "SDE"],
  ["software engineer", "SWE"],
  ["swe", "SWE"],
  ["ui", "UI"],
  ["user interface", "UI"],
  ["user experience", "UX"],
  ["ux", "UX"],
  ["ui ux", "UI/UX"],
  ["ui/ux", "UI/UX"],
]);

const getSuggestionMatch = (value: string, suggestions: string[]) => {
  const normalizedValue = toNormalizedToken(value);
  return suggestions.find((suggestion) => toNormalizedToken(suggestion) === normalizedValue);
};

const capitalizeFirstLetter = (value: string) =>
  value.replace(/^[a-z]/, (character) => character.toUpperCase());

const formatTagValue = (value: string, suggestions: string[]) => {
  const cleanedValue = normalizeTagValue(value);
  const suggestionMatch = getSuggestionMatch(cleanedValue, suggestions);

  if (suggestionMatch) {
    return suggestionMatch;
  }

  const normalizedToken = toNormalizedToken(cleanedValue);

  if (canonicalTagValueMap.has(normalizedToken)) {
    return canonicalTagValueMap.get(normalizedToken)!;
  }

  if (canonicalAcronymMap.has(normalizedToken)) {
    return canonicalAcronymMap.get(normalizedToken)!;
  }

  return capitalizeFirstLetter(cleanedValue);
};

const hasMeaninglessPattern = (value: string, suggestions: string[]) => {
  const normalizedToken = toNormalizedToken(value);

  if (
    getSuggestionMatch(value, suggestions) ||
    canonicalTagValueMap.has(normalizedToken) ||
    canonicalAcronymMap.has(normalizedToken)
  ) {
    return false;
  }

  const lettersOnly = normalizedToken.replace(/[^a-z]/g, "");

  if (!lettersOnly) {
    return true;
  }

  if (/^(.)\1+$/i.test(lettersOnly) || /^(.{1,2})\1+$/i.test(lettersOnly)) {
    return true;
  }

  if (lettersOnly.length <= 4 && !/[aeiou]/i.test(lettersOnly)) {
    return true;
  }

  return false;
};

const getShortDisplayLabel = (value: string) => shortDisplayLabelMap.get(toNormalizedToken(value));

const toComparableToken = (value: string) =>
  (getShortDisplayLabel(value) || toNormalizedToken(value)).toLowerCase();

type FieldFeedback =
  | { tone: "idle"; message: string }
  | { tone: "hint"; message: string }
  | { tone: "error"; message: string };

const initialFieldFeedback: FieldFeedback = {
  tone: "idle",
  message: "",
};

const renderHighlightedSuggestion = (value: string, query: string) => {
  if (!query.trim()) {
    return value;
  }

  const normalizedValue = value.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  const matchIndex = normalizedValue.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return value;
  }

  const matchEnd = matchIndex + normalizedQuery.length;

  return (
    <>
      {value.slice(0, matchIndex)}
      <span className="font-semibold text-emerald-200">
        {value.slice(matchIndex, matchEnd)}
      </span>
      {value.slice(matchEnd)}
    </>
  );
};

type MultiValueSuggestionFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  maxValues: number;
  suggestions: string[];
  values: string[];
  onChange: (values: string[]) => void;
};

function MultiValueSuggestionField({
  id,
  label,
  placeholder,
  maxValues,
  suggestions,
  values,
  onChange,
}: MultiValueSuggestionFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [feedback, setFeedback] = useState<FieldFeedback>(initialFieldFeedback);
  const blurTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedTokens = useMemo(
    () => new Set(values.map((value) => toComparableToken(value))),
    [values],
  );
  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = toNormalizedToken(inputValue);

    return suggestions
      .filter((suggestion) => !selectedTokens.has(toComparableToken(suggestion)))
      .map((suggestion) => {
        const normalizedSuggestion = toNormalizedToken(suggestion);

        if (!normalizedQuery) {
          return {
            rank: 0,
            suggestion,
          };
        }

        if (normalizedSuggestion.startsWith(normalizedQuery)) {
          return {
            rank: 0,
            suggestion,
          };
        }

        if (normalizedSuggestion.includes(normalizedQuery)) {
          return {
            rank: 1,
            suggestion,
          };
        }

        return {
          rank: Number.POSITIVE_INFINITY,
          suggestion,
        };
      })
      .filter(({ rank }) => Number.isFinite(rank))
      .sort(
        (firstSuggestion, secondSuggestion) =>
          firstSuggestion.rank - secondSuggestion.rank ||
          firstSuggestion.suggestion.localeCompare(secondSuggestion.suggestion),
      )
      .map(({ suggestion }) => suggestion)
      .slice(0, 6);
  }, [inputValue, selectedTokens, suggestions]);
  const activeFeedback = useMemo(() => {
    if (feedback.tone !== "idle") {
      return feedback;
    }

    if (isOpen && inputValue.trim() && filteredSuggestions.length > 0) {
      return {
        tone: "hint" as const,
        message: "Suggestions shown. Press Enter to select the highlighted match.",
      };
    }

    return initialFieldFeedback;
  }, [feedback, filteredSuggestions.length, inputValue, isOpen]);

  useEffect(() => {
    setHighlightedIndex((currentIndex) =>
      filteredSuggestions.length === 0
        ? -1
        : inputValue.trim()
          ? currentIndex < 0
            ? 0
            : Math.min(currentIndex, filteredSuggestions.length - 1)
          : currentIndex < 0
            ? -1
          : Math.min(currentIndex, filteredSuggestions.length - 1),
    );
  }, [filteredSuggestions, inputValue]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [values]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const commitValue = useCallback(
    (value: string) => {
      const cleanedInput = normalizeTagValue(value);

      if (!cleanedInput) {
        return;
      }

      if (values.length >= maxValues) {
        setFeedback({
          tone: "error",
          message: "Maximum limit reached",
        });
        return;
      }

      const suggestionMatch = getSuggestionMatch(cleanedInput, suggestions);
      const normalizedToken = toNormalizedToken(cleanedInput);

      if (
        cleanedInput.length < 3 &&
        !suggestionMatch &&
        !canonicalAcronymMap.has(normalizedToken)
      ) {
        setFeedback({
          tone: "error",
          message: "Use at least 3 characters.",
        });
        return;
      }

      if (!/[a-z]/i.test(cleanedInput)) {
        setFeedback({
          tone: "error",
          message: "Enter a valid tag.",
        });
        return;
      }

      const formattedValue = formatTagValue(cleanedInput, suggestions);
      const formattedToken = toComparableToken(formattedValue);

      if (selectedTokens.has(formattedToken)) {
        setFeedback({
          tone: "error",
          message: "Already added.",
        });
        return;
      }

      if (hasMeaninglessPattern(formattedValue, suggestions)) {
        setFeedback({
          tone: "error",
          message: "Enter a clearer tag.",
        });
        return;
      }

      onChange([...values, formattedValue]);
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(-1);
      setFeedback(initialFieldFeedback);
    },
    [maxValues, onChange, selectedTokens, suggestions, values],
  );

  const handleRemoveValue = useCallback(
    (valueToRemove: string) => {
      onChange(values.filter((currentValue) => currentValue !== valueToRemove));
      setFeedback(initialFieldFeedback);
    },
    [onChange, values],
  );

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
      >
        {label}
      </label>

      <div
        ref={containerRef}
        className="mt-1 flex max-h-[100px] min-h-10 w-full flex-wrap content-start items-center gap-1.5 overflow-y-auto rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 py-2 text-[0.92rem] text-white transition focus-within:border-emerald-400/40 focus-within:ring-2 focus-within:ring-emerald-400/20"
      >
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[0.78rem] text-emerald-100"
            title={value}
          >
            <span className="truncate">{getShortDisplayLabel(value) || value}</span>
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => handleRemoveValue(value)}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-emerald-200 transition hover:bg-white/10 hover:text-white"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3 w-3">
                <path
                  d="M5 5 15 15M15 5 5 15"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          </span>
        ))}

        <input
          id={id}
          type="text"
          value={inputValue}
          autoComplete="off"
          aria-autocomplete="list"
          aria-invalid={feedback.tone === "error"}
          aria-controls={filteredSuggestions.length > 0 ? `${id}-suggestions` : undefined}
          aria-describedby={activeFeedback.message ? `${id}-feedback` : undefined}
          onChange={(event) => {
            setInputValue(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(event.target.value.trim() ? 0 : -1);
            setFeedback(initialFieldFeedback);
          }}
          onFocus={() => {
            if (blurTimeoutRef.current) {
              window.clearTimeout(blurTimeoutRef.current);
            }
            setIsOpen(true);
          }}
          onBlur={() => {
            blurTimeoutRef.current = window.setTimeout(() => {
              setIsOpen(false);
              setHighlightedIndex(-1);
            }, 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !inputValue && values.length > 0) {
              onChange(values.slice(0, -1));
              setFeedback(initialFieldFeedback);
              return;
            }

            if (event.key === "ArrowDown") {
              if (filteredSuggestions.length === 0) {
                return;
              }

              event.preventDefault();
              setIsOpen(true);
              setHighlightedIndex((currentIndex) =>
                currentIndex < 0 || currentIndex >= filteredSuggestions.length - 1
                  ? 0
                  : currentIndex + 1,
              );
              return;
            }

            if (event.key === "ArrowUp") {
              if (filteredSuggestions.length === 0) {
                return;
              }

              event.preventDefault();
              setIsOpen(true);
              setHighlightedIndex((currentIndex) =>
                currentIndex <= 0 ? filteredSuggestions.length - 1 : currentIndex - 1,
              );
              return;
            }

            if (event.key === "Escape") {
              setIsOpen(false);
              setHighlightedIndex(-1);
              return;
            }

            if (event.key === "Enter") {
              const nextSuggestion =
                highlightedIndex >= 0 ? filteredSuggestions[highlightedIndex] : undefined;
              const nextValue = nextSuggestion || inputValue;

              if (!nextValue.trim()) {
                return;
              }

              event.preventDefault();
              commitValue(nextValue);
            }
          }}
          placeholder={placeholder}
          className="min-w-[7rem] flex-1 border-0 bg-transparent p-0 text-[0.92rem] text-white outline-none placeholder:text-slate-500"
        />
      </div>

      {activeFeedback.message ? (
        <p
          id={`${id}-feedback`}
          aria-live="polite"
          className={`mt-1 text-[0.72rem] leading-5 ${
            activeFeedback.tone === "error" ? "text-rose-300" : "text-slate-400"
          }`}
        >
          {activeFeedback.message}
        </p>
      ) : null}

      {isOpen && filteredSuggestions.length > 0 ? (
        <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-[0.95rem] border border-white/10 bg-slate-950/98 shadow-[0_18px_30px_-20px_rgba(15,23,42,0.95)]">
          <ul
            id={`${id}-suggestions`}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="py-1"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commitValue(suggestion);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-left text-[0.84rem] text-slate-200 transition ${
                    index === highlightedIndex ? "bg-emerald-400/10 text-white" : "hover:bg-white/5"
                  }`}
                >
                  {renderHighlightedSuggestion(suggestion, inputValue)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function JobAlertWelcomePopup({
  delayMs = 2500,
  onSettled,
  skillOptions,
  titleOptions,
}: JobAlertWelcomePopupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<JobSegmentSlug | "">("");
  const [submitState, setSubmitState] = useState<SubmitState>(initialSubmitState);
  const [delayElapsed, setDelayElapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const successTimeoutRef = useRef<number | null>(null);

  const closePopup = useCallback(
    (afterClose?: () => void) => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }

      setIsEntered(false);
      closeTimeoutRef.current = window.setTimeout(() => {
        setIsMounted(false);
        afterClose?.();
        onSettled?.();
      }, 180);
    },
    [onSettled],
  );

  const handleDismiss = useCallback(() => {
    markJobAlertPopupDismissed();
    closePopup();
  }, [closePopup]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDelayElapsed(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [delayMs]);

  useEffect(() => {
    if (!delayElapsed) {
      return;
    }

    setIsMounted(true);

    const frameId = window.requestAnimationFrame(() => {
      setIsEntered(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [delayElapsed]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [handleDismiss, isMounted]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState(initialSubmitState);

    if (selectedTitles.length === 0 && selectedSkills.length === 0 && !selectedCategory) {
      setSubmitState({
        tone: "error",
        message: "Choose a category, role, or skill before subscribing.",
      });
      return;
    }

    if (!name.trim()) {
      setSubmitState({
        tone: "error",
        message: "Enter your name so we can personalize your alerts.",
      });
      return;
    }

    if (!email.trim()) {
      setSubmitState({
        tone: "error",
        message: "Enter your email to start the daily alert.",
      });
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/job-alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobTitles: selectedTitles,
          skills: selectedSkills,
          category: selectedCategory,
          email,
          name,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        setSubmitState({
          tone: "error",
          message: payload?.message || "We couldn't create your alert right now. Please try again.",
        });
        return;
      }

      markJobAlertPopupCompleted();
      setSubmitState({
        tone: "success",
        message:
          payload?.message ||
          "Alert active. We'll send fresh matching jobs to your inbox daily.",
      });
      trackEvent("job_alert_signup", {
        alert_source: "homepage_popup",
        job_titles: selectedTitles.join(","),
        query: selectedTitles.join(","),
        segments: selectedCategory ? [selectedCategory].join(",") : "",
        skill: selectedSkills.join(","),
        skills: selectedSkills.join(","),
      });

      successTimeoutRef.current = window.setTimeout(() => {
        closePopup();
      }, 1400);
    } catch {
      setSubmitState({
        tone: "error",
        message: "We couldn't create your alert right now. Please try again.",
      });
    } finally {
      setIsPending(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[95]">
      <button
        type="button"
        aria-label="Close job alert popup"
        onClick={handleDismiss}
        className={`pointer-events-auto absolute inset-0 bg-slate-950/70 backdrop-blur-[3px] transition-opacity duration-200 ${
          isEntered ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-alert-popup-heading"
          aria-describedby="job-alert-popup-copy"
          className={`pointer-events-auto relative w-full max-w-[42rem] overflow-hidden rounded-[1.5rem] border border-emerald-400/20 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.16),_transparent_36%),linear-gradient(180deg,_rgba(15,23,42,0.99),_rgba(2,6,23,0.98))] text-slate-100 shadow-[0_30px_80px_-35px_rgba(15,23,42,0.95)] transition-all duration-200 ease-out ${
            isEntered ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.97] opacity-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_45%,rgba(16,185,129,0.05))]" />

          <div className="relative px-4 py-4 sm:px-5 sm:py-4">
            <button
              type="button"
              aria-label="Close popup"
              onClick={handleDismiss}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-950 sm:right-5 sm:top-4"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
                <path
                  d="M5 5 15 15M15 5 5 15"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>

            <div className="pr-12">
              <span className="inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                Daily Job Alerts
              </span>

              <h2
                id="job-alert-popup-heading"
                className="mt-3 text-[1.1rem] font-semibold leading-tight text-white sm:text-[1.3rem]"
              >
                Create your alert
              </h2>

              <p
                id="job-alert-popup-copy"
                className="mt-1.5 text-[0.82rem] leading-5 text-slate-300 sm:text-[0.88rem]"
              >
                Stay ahead.{" "}
                <span className="font-semibold text-emerald-200">
                  Get a daily email when new jobs match your preferences.
                </span>
              </p>
            </div>

            <form
              className="mt-3 rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur"
              onSubmit={handleSubmit}
            >
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label
                    htmlFor="job-alert-popup-name"
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Name
                  </label>
                  <input
                    id="job-alert-popup-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className="mt-1 block h-10 w-full rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 text-[0.92rem] text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="job-alert-popup-email"
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Email
                  </label>
                  <input
                    id="job-alert-popup-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your email"
                    className="mt-1 block h-10 w-full rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 text-[0.92rem] text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                  />
                </div>

                <div>
                  <MultiValueSuggestionField
                    id="job-alert-popup-title"
                    label="Job Titles"
                    placeholder="Search titles and press Enter"
                    maxValues={JOB_TITLE_TAG_LIMIT}
                    suggestions={titleOptions}
                    values={selectedTitles}
                    onChange={setSelectedTitles}
                  />
                </div>

                <div>
                  <MultiValueSuggestionField
                    id="job-alert-popup-skill"
                    label="Skills"
                    placeholder="Search skills and press Enter"
                    maxValues={SKILL_TAG_LIMIT}
                    suggestions={skillOptions}
                    values={selectedSkills}
                    onChange={setSelectedSkills}
                  />
                </div>

                <div>
                  <label
                    htmlFor="job-alert-popup-category"
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    Category
                  </label>
                  <select
                    id="job-alert-popup-category"
                    value={selectedCategory}
                    onChange={(event) =>
                      setSelectedCategory(event.target.value as JobSegmentSlug | "")
                    }
                    className="mt-1 block h-10 w-full rounded-[0.95rem] border border-white/10 bg-slate-900/60 px-3 pr-8 text-[0.92rem] text-white outline-none transition focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">Any category</option>
                    {popupCategoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex h-10 w-full items-center justify-center rounded-[0.95rem] bg-emerald-400 px-4 text-sm font-semibold text-slate-950 shadow-[0_16px_30px_-20px_rgba(16,185,129,0.9)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  {isPending ? "Creating Alert..." : "Get Alerts"}
                </button>
              </div>
            </form>

            {submitState.tone !== "idle" ? (
              <div
                className={`job-alert-feedback mt-3 ${
                  submitState.tone === "success" ? "job-alert-feedback-success" : "job-alert-feedback-error"
                }`}
                aria-live="polite"
              >
                <span className="job-alert-feedback-icon" aria-hidden="true">
                  {submitState.tone === "success" ? "✓" : "!"}
                </span>
                <span>{submitState.message}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
