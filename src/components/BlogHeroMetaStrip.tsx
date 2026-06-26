import ListenArticleButton from "@/components/ListenArticleButton";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  siteVerifiedPublisherName,
  siteVerifiedPublisherPhotoPath,
} from "@/lib/site";

type BlogHeroMetaStripProps = {
  publishedDateLabel: string;
  articleListenText: string;
  readingTimeMinutes: number;
};

type MetaCardProps = {
  children: ReactNode;
  className?: string;
};

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

const VerifiedBadgeIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    className="h-3.5 w-3.5 shrink-0"
    fill="none"
    stroke="#ffffff"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.3"
  >
    <path d="m5.9 10.1 2.4 2.5 5.8-6" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    className="h-4 w-4 shrink-0 text-slate-600"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.7"
  >
    <path d="M5.2 3.5v2.2m9.6-2.2v2.2M4.4 6.2h11.2A1.4 1.4 0 0 1 17 7.6v7A1.4 1.4 0 0 1 15.6 16H4.4A1.4 1.4 0 0 1 3 14.6v-7a1.4 1.4 0 0 1 1.4-1.4Zm0 3.1H17" />
  </svg>
);

const MetaCard = ({ children, className }: MetaCardProps) => (
  <section
    className={joinClasses(
      "blog-hero-meta-card group relative isolate flex min-h-[2.9rem] items-center overflow-hidden p-1.5 sm:min-h-[3.05rem] sm:p-1.5",
      className,
    )}
  >
    <div className="relative flex w-full items-center">{children}</div>
  </section>
);

export default function BlogHeroMetaStrip({
  publishedDateLabel,
  articleListenText,
  readingTimeMinutes,
}: BlogHeroMetaStripProps) {
  return (
    <div className="mt-1.5 grid items-stretch gap-1.5 lg:grid-cols-[max-content_max-content_max-content]">
      <MetaCard
        className="blog-hero-meta-card-author"
      >
        <div className="flex items-center gap-1.5">
          <a
            href={siteVerifiedPublisherPhotoPath}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${siteVerifiedPublisherName} photo`}
            className="group/avatar shrink-0"
          >
            <span className="blog-hero-meta-avatar-frame block transition duration-300 group-hover/avatar:scale-[1.02]">
              <span className="blog-hero-meta-avatar-shell block overflow-hidden">
                <Image
                  src={siteVerifiedPublisherPhotoPath}
                  alt={siteVerifiedPublisherName}
                  width={112}
                  height={112}
                  className="h-8 w-8 rounded-[10px] object-cover sm:h-[2.15rem] sm:w-[2.15rem]"
                  sizes="34px"
                />
              </span>
            </span>
          </a>

          <div className="flex min-w-0 items-center gap-1.5">
            <p className="blog-hero-meta-name truncate text-[0.8rem] font-semibold tracking-[-0.02em] sm:text-[0.86rem]">
              {siteVerifiedPublisherName}
            </p>
            <span
              aria-label="Verified"
              className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#10b981,#059669)] shadow-[0_10px_20px_-14px_rgba(16,185,129,0.92)] ring-2 ring-emerald-50/80"
            >
              <VerifiedBadgeIcon />
            </span>
          </div>
        </div>
      </MetaCard>

      <MetaCard
        className="blog-hero-meta-card-date"
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="blog-hero-meta-icon-shell inline-flex h-[1.35rem] w-[1.35rem] shrink-0 items-center justify-center rounded-[10px]">
            <span className="blog-hero-meta-icon">
              <CalendarIcon />
            </span>
          </span>
          <p className="blog-hero-meta-date text-[0.76rem] font-semibold tracking-[-0.01em] sm:text-[0.82rem]">
            {publishedDateLabel}
          </p>
        </div>
      </MetaCard>

      <MetaCard
        className="blog-hero-meta-card-action"
      >
        <ListenArticleButton
          text={articleListenText}
          readingTimeMinutes={readingTimeMinutes}
        />
      </MetaCard>
    </div>
  );
}
