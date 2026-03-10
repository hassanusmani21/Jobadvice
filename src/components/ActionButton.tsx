import type { ReactNode } from "react";
import Link from "@/components/AppLink";

type ActionButtonVariant = "primary" | "secondary" | "muted" | "danger" | "info";

type ActionButtonProps = {
  children: ReactNode;
  variant?: ActionButtonVariant;
  href?: string;
  buttonType?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
  external?: boolean;
  target?: string;
  rel?: string;
  className?: string;
  ariaLabel?: string;
};

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const variantClassMap: Record<ActionButtonVariant, string> = {
  primary: "job-action-button-primary",
  secondary: "job-action-button-secondary",
  muted: "job-action-button-muted",
  danger: "job-action-button-danger",
  info: "job-action-button-info",
};

export default function ActionButton({
  children,
  variant = "primary",
  href,
  buttonType,
  onClick,
  disabled = false,
  external = false,
  target,
  rel,
  className,
  ariaLabel,
}: ActionButtonProps) {
  const resolvedClassName = joinClasses(
    "job-action-button",
    variantClassMap[variant],
    !href && "job-action-button-static",
    className,
  );

  if (!href && (buttonType || onClick)) {
    return (
      <button
        type={buttonType || "button"}
        onClick={onClick}
        disabled={disabled}
        className={resolvedClassName}
        aria-label={ariaLabel}
      >
        {children}
      </button>
    );
  }

  if (!href) {
    return (
      <span className={resolvedClassName} aria-label={ariaLabel}>
        {children}
      </span>
    );
  }

  if (external) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={resolvedClassName}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={resolvedClassName} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
