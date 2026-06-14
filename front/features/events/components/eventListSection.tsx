"use client";

import { CalendarClock, CheckCircle2, ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { EventCard } from "@/features/events/components/eventCard";
import type { Event } from "@/features/events/types/event";

type EventListSectionProps = {
  title: string;
  description: string;
  events: Event[];
  defaultOpen: boolean;
  variant: "upcoming" | "past";
};

export function EventListSection({
  title,
  description,
  events,
  defaultOpen,
  variant,
}: EventListSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [visibleEvents, setVisibleEvents] = useState(events);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const contentId = useId();
  const deleteDialogTitleId = useId();
  const Icon = variant === "upcoming" ? CalendarClock : CheckCircle2;

  const handleDelete = () => {
    if (!eventToDelete) {
      return;
    }

    setVisibleEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== eventToDelete.id),
    );
    setEventToDelete(null);
  };

  return (
    <>
      <section className="overflow-hidden rounded-[20px] border border-primary/35 bg-background shadow-[0_6px_18px_rgb(103_54_54/0.06)]">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen((currentState) => !currentState)}
          className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
        >
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
              variant === "upcoming"
                ? "bg-primary/20 text-primary"
                : "bg-foreground/10 text-foreground/55"
            }`}
          >
            <Icon aria-hidden="true" size={21} strokeWidth={2.2} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-[0.04em]">
                {title}
              </span>
              <span className="text-sm text-foreground/55">
                {visibleEvents.length}件
              </span>
            </span>
            <span className="mt-0.5 block text-xs text-foreground/55">
              {description}
            </span>
          </span>

          <ChevronDown
            aria-hidden="true"
            size={22}
            className={`shrink-0 text-foreground/55 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          id={contentId}
          aria-hidden={!isOpen}
          inert={!isOpen}
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid gap-4 border-t border-primary/25 px-4 py-4">
              {visibleEvents.length > 0 ? (
                visibleEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onDelete={setEventToDelete}
                  />
                ))
              ) : (
                <p className="rounded-base border border-dashed border-foreground/20 bg-background/65 px-4 py-6 text-center text-sm text-foreground/50">
                  {variant === "upcoming"
                    ? "これからの予定はまだありません"
                    : "終了した予定はまだありません"}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {eventToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-7 py-10"
          role="presentation"
          onMouseDown={() => setEventToDelete(null)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={deleteDialogTitleId}
            className="w-full max-w-sm rounded-[16px] border-2 border-primary bg-background px-5 py-10 shadow-xl"
            onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
          >
            <h2
              id={deleteDialogTitleId}
              className="text-center text-xl text-foreground"
            >
              本当に消しますか？
            </h2>

            <div className="mt-6 flex items-center justify-center gap-7">
              <button
                type="button"
                onClick={handleDelete}
                className="min-w-24 rounded-[10px] bg-danger px-5 py-2 text-lg text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
              >
                消す
              </button>
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="min-w-24 rounded-[10px] bg-primary px-4 py-2 text-lg text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                消さない
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
