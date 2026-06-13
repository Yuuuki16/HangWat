import Link from "next/link";
import { EventCard } from "@/features/events/components/eventCard";
import { mockEvents } from "@/features/events/data/mockEvents";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-16">
      <section aria-label="イベント一覧" className="mt-16 grid w-full max-w-md gap-8">
        {mockEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </section>

      <div className="flex flex-1 items-center justify-center py-8">
        <p className="text-center text-xl tracking-[0.08em] text-foreground">
          新しい予定をつくってみましょう
        </p>
      </div>

      <Link
        href="/events/new"
        className="flex min-h-14 items-center justify-center rounded-base bg-primary px-5 py-3 text-3xl font-light text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-0"
      >
        イベント作成
      </Link>
    </main>
  );
}
