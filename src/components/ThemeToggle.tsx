"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "jobadvice-theme";
type ThemeMode = "light" | "dark";

const readThemeFromDom = (): ThemeMode => {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
};

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
};

const SunIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
    <circle cx="10" cy="10" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M10 2.5v2.1M10 15.4v2.1M2.5 10h2.1M15.4 10h2.1M4.7 4.7l1.5 1.5M13.8 13.8l1.5 1.5M15.3 4.7l-1.5 1.5M6.2 13.8l-1.5 1.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.6"
    />
  </svg>
);

const MoonIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
    <path
      d="M13.6 14.1a6.1 6.1 0 0 1-7.7-7.7 6.4 6.4 0 1 0 7.7 7.7Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

type ThemeToggleProps = {
  compact?: boolean;
};

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const resolvedTheme = readThemeFromDom();
    setTheme(resolvedTheme);
    setMounted(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = event.newValue === "dark" ? "dark" : "light";
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const isDark = theme === "dark";
  const label = mounted
    ? isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
    : "Toggle theme";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-teal-200 hover:text-teal-900 ${
        compact ? "h-11 w-11" : "px-3 py-1.5 text-sm font-semibold"
      }`}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {!compact ? <span>{isDark ? "Light" : "Dark"}</span> : null}
    </button>
  );
}
