import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn what JobAdvice publishes and how the platform helps job seekers find relevant openings.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <section className="fade-up card-surface rounded-3xl px-5 py-6 sm:px-8 sm:py-8">
      <h1 className="font-serif text-[1.5rem] leading-[1.2] text-slate-900">About JobAdvice</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-sm leading-7 text-slate-700 sm:text-base">
        <p>
          JobAdvice shares job openings, fresher opportunities, and career updates in a clean,
          easy-to-read format.
        </p>
        <p>
          The focus is simple: relevant roles, clear details, and direct apply links without extra
          clutter.
        </p>
      </div>
    </section>
  );
}
