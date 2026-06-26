"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const clearNavigationPending = () => {
  delete document.documentElement.dataset.navPending;
};

const markNavigationPending = () => {
  document.documentElement.dataset.navPending = "true";
  window.setTimeout(clearNavigationPending, 12000);
};

const shouldMarkNavigationPending = (event: MouseEvent) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  ) {
    return false;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }

  const anchor = target.closest("a");
  if (!(anchor instanceof HTMLAnchorElement)) {
    return false;
  }

  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  const href = anchor.getAttribute("href") || "";
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  try {
    const targetUrl = new URL(anchor.href, window.location.href);
    if (targetUrl.origin !== window.location.origin) {
      return false;
    }

    const currentUrl = new URL(window.location.href);
    const current = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    const next = `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
    return current !== next;
  } catch {
    return false;
  }
};

export default function RouteProgressReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    clearNavigationPending();
  }, [pathname, searchParamsKey]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (shouldMarkNavigationPending(event)) {
        markNavigationPending();
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    window.addEventListener("pageshow", clearNavigationPending);
    window.addEventListener("pagehide", clearNavigationPending);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      window.removeEventListener("pageshow", clearNavigationPending);
      window.removeEventListener("pagehide", clearNavigationPending);
    };
  }, []);

  return null;
}
