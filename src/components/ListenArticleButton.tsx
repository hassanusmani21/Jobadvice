"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ListenArticleButtonProps = {
  text: string;
  readingTimeMinutes: number;
};

type PlaybackState = "idle" | "playing" | "paused" | "unsupported";
type ActionPillTone = "primary" | "secondary";
type SpeechStyle = {
  pitch: number;
  rate: number;
  volume: number;
};

const browserMaxChunkLength = 220;
const sentencePattern = /[^.!?]+[.!?]+|[^.!?]+$/g;
const premiumVoicePattern =
  /google|microsoft|neural|natural|enhanced|premium|wavenet|siri|samantha|daniel|aaron|aria|guy|jenny|libby|nisha|prabhat|heera|zira/i;
const roboticVoicePattern = /espeak|festival|compact|classic|legacy|mbrola/i;
const devanagariPattern = /[\u0900-\u097F]/g;
const arabicScriptPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;
const urduMarkerPattern = /[ٹڈڑںھہےی]/g;
const paragraphBreakPattern = /\n\s*\n+/;
const speechCleanupRules: Array<[RegExp, string]> = [
  [/\bAI\/ML\b/gi, "A I and M L"],
  [/\bAI\b/g, "A I"],
  [/\bML\b/g, "M L"],
  [/\bUI\/UX\b/gi, "U I and U X"],
  [/\bUI\b/g, "U I"],
  [/\bUX\b/g, "U X"],
  [/\bIT\b/g, "I T"],
  [/\bHR\b/g, "H R"],
  [/\bWFH\b/gi, "work from home"],
  [/\bWFO\b/gi, "work from office"],
  [/\bB\.?\s?Tech\b/gi, "B Tech"],
  [/\bM\.?\s?Tech\b/gi, "M Tech"],
  [/\bvs\.?\b/gi, "versus"],
  [/&/g, " and "],
  [/\+/g, " plus "],
  [/₹/g, " rupees "],
  [/\$/g, " dollars "],
  [/%/g, " percent "],
];

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const isSpeechSynthesisSupported = () =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  "SpeechSynthesisUtterance" in window;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const countMatches = (value: string, pattern: RegExp) =>
  value.match(pattern)?.length ?? 0;

