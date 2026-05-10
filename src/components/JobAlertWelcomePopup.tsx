"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  markJobAlertPopupCompleted,
  markJobAlertPopupDismissed,
} from "@/lib/jobAlertPopup";
import { trackEvent } from "@/lib/analytics";
import type { JobSegmentSlug } from "@/lib/jobSegments";
import { siteEmail } from "@/lib/site";

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

type PreferenceKind = "title" | "skill";
type ExperiencePreference = "" | "Internship" | "Entry Level" | "1-3 Years" | "3+ Years";
type WorkModePreference = "" | "Remote" | "Hybrid" | "Onsite";

type SmartPreference = {
  kind: PreferenceKind;
  value: string;
};

type SmartSuggestion = {
  helper: string;
  kind: PreferenceKind;
  value: string;
};

type FieldFeedback =
  | { tone: "idle"; message: string }
  | { tone: "hint"; message: string }
  | { tone: "error"; message: string };

type SmartPreferenceFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  suggestions: SmartSuggestion[];
  values: SmartPreference[];
  onChange: (values: SmartPreference[]) => void;
};

type SelectOption = {
  label: string;
  value: string;
};

const initialSubmitState: SubmitState = {
  tone: "idle",
  message: "",
};

const initialFieldFeedback: FieldFeedback = {
  tone: "idle",
  message: "",
};

const popupCategoryOptions: Array<{ label: string; value: JobSegmentSlug }> = [
  { label: "Fresher", value: "freshers" },
  { label: "Internship", value: "internships" },
  { label: "Experienced", value: "experienced" },
];

const experienceOptions: ExperiencePreference[] = ["", "Internship", "Entry Level", "1-3 Years", "3+ Years"];

const workModeOptions: WorkModePreference[] = ["", "Remote", "Hybrid", "Onsite"];

const SMART_PREFERENCE_LIMIT = 8;

const titleKeywordPattern =
  /\b(developer|engineer|analyst|designer|manager|consultant|specialist|intern|lead|executive|associate|scientist|architect|recruiter|tester|operator)\b/i;

