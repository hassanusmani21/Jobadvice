type EmptyStateCardProps = {
  title: string;
  description?: string;
};

export default function EmptyStateCard({
  title,
  description,
}: EmptyStateCardProps) {
  return (
    <div className="card-surface px-5 py-8 text-center sm:px-8 sm:py-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-teal-50 shadow-[0_16px_28px_-22px_rgba(15,23,42,0.18)]">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 text-teal-900">
          <path
            d="M7 4.75h7l4 4v10.5a1.75 1.75 0 0 1-1.75 1.75h-9.5A1.75 1.75 0 0 1 5 19.25V6.5A1.75 1.75 0 0 1 6.75 4.75Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path
            d="M14 4.75v4h4M8.5 12h7M8.5 15.5h5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      </div>
      <h3 className="mt-5 font-serif text-[1.5rem] leading-[1.2] text-slate-900">{title}</h3>
      {description ? (
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