const normalizeSpeechText = (value: string) =>
  value
    .replace(/\r/g, "")
    .split(paragraphBreakPattern)
    .map((paragraph) => paragraph.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

const prepareSpeechText = (value: string) => {
  let preparedValue = normalizeSpeechText(value);

  for (const [pattern, replacement] of speechCleanupRules) {
    preparedValue = preparedValue.replace(pattern, replacement);
  }

  return preparedValue
    .replace(/([a-z])\s*[-–—]\s*([a-z])/gi, "$1, $2")
    .replace(/:\s+/g, ". ")
    .replace(/;\s+/g, ", ")
    .replace(/([.!?])(?=[A-Z])/g, "$1 ")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const detectSpeechLocale = (value: string) => {
  const normalizedValue = normalizeSpeechText(value);
  const devanagariCount = countMatches(normalizedValue, devanagariPattern);
  const arabicScriptCount = countMatches(normalizedValue, arabicScriptPattern);
  const urduMarkerCount = countMatches(normalizedValue, urduMarkerPattern);

  if (devanagariCount >= 8 && devanagariCount > arabicScriptCount * 1.15) {
    return "hi-IN";
  }

  if (arabicScriptCount >= 8) {
    return urduMarkerCount >= 3 ? "ur-PK" : "ar-SA";
  }

  return "en-US";
};

const buildLocaleFallbacks = (locale: string) => {
  const normalizedLocale = locale.toLowerCase();
  const localeFallbacks: Record<string, string[]> = {
    "en-us": ["en-US", "en-GB", "en-IN", "en-AU", "en"],
    "en-in": ["en-US", "en-GB", "en-IN", "en-AU", "en"],
    "hi-in": ["hi-IN", "hi", "en-IN", "en-GB", "en-US"],
    "ur-pk": ["ur-PK", "ur-IN", "ur", "hi-IN", "en-IN", "en-GB", "en-US"],
    "ar-sa": ["ar-SA", "ar", "ur-PK", "en-IN", "en-GB", "en-US"],
  };

  const directFallbacks = localeFallbacks[normalizedLocale] ?? [locale];
  const baseLanguage = locale.split("-")[0];

  return [...new Set([...directFallbacks, baseLanguage, "en-IN", "en-GB", "en-US"])];
};

const scoreVoice = (
  voice: SpeechSynthesisVoice,
  localeFallbacks: string[],
  targetLocale: string,
) => {
  const normalizedVoiceLang = voice.lang.toLowerCase();
  const normalizedTargetLocale = targetLocale.toLowerCase();
  const normalizedVoiceName = voice.name.toLowerCase();

  let score = 0;
  const exactMatchIndex = localeFallbacks.findIndex(
    (locale) => normalizedVoiceLang === locale.toLowerCase(),
  );
  if (exactMatchIndex !== -1) {
    score += 80 - exactMatchIndex * 6;
  }

  const baseMatchIndex = localeFallbacks.findIndex((locale) =>
    normalizedVoiceLang.startsWith(locale.split("-")[0].toLowerCase()),
  );
  if (baseMatchIndex !== -1) {
    score += 42 - baseMatchIndex * 4;
  }

  if (normalizedVoiceLang === normalizedTargetLocale) {
    score += 18;
  }

  if (voice.default) {
    score += 10;
  }

  if (voice.localService) {
    score += 4;
  }

  if (premiumVoicePattern.test(normalizedVoiceName)) {
    score += 18;
  }

  if (roboticVoicePattern.test(normalizedVoiceName)) {
    score -= 32;
  }

  return score;
};

const resolveVoiceSelection = (
  voices: SpeechSynthesisVoice[],
  value: string,
) => {
  const targetLocale = detectSpeechLocale(value);
  const localeFallbacks = buildLocaleFallbacks(targetLocale);
  const rankedVoices = [...voices].sort(
    (leftVoice, rightVoice) =>
      scoreVoice(rightVoice, localeFallbacks, targetLocale) -
      scoreVoice(leftVoice, localeFallbacks, targetLocale),
  );
  const selectedVoice = rankedVoices[0] ?? null;

  return {
    lang: selectedVoice?.lang || targetLocale,
    voice: selectedVoice,
  };
};

const getSpeechStyle = (value: string, locale: string): SpeechStyle => {
  const trimmedValue = value.trim();
  const normalizedLocale = locale.toLowerCase();
  const isQuestion = /\?$/.test(trimmedValue);
  const isExclamation = /!/.test(trimmedValue);
  const hasPauseCue = /[:;,-]/.test(trimmedValue);
  const isLongChunk = trimmedValue.length > 165;
  const isShortChunk = trimmedValue.length < 70;

  let rate =
    normalizedLocale.startsWith("hi") ||
    normalizedLocale.startsWith("ur") ||
    normalizedLocale.startsWith("ar")
      ? 0.9
      : 0.92;
  let pitch = normalizedLocale.startsWith("en") ? 1.04 : 1.01;

  if (isLongChunk) {
    rate -= 0.06;
  }

  if (isShortChunk) {
    rate += 0.03;
  }

  if (hasPauseCue) {
    rate -= 0.025;
  }

  if (isQuestion) {
    pitch += 0.08;
    rate += 0.01;
  }

  if (isExclamation) {
    pitch += 0.12;
    rate += 0.03;
  }

  return {
    pitch: clamp(pitch, 0.96, 1.2),
    rate: clamp(rate, 0.82, 1.02),
    volume: 1,
  };
};

const chunkLongSentence = (sentence: string, maxChunkLength: number) => {
  const chunks: string[] = [];
  const words = sentence.split(/\s+/).filter(Boolean);
  let currentChunk = "";

  for (const word of words) {
    const nextChunk = currentChunk ? `${currentChunk} ${word}` : word;
    if (nextChunk.length > maxChunkLength && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = word;
      continue;
    }

    currentChunk = nextChunk;
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

const createSpeechChunks = (
  value: string,
  maxChunkLength: number = browserMaxChunkLength,
) => {
  const normalizedText = prepareSpeechText(value);
  if (!normalizedText) {
    return [];
  }

  const chunks: string[] = [];
  const paragraphs = normalizedText.split(paragraphBreakPattern).filter(Boolean);

  for (const paragraph of paragraphs) {
    const rawSentences =
      paragraph.match(sentencePattern)?.map((sentence) => sentence.trim()) || [
        paragraph,
      ];
    let currentChunk = "";

    for (const sentence of rawSentences) {
      if (sentence.length > maxChunkLength) {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = "";
        }

        chunks.push(...chunkLongSentence(sentence, maxChunkLength));
        continue;
      }

      const nextChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      if (nextChunk.length > maxChunkLength && currentChunk) {
        chunks.push(currentChunk);
        currentChunk = sentence;
        continue;
      }

      currentChunk = nextChunk;
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }
  }

  return chunks;
};

const HeadphonesIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    className="h-3.5 w-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.75"
  >
    <path d="M4.2 10.2a5.8 5.8 0 0 1 11.6 0v4.1a1.7 1.7 0 0 1-1.7 1.7h-.6a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 1.5-1.5h2.3" />
    <path d="M5.8 10H3.5A1.5 1.5 0 0 0 2 11.5v3A1.5 1.5 0 0 0 3.5 16h.6a1.7 1.7 0 0 0 1.7-1.7V10Z" />
  </svg>
);

const StopIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    className="h-3.5 w-3.5 shrink-0"
    fill="currentColor"
  >
    <rect x="5.5" y="5.5" width="9" height="9" rx="1.8" />
  </svg>
);

const ActionPill = ({
  children,
  onClick,
  tone,
  disabled = false,
  ariaPressed,
  ariaLabel,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  tone: ActionPillTone;
  disabled?: boolean;
  ariaPressed?: boolean;
  ariaLabel?: string;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={ariaPressed}
    aria-label={ariaLabel}
    title={title}
    className={joinClasses(
      "inline-flex min-h-[1.95rem] shrink-0 items-center justify-center gap-1.5 rounded-[11px] px-2.5 py-1 text-[0.78rem] font-semibold tracking-[-0.01em] transition duration-300 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60",
      tone === "primary" &&
        "blog-hero-meta-chip-primary text-white",
      tone === "secondary" &&
        "blog-hero-meta-chip blog-hero-meta-chip-secondary",
    )}
  >
    {children}
  </button>
);

const InfoChip = ({ children }: { children: ReactNode }) => (
  <span className="blog-hero-meta-chip blog-hero-meta-chip-muted inline-flex h-[1.95rem] shrink-0 items-center justify-center rounded-[11px] px-2.5 text-[0.74rem] font-semibold tracking-[-0.01em]">
    {children}
  </span>
);

export default function ListenArticleButton({
  text,
  readingTimeMinutes,
}: ListenArticleButtonProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const chunksRef = useRef<string[]>([]);
  const manuallyStoppedRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const selectedLocaleRef = useRef("en-US");

  useEffect(() => {
    const browserSpeechSupported = isSpeechSynthesisSupported();
    let isMounted = true;

    const syncVoices = () => {
      if (!browserSpeechSupported) {
        return;
      }

      voicesRef.current = window.speechSynthesis.getVoices();
    };

    syncVoices();
    window.speechSynthesis?.addEventListener?.("voiceschanged", syncVoices);

    if (!browserSpeechSupported && isMounted) {
      setPlaybackState("unsupported");
      setStatusMessage("Listening is not supported in this browser.");
    }

    return () => {
      isMounted = false;
      manuallyStoppedRef.current = true;
      window.speechSynthesis?.removeEventListener?.("voiceschanged", syncVoices);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const finishPlayback = () => {
    setPlaybackState("idle");
    setStatusMessage("");
  };

  const speakBrowserChunk = (index: number) => {
    if (!isSpeechSynthesisSupported()) {
      setPlaybackState("unsupported");
      return;
    }

    const chunk = chunksRef.current[index];
    if (!chunk) {
      finishPlayback();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk);
    const selectedLocale =
      selectedVoiceRef.current?.lang || selectedLocaleRef.current || "en-US";
    const speechStyle = getSpeechStyle(chunk, selectedLocale);

    utterance.lang = selectedLocale;
    utterance.rate = speechStyle.rate;
    utterance.pitch = speechStyle.pitch;
    utterance.volume = speechStyle.volume;

    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }

    utterance.onend = () => {
      if (manuallyStoppedRef.current) {
        return;
      }

      const nextIndex = index + 1;
      if (nextIndex >= chunksRef.current.length) {
        finishPlayback();
        return;
      }

      speakBrowserChunk(nextIndex);
    };

    utterance.onerror = () => {
      if (manuallyStoppedRef.current) {
        return;
      }

      finishPlayback();
      setStatusMessage("Listening could not start in this browser.");
    };

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (!isSpeechSynthesisSupported()) {
      setPlaybackState("unsupported");
      setStatusMessage("Listening is not supported in this browser.");
      return;
    }

    const nextChunks = createSpeechChunks(text, browserMaxChunkLength);
    if (nextChunks.length === 0) {
      setStatusMessage("There is no article text to read yet.");
      return;
    }

    manuallyStoppedRef.current = false;
    chunksRef.current = nextChunks;
    voicesRef.current = window.speechSynthesis.getVoices();
    const { lang, voice } = resolveVoiceSelection(voicesRef.current, text);
    selectedLocaleRef.current = lang;
    selectedVoiceRef.current = voice;
    window.speechSynthesis.cancel();
    setPlaybackState("playing");
    setStatusMessage("");
    speakBrowserChunk(0);
  };

  const pauseListening = () => {
    if (!isSpeechSynthesisSupported()) {
      return;
    }

    window.speechSynthesis.pause();
    setPlaybackState("paused");
    setStatusMessage("Listening paused.");
  };

  const resumeListening = () => {
    if (!isSpeechSynthesisSupported()) {
      return;
    }

    window.speechSynthesis.resume();
    setPlaybackState("playing");
    setStatusMessage("Listening resumed.");
  };

  const stopListening = () => {
    manuallyStoppedRef.current = true;
    window.speechSynthesis?.cancel();
    setPlaybackState("idle");
    setStatusMessage("");
  };

  const handlePrimaryAction = () => {
    if (playbackState === "unsupported") {
      return;
    }

    if (playbackState === "idle") {
      startListening();
      return;
    }

    if (playbackState === "playing") {
      pauseListening();
      return;
    }

    resumeListening();
  };

  const buttonLabel =
    playbackState === "idle"
      ? "Listen"
      : playbackState === "playing"
        ? "Pause"
        : playbackState === "paused"
          ? "Resume"
          : "Unavailable";

  const isListening = playbackState === "playing" || playbackState === "paused";

  return (
    <div className="flex min-h-full min-w-0 flex-wrap items-center gap-1.5">
      <ActionPill
        onClick={handlePrimaryAction}
        tone="primary"
        disabled={playbackState === "unsupported"}
        ariaPressed={isListening}
      >
        <HeadphonesIcon />
        <span>{buttonLabel}</span>
      </ActionPill>

      <InfoChip>{readingTimeMinutes} min</InfoChip>

      {isListening ? (
        <ActionPill
          onClick={stopListening}
          tone="secondary"
          ariaLabel="Stop listening"
          title="Stop listening"
        >
          <StopIcon />
          <span>Stop</span>
        </ActionPill>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
    </div>
  );
}
