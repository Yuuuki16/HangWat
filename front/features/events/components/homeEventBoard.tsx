"use client";

import { useEffect, useState } from "react";
import { EventListSection } from "@/features/events/components/eventListSection";
import { listEvents } from "@/features/events/services/eventApi";
import type { Event } from "@/features/events/types/event";
import { mapEventListItem } from "@/features/events/utils/mapEvent";

function todayText() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

export function HomeEventBoard() {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      const result = await listEvents();
      if (!active) {
        return;
      }

      if (result.ok) {
        setEvents(result.data.events.map(mapEventListItem));
        setErrorMessage(null);
      } else {
        setErrorMessage(result.message);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (errorMessage) {
    return (
      <p
        role="alert"
        className="w-full max-w-md rounded-base border-2 border-red-400 bg-red-50 px-4 py-3 text-base text-red-700"
      >
        {errorMessage}
      </p>
    );
  }

  if (events === null) {
    return (
      <p className="w-full max-w-md py-10 text-center text-foreground/55">
        読み込み中...
      </p>
    );
  }

  const today = todayText();
  const upcomingEvents = events.filter((event) => event.date >= today);
  const pastEvents = events.filter((event) => event.date < today);

  return (
    <div aria-label="イベント一覧" className="grid w-full max-w-md gap-5">
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
  );
}
