"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const revealSelector = ".fade-up";
const magneticSelector =
  ".job-action-button, .header-resume-link, .site-footer-action, .home-mobile-filter-chip, .utility-button, .save-job-button";
const surfaceSelector =
  ".surface-hover-glow, .job-card-surface, .blog-card-surface, .card-surface, .page-intro-surface, .home-value-card, .home-community-card, .home-search-shell, .jobs-directory-toolbar, .saved-job-card, .job-detail-fact-card, .content-list-card, .soft-note, .admin-analytics-surface";
const heroSelector = ".home-hero-shell";

function resetMagneticElement(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  element.classList.remove("is-magnetic");
  element.style.removeProperty("--magnetic-x");
  element.style.removeProperty("--magnetic-y");
}

function resetSurfaceElement(element: HTMLElement | null) {
  if (!element) {
    return;
  }

  element.classList.remove("is-surface-active");
  element.style.removeProperty("--surface-x");
  element.style.removeProperty("--surface-y");
  element.style.removeProperty("--surface-magnetic-x");
  element.style.removeProperty("--surface-magnetic-y");
}

export default function PremiumMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    const heroElement = document.querySelector<HTMLElement>(heroSelector);

    root.dataset.revealReady = "true";

    const revealImmediately = reducedMotion || !("IntersectionObserver" in window);

    const watchRevealElement = (element: HTMLElement) => {
      if (element.classList.contains("is-visible")) {
        return;
      }

      if (revealImmediately || !observer) {
        element.classList.add("is-visible");
        return;
      }

      observer.observe(element);
    };

    const watchRevealElements = (rootNode: ParentNode = document) => {
      if (rootNode instanceof HTMLElement && rootNode.matches(revealSelector)) {
        watchRevealElement(rootNode);
      }

      rootNode
        .querySelectorAll<HTMLElement>(revealSelector)
        .forEach((element) => watchRevealElement(element));
    };

    if (!revealImmediately) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          });
        },
        {
          rootMargin: "0px 0px -8% 0px",
          threshold: 0.08,
        },
      );

      observer = revealObserver;
    }

    watchRevealElements();

    if ("MutationObserver" in window) {
      mutationObserver = new MutationObserver((mutationRecords) => {
        mutationRecords.forEach((record) => {
          record.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement || node instanceof DocumentFragment) {
              watchRevealElements(node);
            }
          });
        });
      });

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    let scrollFrame = 0;
    let hasScrolledPastHeader = window.scrollY > 18;

    const updateHeaderScrollState = () => {
      const nextScrolledState = window.scrollY > 18;

      if (nextScrolledState === hasScrolledPastHeader) {
        return;
      }

      hasScrolledPastHeader = nextScrolledState;
      root.dataset.pageScrolled = nextScrolledState ? "true" : "false";
    };

    const updateScrollState = () => {
      if (scrollFrame) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        updateHeaderScrollState();
      });
    };

    root.dataset.pageScrolled = hasScrolledPastHeader ? "true" : "false";
    window.addEventListener("scroll", updateScrollState, { passive: true });

    if (reducedMotion) {
      return () => {
        window.removeEventListener("scroll", updateScrollState);
        observer?.disconnect();
        root.removeAttribute("data-reveal-ready");
        root.removeAttribute("data-page-scrolled");
      };
    }

    let frame = 0;
    let magneticElement: HTMLElement | null = null;
    let surfaceElement: HTMLElement | null = null;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        return;
      }

      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      const pointerX = event.clientX;
      const pointerY = event.clientY;
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(magneticSelector)
          : null;
      const surfaceTarget =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(surfaceSelector)
          : null;
      const heroTarget =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(heroSelector)
          : null;

      frame = window.requestAnimationFrame(() => {
        root.style.setProperty("--cursor-x", `${pointerX}px`);
        root.style.setProperty("--cursor-y", `${pointerY}px`);

        if (heroTarget) {
          const rect = heroTarget.getBoundingClientRect();
          const xRatio = Math.max(0, Math.min(1, (pointerX - rect.left) / rect.width));
          const yRatio = Math.max(0, Math.min(1, (pointerY - rect.top) / rect.height));

          heroTarget.style.setProperty("--hero-pointer-x", `${(xRatio * 100).toFixed(1)}%`);
          heroTarget.style.setProperty("--hero-pointer-y", `${(yRatio * 100).toFixed(1)}%`);
        }

        if (magneticElement && magneticElement !== target) {
          resetMagneticElement(magneticElement);
        }

        magneticElement = target;
        if (surfaceElement && surfaceElement !== surfaceTarget) {
          resetSurfaceElement(surfaceElement);
        }

        surfaceElement = surfaceTarget;

        if (surfaceTarget) {
          const rect = surfaceTarget.getBoundingClientRect();
          const xRatio = Math.max(0, Math.min(1, (pointerX - rect.left) / rect.width));
          const yRatio = Math.max(0, Math.min(1, (pointerY - rect.top) / rect.height));
          const xOffset = (xRatio - 0.5) * 5;
          const yOffset = (yRatio - 0.5) * 4;

          surfaceTarget.style.setProperty("--surface-x", `${(xRatio * 100).toFixed(1)}%`);
          surfaceTarget.style.setProperty("--surface-y", `${(yRatio * 100).toFixed(1)}%`);
          surfaceTarget.style.setProperty("--surface-magnetic-x", `${xOffset.toFixed(2)}px`);
          surfaceTarget.style.setProperty("--surface-magnetic-y", `${yOffset.toFixed(2)}px`);
          surfaceTarget.classList.add("is-surface-active");
        }

        if (!target) {
          return;
        }

        const rect = target.getBoundingClientRect();
        const xOffset = ((pointerX - rect.left) / rect.width - 0.5) * 9;
        const yOffset = ((pointerY - rect.top) / rect.height - 0.5) * 7;

        target.style.setProperty("--magnetic-x", `${xOffset.toFixed(2)}px`);
        target.style.setProperty("--magnetic-y", `${yOffset.toFixed(2)}px`);
        target.classList.add("is-magnetic");
      });
    };

    const handlePointerLeave = () => {
      resetMagneticElement(magneticElement);
      resetSurfaceElement(surfaceElement);
      heroElement?.style.removeProperty("--hero-pointer-x");
      heroElement?.style.removeProperty("--hero-pointer-y");
      magneticElement = null;
      surfaceElement = null;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", handlePointerLeave, { passive: true });

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      if (scrollFrame) {
        window.cancelAnimationFrame(scrollFrame);
      }

      window.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", handlePointerLeave);
      observer?.disconnect();
      mutationObserver?.disconnect();
      resetMagneticElement(magneticElement);
      resetSurfaceElement(surfaceElement);
      heroElement?.style.removeProperty("--hero-parallax-y");
      heroElement?.style.removeProperty("--hero-parallax-soft-y");
      heroElement?.style.removeProperty("--hero-parallax-reverse-y");
      heroElement?.style.removeProperty("--hero-pointer-x");
      heroElement?.style.removeProperty("--hero-pointer-y");
      root.removeAttribute("data-reveal-ready");
      root.removeAttribute("data-page-scrolled");
      root.style.removeProperty("--cursor-x");
      root.style.removeProperty("--cursor-y");
    };
  }, [pathname]);

  return <div aria-hidden="true" className="premium-cursor-aura" />;
}
