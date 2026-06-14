import Link from "next/link";
import { EventListSection } from "@/features/events/components/eventListSection";
import { mockEvents } from "@/features/events/data/mockEvents";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const today = new Date();
  const todayText = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const upcomingEvents = mockEvents.filter((event) => event.date >= todayText);
  const pastEvents = mockEvents.filter((event) => event.date < todayText);

  return (
    <main className="flex flex-1 flex-col items-center px-5 pb-14">
      <div className="w-full max-w-md pb-6 pt-10">
        <h1 className="text-2xl font-semibold tracking-[0.06em]">
          みんなとの予定
        </h1>
      </div>

      <div
        aria-label="イベント一覧"
        className="grid w-full max-w-md gap-5"
      >
        <EventListSection
          title="これからの予定"
          description="開催予定のイベント"
          events={upcomingEvents}
          defaultOpen
          variant="upcoming"
        />
        <EventListSection
          title="終わった予定"
          description="これまでに開催したイベント"
          events={pastEvents}
          defaultOpen={false}
          variant="past"
        />
      </div>

      <Link
        href="/events/new"
        className="mt-10 flex min-h-14 w-full max-w-md items-center justify-center rounded-base bg-primary px-5 py-3 text-xl font-medium tracking-[0.08em] text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-0"
      >
        新しい予定をつくる
      </Link>
    </main>
  );
}