const normalizeTagValue = (value: string) =>
  value
    .trim()
    .replace(/^[,;]+|[,;]+$/g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ");

const splitInputIntoTokens = (value: string) =>
  value
    .split(/[,\n;]/)
    .map((token) => normalizeTagValue(token))
    .filter(Boolean);

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

const getShortDisplayLabel = (value: string) => shortDisplayLabelMap.get(toNormalizedToken(value));

const toComparableToken = (value: string) =>
  (getShortDisplayLabel(value) || toNormalizedToken(value)).toLowerCase();

const capitalizeFirstLetter = (value: string) =>
  value.replace(/^[a-z]/, (character) => character.toUpperCase());

const hasMeaninglessPattern = (value: string) => {
  const normalizedToken = toNormalizedToken(value);
  const lettersOnly = normalizedToken.replace(/[^a-z]/g, "");

  if (!lettersOnly) {
    return true;
  }

  if (/^(.)\1+$/i.test(lettersOnly) || /^(.{1,2})\1+$/i.test(lettersOnly)) {
    return true;
  }

  if (lettersOnly.length <= 4 && !/[aeiou]/i.test(lettersOnly) && !canonicalAcronymMap.has(normalizedToken)) {
    return true;
  }

  return false;
};

const getSuggestionMatch = (value: string, suggestions: SmartSuggestion[]) => {
  const normalizedValue = toNormalizedToken(value);
  return suggestions.find((suggestion) => toNormalizedToken(suggestion.value) === normalizedValue);
};

const inferPreferenceKind = (value: string, suggestions: SmartSuggestion[]): PreferenceKind => {
  const suggestionMatch = getSuggestionMatch(value, suggestions);

  if (suggestionMatch) {
    return suggestionMatch.kind;
  }

  return titleKeywordPattern.test(value) ? "title" : "skill";
};

const formatPreferenceValue = (value: string, suggestions: SmartSuggestion[]) => {
  const cleanedValue = normalizeTagValue(value);
  const suggestionMatch = getSuggestionMatch(cleanedValue, suggestions);

  if (suggestionMatch) {
    return suggestionMatch.value;
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

const createMailtoLink = () =>
  `mailto:${siteEmail}?subject=${encodeURIComponent("Manage Job Alerts")}`;

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="M5 5 15 15M15 5 5 15"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="M10 10.2a3.35 3.35 0 1 0 0-6.7 3.35 3.35 0 0 0 0 6.7ZM4.7 16.35a5.74 5.74 0 0 1 10.6 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="M3.5 5.75h13a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-6.5a1 1 0 0 1 1-1Zm0 .2L10 10.7l6.5-4.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="m10 2.8 1.15 3.1 3.1 1.15-3.1 1.14L10 11.3 8.86 8.19 5.75 7.05l3.11-1.15L10 2.8Zm5.2 8.65.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Zm-10.1 1.3.82 2.22 2.23.82-2.23.82-.82 2.23-.82-2.23L2.05 15.8l2.23-.82.82-2.22Z"
        fill="currentColor"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="M10 17.1s4.35-4.7 4.35-8.17A4.35 4.35 0 1 0 5.65 8.93C5.65 12.4 10 17.1 10 17.1Zm0-6.4a1.95 1.95 0 1 0 0-3.9 1.95 1.95 0 0 0 0 3.9Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <path
        d="M7.25 5.2V4.5A1.75 1.75 0 0 1 9 2.75h2A1.75 1.75 0 0 1 12.75 4.5v.7m-9 2.05h12.5a1 1 0 0 1 1 1v5.55a1 1 0 0 1-1 1H3.75a1 1 0 0 1-1-1V8.25a1 1 0 0 1 1-1Zm4.8-2.05h2.9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.65"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="m5.5 7.75 4.5 4.5 4.5-4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SmartPreferenceField({
  id,
  label,
  placeholder,
  suggestions,
  values,
  onChange,
}: SmartPreferenceFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [feedback, setFeedback] = useState<FieldFeedback>(initialFieldFeedback);
  const blurTimeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedTokens = useMemo(
    () => new Set(values.map((value) => toComparableToken(value.value))),
    [values],
  );

  const filteredSuggestions = useMemo(() => {
    const normalizedQuery = toNormalizedToken(inputValue);

    return suggestions
      .filter((suggestion) => !selectedTokens.has(toComparableToken(suggestion.value)))
      .map((suggestion) => {
        const normalizedSuggestion = toNormalizedToken(suggestion.value);

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
          firstSuggestion.suggestion.value.localeCompare(secondSuggestion.suggestion.value),
      )
      .map(({ suggestion }) => suggestion)
      .slice(0, 7);
  }, [inputValue, selectedTokens, suggestions]);

  const activeFeedback = useMemo(() => {
    if (feedback.tone !== "idle") {
      return feedback;
    }

    if (isOpen && inputValue.trim() && filteredSuggestions.length > 0) {
      return {
        tone: "hint" as const,
        message: "Press Enter to add a suggestion or separate multiple ideas with commas.",
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

  const commitEntries = useCallback(
    (entries: Array<{ kind?: PreferenceKind; value: string }>) => {
      if (entries.length === 0) {
        return;
      }

      const nextValues = [...values];
      let remainingSlots = SMART_PREFERENCE_LIMIT - nextValues.length;
      let hasAddedValue = false;

      for (const entry of entries) {
        const cleanedInput = normalizeTagValue(entry.value);

        if (!cleanedInput || remainingSlots <= 0) {
          continue;
        }

        const suggestionMatch = getSuggestionMatch(cleanedInput, suggestions);
        const normalizedToken = toNormalizedToken(cleanedInput);

        if (
          cleanedInput.length < 2 &&
          !suggestionMatch &&
          !canonicalAcronymMap.has(normalizedToken)
        ) {
          continue;
        }

        if (!/[a-z]/i.test(cleanedInput)) {
          continue;
        }

        const formattedValue = formatPreferenceValue(cleanedInput, suggestions);
        const formattedToken = toComparableToken(formattedValue);

        if (selectedTokens.has(formattedToken)) {
          continue;
        }

        if (hasMeaninglessPattern(formattedValue)) {
          continue;
        }

        nextValues.push({
          kind: entry.kind || inferPreferenceKind(formattedValue, suggestions),
          value: formattedValue,
        });
        selectedTokens.add(formattedToken);
        remainingSlots -= 1;
        hasAddedValue = true;
      }

      if (!hasAddedValue) {
        setFeedback({
          tone: "error",
          message:
            values.length >= SMART_PREFERENCE_LIMIT
              ? "You have reached the smart alert limit."
              : "Add a clearer role or skill.",
        });
        return;
      }

      onChange(nextValues);
      setInputValue("");
      setIsOpen(false);
      setHighlightedIndex(-1);
      setFeedback(initialFieldFeedback);
    },
    [onChange, selectedTokens, suggestions, values],
  );

  const handleRemoveValue = useCallback(
    (valueToRemove: SmartPreference) => {
      onChange(
        values.filter(
          (currentValue) =>
            currentValue.value !== valueToRemove.value || currentValue.kind !== valueToRemove.kind,
        ),
      );
      setFeedback(initialFieldFeedback);
    },
    [onChange, values],
  );

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400"
      >
        {label}
      </label>

      <div
        ref={containerRef}
        className="mt-2 flex max-h-[132px] min-h-[3.35rem] w-full min-w-0 flex-wrap content-start items-center gap-2 overflow-x-hidden overflow-y-auto rounded-[1rem] border border-white/7 bg-white/[0.045] px-3.5 py-2.5 text-[0.92rem] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl transition focus-within:border-emerald-300/28 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.07)]"
      >
        <span className="mt-0.5 text-slate-500">
          <SparklesIcon />
        </span>

        {values.map((value) => (
          <span
            key={`${value.kind}:${value.value}`}
            className={`inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] ${
              value.kind === "title"
                ? "border-cyan-400/16 bg-cyan-400/8 text-cyan-100"
                : "border-emerald-400/16 bg-emerald-400/8 text-emerald-100"
            }`}
            title={value.value}
          >
            <span className="min-w-0 flex-1 truncate">
              {getShortDisplayLabel(value.value) || value.value}
            </span>
            <button
              type="button"
              aria-label={`Remove ${value.value}`}
              onClick={() => handleRemoveValue(value)}
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-current/80 transition hover:bg-white/10 hover:text-white"
            >
              <CloseIcon />
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

            if (event.key === "," || event.key === "Enter") {
              const nextSuggestion =
                highlightedIndex >= 0 ? filteredSuggestions[highlightedIndex] : undefined;
              const nextEntries = nextSuggestion
                ? [{ kind: nextSuggestion.kind, value: nextSuggestion.value }]
                : splitInputIntoTokens(inputValue).map((value) => ({ value }));

              if (nextEntries.length === 0) {
                return;
              }

              event.preventDefault();
              commitEntries(nextEntries);
            }
          }}
          placeholder={placeholder}
          className="min-w-[9rem] flex-1 border-0 bg-transparent p-0 text-[0.94rem] text-white outline-none placeholder:text-slate-500"
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        {activeFeedback.message ? (
          <p
            id={`${id}-feedback`}
            aria-live="polite"
            className={`text-[0.72rem] leading-5 ${
              activeFeedback.tone === "error" ? "text-rose-300" : "text-slate-400"
            }`}
          >
            {activeFeedback.message}
          </p>
        ) : (
          <p className="text-[0.72rem] leading-5 text-slate-500">
            Add roles or skills separated by commas.
          </p>
        )}
      </div>

      {isOpen && filteredSuggestions.length > 0 ? (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-[1rem] border border-white/8 bg-slate-950/96 shadow-[0_28px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <ul
            id={`${id}-suggestions`}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="py-1.5"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <li key={`${suggestion.kind}:${suggestion.value}`}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    commitEntries([{ kind: suggestion.kind, value: suggestion.value }]);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[0.84rem] text-slate-200 transition ${
                    index === highlightedIndex
                      ? "bg-emerald-400/10 text-white"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span>{renderHighlightedSuggestion(suggestion.value, inputValue)}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-slate-400">
                    {suggestion.helper}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function GlassField({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <div className="relative mt-2">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>
        {children}
      </div>
    </label>
  );
}

function ThemedSelect({
  id,
  icon,
  onChange,
  options,
  placeholder,
  value,
}: {
  id: string;
  icon: ReactNode;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) || null;

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative mt-2">
      <button
        id={id}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        className="flex h-11 w-full items-center gap-3 rounded-[0.95rem] border border-white/7 bg-white/[0.045] pl-11 pr-10 text-left text-[0.94rem] text-white outline-none transition focus:border-emerald-300/28 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.07)]"
      >
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          {icon}
        </span>
        <span className={selectedOption ? "truncate text-white" : "truncate text-slate-400"}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <ChevronIcon open={isOpen} />
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-[1rem] border border-white/8 bg-slate-950/96 shadow-[0_28px_60px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          <ul role="listbox" aria-labelledby={id} className="py-1.5">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <li key={option.value || "__empty"}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-[0.84rem] transition ${
                      isSelected
                        ? "bg-emerald-400/10 text-white"
                        : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <span className="text-emerald-200">
                        <SparklesIcon />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function SuccessActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-slate-100 transition hover:border-white/18 hover:bg-white/[0.075]"
    >
      {label}
    </a>
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
  const [selectedPreferences, setSelectedPreferences] = useState<SmartPreference[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<JobSegmentSlug | "">("");
  const [selectedExperience, setSelectedExperience] = useState<ExperiencePreference>("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedWorkMode, setSelectedWorkMode] = useState<WorkModePreference>("");
  const [submitState, setSubmitState] = useState<SubmitState>(initialSubmitState);
  const [delayElapsed, setDelayElapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isEntered, setIsEntered] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const closeTimeoutRef = useRef<number | null>(null);
  const mailtoLink = useMemo(() => createMailtoLink(), []);

  const suggestionCatalog = useMemo(() => {
    const catalog = new Map<string, SmartSuggestion>();

    for (const title of titleOptions) {
      const formattedValue = formatPreferenceValue(title, []);
      catalog.set(toNormalizedToken(formattedValue), {
        helper: "Role",
        kind: "title",
        value: formattedValue,
      });
    }

    for (const skill of skillOptions) {
      const formattedValue = formatPreferenceValue(skill, []);
      const normalizedToken = toNormalizedToken(formattedValue);

      if (!catalog.has(normalizedToken)) {
        catalog.set(normalizedToken, {
          helper: "Skill",
          kind: "skill",
          value: formattedValue,
        });
      }
    }

    return [...catalog.values()].sort((firstSuggestion, secondSuggestion) =>
      firstSuggestion.value.localeCompare(secondSuggestion.value),
    );
  }, [skillOptions, titleOptions]);

  const selectedTitles = useMemo(
    () =>
      selectedPreferences
        .filter((preference) => preference.kind === "title")
        .map((preference) => preference.value),
    [selectedPreferences],
  );

  const selectedSkills = useMemo(
    () =>
      selectedPreferences
        .filter((preference) => preference.kind === "skill")
        .map((preference) => preference.value),
    [selectedPreferences],
  );

  const successTags = useMemo(
    () => selectedPreferences.map((preference) => preference.value),
    [selectedPreferences],
  );

  const closePopup = useCallback(
    (afterClose?: () => void) => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
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
    };
  }, []);

  const categorySelectOptions: SelectOption[] = useMemo(
    () => [
      { label: "Any category", value: "" },
      ...popupCategoryOptions.map((category) => ({
        label: category.label,
        value: category.value,
      })),
    ],
    [],
  );

  const experienceSelectOptions: SelectOption[] = useMemo(
    () => [
      { label: "Any experience level", value: "" },
      ...experienceOptions.filter(Boolean).map((experienceOption) => ({
        label: experienceOption,
        value: experienceOption,
      })),
    ],
    [],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitState(initialSubmitState);

    if (selectedPreferences.length === 0) {
      setSubmitState({
        tone: "error",
        message: "Add at least one role or skill so we can personalize your alerts.",
      });
      return;
    }

    if (!name.trim()) {
      setSubmitState({
        tone: "error",
        message: "Enter your name so the alert feels like it belongs to you.",
      });
      return;
    }

    if (!email.trim()) {
      setSubmitState({
        tone: "error",
        message: "Enter your email to start the smart alert.",
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
          email,
          filters: {
            experienceLevels: selectedExperience ? [selectedExperience] : [],
            jobTitles: selectedTitles,
            locations: selectedLocation ? [selectedLocation] : [],
            segments: selectedCategory ? [selectedCategory] : [],
            skills: selectedSkills,
            workModes: selectedWorkMode ? [selectedWorkMode] : [],
          },
          name,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
          "We'll notify you whenever matching opportunities are posted.",
      });
      trackEvent("job_alert_signup", {
        alert_source: "homepage_popup",
        experience_level: selectedExperience,
        job_titles: selectedTitles.join(","),
        location: selectedLocation,
        query: selectedPreferences.map((preference) => preference.value).join(","),
        segments: selectedCategory ? [selectedCategory].join(",") : "",
        skill: selectedSkills.join(","),
        skills: selectedSkills.join(","),
        work_mode: selectedWorkMode,
      });
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
        className={`pointer-events-auto absolute inset-0 bg-slate-950/82 backdrop-blur-[10px] transition-opacity duration-200 ${
          isEntered ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative z-10 flex min-h-full items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-alert-popup-heading"
          aria-describedby="job-alert-popup-copy"
          className={`pointer-events-auto relative w-full max-w-[44rem] overflow-hidden rounded-[1.4rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.1),_transparent_30%),radial-gradient(circle_at_85%_0%,_rgba(56,189,248,0.08),_transparent_22%),linear-gradient(180deg,_rgba(15,23,42,0.95),_rgba(2,6,23,0.98))] text-slate-100 shadow-[0_34px_80px_-42px_rgba(15,23,42,1)] ring-1 ring-white/5 backdrop-blur-2xl transition-all duration-200 ease-out ${
            isEntered ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.045),transparent_38%,rgba(16,185,129,0.04)_100%)]" />

          <button
            type="button"
            aria-label="Close popup"
            onClick={handleDismiss}
            className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] text-slate-300 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <CloseIcon />
          </button>

          <div className="relative p-4 sm:p-5 lg:p-6">
            {submitState.tone === "success" ? (
              <div className="flex min-h-[24rem] flex-col justify-center">
                <div className="mx-auto max-w-[28rem] text-center">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/18 bg-emerald-400/9 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    <SparklesIcon />
                    Smart Job Alerts
                  </span>

                  <h2
                    id="job-alert-popup-heading"
                    className="mt-4 text-[1.8rem] font-semibold tracking-[-0.03em] text-white sm:text-[2.05rem]"
                  >
                    You&apos;re all set 🎉
                  </h2>

                  <p
                    id="job-alert-popup-copy"
                    className="mx-auto mt-3 max-w-[25rem] text-[0.96rem] leading-7 text-slate-300"
                  >
                    We&apos;ll notify you whenever matching opportunities are posted.
                  </p>

                  {successTags.length > 0 ? (
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {successTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1.5 text-sm text-emerald-100"
                        >
                          {getShortDisplayLabel(tag) || tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <SuccessActionLink href={mailtoLink} label="Manage Alerts" />
                    <button
                      type="button"
                      onClick={() => closePopup()}
                      className="text-sm font-medium text-slate-300 transition hover:text-white"
                    >
                      Continue Browsing Jobs
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-[0.84fr_1.16fr] lg:items-start lg:gap-6">
                <div className="max-w-[18rem] lg:pt-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/16 bg-emerald-400/8 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    <SparklesIcon />
                    Smart Job Alerts
                  </span>

                  <h2
                    id="job-alert-popup-heading"
                    className="mt-4 text-[1.8rem] font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-[2.05rem]"
                  >
                    Never miss the right opportunity
                  </h2>

                  <p
                    id="job-alert-popup-copy"
                    className="mt-3 text-[0.95rem] leading-7 text-slate-300"
                  >
                    Get personalized job alerts delivered directly to your inbox.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["No spam", "Unsubscribe anytime"].map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-full border border-white/9 bg-white/[0.04] px-3 py-1.5 text-[0.74rem] font-medium text-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <form
                    className="rounded-[1.2rem] border border-white/8 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl sm:p-[1.125rem]"
                    onSubmit={handleSubmit}
                  >
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <GlassField icon={<UserIcon />} label="Full Name">
                        <input
                          id="job-alert-popup-name"
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Your full name"
                          className="block h-11 w-full rounded-[0.95rem] border border-white/7 bg-white/[0.045] pl-11 pr-3.5 text-[0.94rem] text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/28 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.07)]"
                        />
                      </GlassField>

                      <GlassField icon={<MailIcon />} label="Email">
                        <input
                          id="job-alert-popup-email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="name@example.com"
                          className="block h-11 w-full rounded-[0.95rem] border border-white/7 bg-white/[0.045] pl-11 pr-3.5 text-[0.94rem] text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/28 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.07)]"
                        />
                      </GlassField>
                    </div>

                    <div className="mt-3.5">
                      <SmartPreferenceField
                        id="job-alert-popup-preferences"
                        label="What jobs are you looking for?"
                        placeholder="React Developer, Business Analyst, Python, SQL, AI"
                        suggestions={suggestionCatalog}
                        values={selectedPreferences}
                        onChange={setSelectedPreferences}
                      />
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setIsAdvancedOpen((currentValue) => !currentValue)}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-slate-200"
                      >
                        Advanced Preferences
                        <ChevronIcon open={isAdvancedOpen} />
                      </button>

                      {isAdvancedOpen ? (
                        <div className="mt-3 grid gap-3.5 sm:grid-cols-2">
                          <GlassField icon={<BriefcaseIcon />} label="Category">
                            <ThemedSelect
                              id="job-alert-popup-category"
                              icon={<BriefcaseIcon />}
                              options={categorySelectOptions}
                              placeholder="Any category"
                              value={selectedCategory}
                              onChange={(nextValue) =>
                                setSelectedCategory(nextValue as JobSegmentSlug | "")
                              }
                            />
                          </GlassField>

                          <GlassField icon={<BriefcaseIcon />} label="Experience Level">
                            <ThemedSelect
                              id="job-alert-popup-experience"
                              icon={<BriefcaseIcon />}
                              options={experienceSelectOptions}
                              placeholder="Any experience level"
                              value={selectedExperience}
                              onChange={(nextValue) =>
                                setSelectedExperience(nextValue as ExperiencePreference)
                              }
                            />
                          </GlassField>

                          <GlassField icon={<MapPinIcon />} label="Location">
                            <input
                              id="job-alert-popup-location"
                              type="text"
                              autoComplete="address-level2"
                              value={selectedLocation}
                              onChange={(event) => setSelectedLocation(event.target.value)}
                              placeholder="Bengaluru, Pune, Remote"
                              className="block h-11 w-full rounded-[0.95rem] border border-white/7 bg-white/[0.045] pl-11 pr-3.5 text-[0.94rem] text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/28 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(16,185,129,0.07)]"
                            />
                          </GlassField>

                          <div>
                            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Work Mode
                            </span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {workModeOptions.map((workModeOption) => (
                                <button
                                  key={workModeOption || "any"}
                                  type="button"
                                  onClick={() => setSelectedWorkMode(workModeOption)}
                                  className={`inline-flex h-10 items-center justify-center rounded-full border px-3.5 text-sm font-medium transition ${
                                    selectedWorkMode === workModeOption
                                      ? "border-emerald-300/22 bg-emerald-400/10 text-emerald-100"
                                      : "border-white/9 bg-white/[0.035] text-slate-300 hover:border-white/16 hover:bg-white/[0.06] hover:text-white"
                                  }`}
                                >
                                  {workModeOption || "Any"}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {submitState.tone === "error" ? (
                      <div
                        className="mt-3.5 rounded-[0.95rem] border border-rose-400/14 bg-rose-400/8 px-3.5 py-3 text-sm text-rose-100"
                        aria-live="polite"
                      >
                        {submitState.message}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={isPending}
                      className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,rgba(52,211,153,0.98),rgba(45,212,191,0.93)_58%,rgba(34,197,94,0.9))] px-4 text-sm font-semibold text-slate-950 shadow-[0_18px_34px_-24px_rgba(16,185,129,0.75)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
                    >
                      {isPending ? "Starting Smart Alerts..." : "Start Smart Alerts"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
