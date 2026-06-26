import Image from "next/image";
import Link from "@/components/AppLink";
import SiteHeaderClientControls from "@/components/SiteHeaderClientControls";
import { primaryNavigation } from "@/lib/navigation";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 mx-auto w-full max-w-6xl px-3 pt-1.5 min-[360px]:px-4 min-[360px]:pt-2 sm:px-6 sm:pt-2.5 lg:px-8 lg:pt-2">
      <div className="fade-up header-shell header-shell-top relative rounded-[1.15rem] px-3 py-2.5 min-[360px]:px-3.5 sm:rounded-2xl sm:px-4 sm:py-2.5 lg:px-[1.05rem]">
        <div className="hidden items-center gap-3.5 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <Link href="/" aria-label="JobAdvice Home" className="inline-flex items-center">
            <Image
              src="/jobadvice-logo.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-light h-auto w-[132px] sm:w-[190px]"
            />
            <Image
              src="/jobadvice-logo-dark.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-dark h-auto w-[132px] sm:w-[190px]"
            />
          </Link>

          <nav
            className="header-primary-nav mx-auto flex flex-wrap items-center justify-center gap-1 px-1.5 py-1 text-[0.83rem] font-semibold text-slate-600 lg:gap-1"
            aria-label="Primary"
          >
            {primaryNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="header-primary-link rounded-[0.8rem] px-3 py-1.5 transition-[background-color,color,box-shadow] hover:text-slate-900 lg:px-3 lg:py-1.5"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <SiteHeaderClientControls mode="desktop" />
        </div>

        <div className="flex items-center justify-between gap-2.5 lg:hidden">
          <Link href="/" aria-label="JobAdvice Home" className="inline-flex min-w-0 items-center">
            <Image
              src="/jobadvice-logo.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-light h-auto w-[104px] max-w-full min-[360px]:w-[116px]"
            />
            <Image
              src="/jobadvice-logo-dark.svg"
              alt="JobAdvice"
              width={220}
              height={76}
              priority
              className="jobadvice-logo-dark h-auto w-[104px] max-w-full min-[360px]:w-[116px]"
            />
          </Link>

          <SiteHeaderClientControls mode="mobile" />
        </div>
      </div>
    </header>
  );
}
