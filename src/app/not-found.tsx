import Link from "@/components/AppLink";

export default function NotFoundPage() {
  return (
    <section className="fade-up card-surface rounded-3xl px-6 py-10 text-center sm:px-8">
      <h1 className="font-serif text-4xl text-slate-900">Page Not Found</h1>
      <p className="mt-3 text-slate-600">
        The page you requested does not exist or may have been removed.
      </p>
      <Link
        href="/jobs"
        className="mt-6 inline-flex rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
      >
        Browse Jobs
      </Link>
    </section>
  );
}
