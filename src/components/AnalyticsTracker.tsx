"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  trackEvent,
  trackPageView,
} from "@/lib/analytics";

type PageVisit = {
  enteredAt: number;
  path: string;
  title: string;
};

const landingPageStorageKey = "jobadvice:landing-page-v1";

const buildPathWithSearch = (pathname: string, search: string) =>
  search ? `${pathname}?${search}` : pathname;

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentVisitRef = useRef<PageVisit | null>(null);
  const lastExitSignatureRef = useRef("");

  useEffect(() => {
    const search = searchParams.toString();
    const path = buildPathWithSearch(pathname, search);
    const title = document.title || "JobAdvice";
    const previousVisit = currentVisitRef.current;

    if (previousVisit && previousVisit.path !== path) {
      const signature = `${previousVisit.path}:${previousVisit.enteredAt}`;
      if (lastExitSignatureRef.current !== signature) {
        trackEvent("page_exit", {
          page_path: previousVisit.path,
          page_title: previousVisit.title,
          exit_reason: "route_change",
          time_on_page_seconds: Math.max(
            1,
            Math.round((Date.now() - previousVisit.enteredAt) / 1000),
          ),
        });
        lastExitSignatureRef.current = signature;
      }
    }

    currentVisitRef.current = {
      enteredAt: Date.now(),
      path,
      title,
    };
    lastExitSignatureRef.current = "";

    trackPageView(path, title);

    try {
      const existingLandingPage = window.sessionStorage.getItem(
        landingPageStorageKey,
      );

      if (!existingLandingPage) {
        window.sessionStorage.setItem(landingPageStorageKey, path);
        trackEvent("landing_page_view", {
          landing_page: path,
          referrer:
            document.referrer && document.referrer.trim()
              ? document.referrer
              : "(direct)",
        });
      }
    } catch {}

    if (pathname === "/resume-builder") {
      trackEvent("resume_builder_open", {
        entry_path: path,
      });
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const sendExitEvent = (exitReason: "hidden" | "pagehide") => {
      const currentVisit = currentVisitRef.current;
      if (!currentVisit) {
        return;
      }

      const signature = `${currentVisit.path}:${currentVisit.enteredAt}`;
      if (lastExitSignatureRef.current === signature) {
        return;
      }

      trackEvent("page_exit", {
        page_path: currentVisit.path,
        page_title: currentVisit.title,
        exit_reason: exitReason,
        time_on_page_seconds: Math.max(
          1,
          Math.round((Date.now() - currentVisit.enteredAt) / 1000),
        ),
      });
      lastExitSignatureRef.current = signature;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendExitEvent("hidden");
      }
    };

    const handlePageHide = () => {
      sendExitEvent("pagehide");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  useEffect(() => {
    const getLink = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return null;
      }

      return target.closest<HTMLAnchorElement>("a[href]");
    };

    const getSlug = (pathnameValue: string, prefix: string) => {
      const match = pathnameValue.match(new RegExp(`^/${prefix}/([^/]+)`));
      return match?.[1] || "";
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const link = getLink(event.target);

      if (!link) {
        return;
      }

      let url: URL;

      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      const label = (link.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120);
      const sourcePath = `${window.location.pathname}${window.location.search}`;
      const jobSlug = getSlug(url.pathname, "jobs");
      const blogSlug = getSlug(url.pathname, "blog");
      const universitySlug =
        getSlug(url.pathname, "universities") || getSlug(url.pathname, "university");

      if (jobSlug && !["freshers", "internships", "remote", "experienced"].includes(jobSlug)) {
        trackEvent("job_link_click", {
          job_slug: jobSlug,
          link_text: label,
          source_path: sourcePath,
        });
        return;
      }

      if (blogSlug && blogSlug !== "topic") {
        trackEvent("blog_link_click", {
          blog_slug: blogSlug,
          blog_title: label,
          source_path: sourcePath,
        });
        return;
      }

      if (universitySlug) {
        trackEvent("university_link_click", {
          university_slug: universitySlug,
          university_name: label,
          source_path: sourcePath,
        });
      }
    };

    document.addEventListener("click", handleDocumentClick, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("click", handleDocumentClick, {
        capture: true,
      });
    };
  }, []);

  return null;
}
