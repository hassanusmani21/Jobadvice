import NextLink, { type LinkProps } from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

type AppLinkProps = LinkProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof LinkProps> & {
    prefetch?: boolean | null;
  };

const normalizePathname = (pathname: string) => {
  if (
    pathname === "/" ||
    pathname.endsWith("/") ||
    pathname.startsWith("/api") ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return pathname;
  }

  return `${pathname}/`;
};

const withNormalizedHref = (href: LinkProps["href"]): LinkProps["href"] => {
  if (typeof href === "string") {
    if (!href.startsWith("/")) {
      return href;
    }

    const match = href.match(/^([^?#]*)(.*)$/);
    const pathname = match?.[1] || href;
    const suffix = match?.[2] || "";
    return `${normalizePathname(pathname)}${suffix}`;
  }

  if (href && typeof href === "object" && typeof href.pathname === "string") {
    return {
      ...href,
      pathname: normalizePathname(href.pathname),
    };
  }

  return href;
};

const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { prefetch = false, href, ...props },
  ref,
) {
  // Default prefetch is disabled to avoid stale background route chunk requests during deploy swaps.
  return <NextLink ref={ref} prefetch={prefetch} href={withNormalizedHref(href)} {...props} />;
});

export default AppLink;
