import { CalendarDays, MapPin, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Event } from "@/features/events/types/event";
import { formatEventDate } from "@/features/events/utils/formatEventDate";

type EventCardProps = {
  event: Event;
  onDelete: (event: Event) => void;
};

export function EventCard({ event, onDelete }: EventCardProps) {
  return (
    <article className="relative rounded-base border-2 border-foreground bg-event px-3 py-2">
      <Link
        href={`/events/${event.id}`}
        aria-label={`${event.title}の詳細を見る`}
        className="absolute inset-0 rounded-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      />

      <h2 className="text-lg leading-tight">{event.title}</h2>

      <dl className="mt-1 space-y-0.5 text-sm">
        <div className="flex items-center gap-2">
          <dt>
            <CalendarDays aria-label="開催日" size={18} strokeWidth={2} />
          </dt>
          <dd>{formatEventDate(event.date)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>
            <MapPin aria-label="開催場所" size={18} strokeWidth={2} />
          </dt>
          <dd>{event.location}</dd>
        </div>
      </dl>

      <button
        type="button"
        aria-label={`${event.title}を削除`}
        onClick={() => onDelete(event)}
        className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-full bg-danger px-3 py-1 text-xs text-white shadow-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
      >
        <Trash2 aria-hidden="true" size={14} />
        削除
      </button>
    </article>
  );
}
