import ActionButton from "@/components/ActionButton";

export default function NotFoundPage() {
  return (
    <section className="fade-up card-surface rounded-3xl px-6 py-10 text-center sm:px-8">
      <h1 className="font-serif text-4xl text-slate-900">Page Not Found</h1>
      <p className="mt-3 text-slate-600">
        The page you requested does not exist or may have been removed.
      </p>
      <ActionButton href="/jobs" variant="primary" className="mt-6 sm:w-auto">
        Browse Jobs
      </ActionButton>
    </section>
  );
}
