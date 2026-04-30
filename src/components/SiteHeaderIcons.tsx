export function ResumeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0">
      <path
        d="M6.25 3.75h5.9l2.6 2.6v9.4a.5.5 0 0 1-.5.5h-8.5a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M12.15 3.75v2.6h2.6M7.7 9h4.6M7.7 11.6h4.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function MenuIcon({
  open,
  className = "h-4 w-4 shrink-0",
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className}>
      {open ? (
        <path
          d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.9"
        />
      ) : (
        <path
          d="M4.75 6h10.5M4.75 10h10.5M4.75 14h10.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.9"
        />
      )}
    </svg>
  );
}

export function ChevronRightIcon({ className = "h-4 w-4 shrink-0" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={className}>
      <path
        d="M8 5.75 12.75 10 8 14.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}
