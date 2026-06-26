"use client";

import { useEffect } from "react";

export default function AdminMobileThemeLock() {
  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    const previousColorScheme = root.style.colorScheme;

    root.dataset.theme = "light";
    root.style.colorScheme = "light";

    return () => {
      if (previousTheme) {
        root.dataset.theme = previousTheme;
      } else {
        delete root.dataset.theme;
      }

      if (previousColorScheme) {
        root.style.colorScheme = previousColorScheme;
      } else {
        root.style.removeProperty("color-scheme");
      }
    };
  }, []);

  return null;
}
