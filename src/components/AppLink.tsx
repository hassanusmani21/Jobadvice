import NextLink, { type LinkProps } from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

type AppLinkProps = LinkProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof LinkProps> & {
    prefetch?: boolean | null;
  };

const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(function AppLink(
  { prefetch = false, ...props },
  ref,
) {
  // Default prefetch is disabled to avoid stale background route chunk requests during deploy swaps.
  return <NextLink ref={ref} prefetch={prefetch} {...props} />;
});

export default AppLink;
