"use client";

import {
  CalendarDays,
  ChevronDown,
  Clipboard,
  Link2,
  MapPin,
  Pencil,
  Users,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { Event } from "@/features/events/types/event";
import { formatEventDate } from "@/features/events/utils/formatEventDate";

type EventDetailProps = {
  initialEvent: Event;
};

export function EventDetail({ initialEvent }: EventDetailProps) {
  const [event, setEvent] = useState(initialEvent);
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const copyStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [location, setLocation] = useState(event.location);
  const [details, setDetails] = useState(event.details);

  const formattedDate = formatEventDate(event.date);
  const editingDate = date ? date.slice(5).replace("-", "/") : "MM/DD";

  useEffect(() => {
    return () => {
      if (copyStatusTimerRef.current) {
        clearTimeout(copyStatusTimerRef.current);
      }
    };
  }, []);

  const resetCopyStatusLater = () => {
    if (copyStatusTimerRef.current) {
      clearTimeout(copyStatusTimerRef.current);
    }

    copyStatusTimerRef.current = setTimeout(() => {
      setCopyStatus("idle");
      copyStatusTimerRef.current = null;
    }, 1500);
  };

  const openEditor = () => {
    setTitle(event.title);
    setDate(event.date);
    setLocation(event.location);
    setDetails(event.details);
    setIsEditing(true);
  };

  const handleSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setEvent((currentEvent) => ({
      ...currentEvent,
      title,
      date,
      location,
      details,
    }));
    setIsEditing(false);
  };

  const copyParticipationUrl = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API is unavailable");
      }

      await navigator.clipboard.writeText(event.participationUrl);
      setCopyStatus("success");
      resetCopyStatusLater();
    } catch {
      setCopyStatus("error");
      resetCopyStatusLater();
    }
  };

  return (
    <>
      <main className="flex flex-1 flex-col items-center px-5 pb-14 pt-10">
        <section className="relative w-full max-w-md rounded-base border-2 border-foreground bg-event px-4 py-3">
          <h1
            title={event.title}
            className="truncate pr-20 text-xl leading-tight"
          >
            {event.title}
          </h1>

          <dl className="mt-2 space-y-1.5 text-base">
            <div className="flex min-w-0 items-center gap-2">
              <dt className="shrink-0">
                <CalendarDays aria-label="開催日" size={21} strokeWidth={2} />
              </dt>
              <dd className="truncate whitespace-nowrap">{formattedDate}</dd>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <dt className="shrink-0">
                <MapPin aria-label="開催場所" size={21} strokeWidth={2} />
              </dt>
              <dd
                title={event.location}
                className="truncate whitespace-nowrap"
              >
                {event.location}
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <dt className="shrink-0">
                <Users aria-label="参加者" size={21} strokeWidth={2} />
              </dt>
              <dd className="truncate whitespace-nowrap">
                参加者 {event.participantCount}名
              </dd>
            </div>
            <div className="flex min-w-0 items-center gap-2 pr-20">
              <dt className="shrink-0">
                <Link2 aria-label="参加用URL" size={21} strokeWidth={2} />
              </dt>
              <dd
                title={event.participationUrl}
                className="min-w-0 flex-1 truncate whitespace-nowrap"
              >
                {event.participationUrl}
              </dd>
              <button
                type="button"
                aria-label="参加用リンクをコピー"
                onClick={copyParticipationUrl}
                className="absolute right-3 flex w-[68px] items-center justify-center gap-1 rounded-full bg-primary py-1 text-xs text-white shadow-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Clipboard aria-hidden="true" size={13} />
                {copyStatus === "success" ? "完了" : "コピー"}
              </button>
            </div>
          </dl>

          <p
            aria-live="polite"
            className={`mt-1 min-h-4 text-right text-xs ${
              copyStatus === "error" ? "text-danger" : "text-foreground/60"
            }`}
          >
            {copyStatus === "success" && "リンクをコピーしました"}
            {copyStatus === "error" &&
              "コピーできませんでした。URLを直接コピーしてください"}
          </p>

          <button
            type="button"
            onClick={openEditor}
            className="absolute right-3 top-3 flex w-[68px] items-center justify-center gap-1 rounded-full bg-primary py-1 text-xs text-white shadow-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Pencil aria-hidden="true" size={13} />
            編集
          </button>

          <button
            type="button"
            aria-expanded={isDetailsOpen}
            aria-controls="event-details"
            onClick={() => setIsDetailsOpen((currentState) => !currentState)}
            className="mx-auto mt-2 flex items-center gap-1 text-sm text-foreground/55 transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            詳細
            <ChevronDown
              aria-hidden="true"
              size={16}
              className={`transition-transform ${
                isDetailsOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDetailsOpen && (
            <p
              id="event-details"
              className="mt-2 border-t border-foreground/20 px-2 pt-3 text-sm leading-6"
            >
              {event.details}
            </p>
          )}
        </section>

        <div className="flex flex-1 items-center justify-center py-8">
          <p className="text-center text-xl tracking-[0.08em] text-foreground">
            集合時間を決めましょう
          </p>
        </div>

        <button
          type="button"
          className="min-w-32 rounded-base bg-primary px-8 py-2 text-2xl font-light text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-0"
        >
          追加
        </button>
      </main>

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-7 py-10"
          role="presentation"
          onMouseDown={() => setIsEditing(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-edit-title"
            className="relative w-full max-w-sm rounded-[16px] border-2 border-primary bg-background px-9 py-5 shadow-xl"
            onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
          >
            <button
              type="button"
              aria-label="編集モーダルを閉じる"
              onClick={() => setIsEditing(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-foreground transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X aria-hidden="true" size={20} />
            </button>

            <h2 id="event-edit-title" className="sr-only">
              イベントを編集
            </h2>

            <form className="space-y-7" onSubmit={handleSubmit}>
              <label className="block text-primary">
                <span className="text-lg">タイトル</span>
                <input
                  required
                  value={title}
                  placeholder="ここに入力"
                  onChange={(changeEvent) => setTitle(changeEvent.target.value)}
                  className="mt-1 w-full border-b border-primary bg-transparent px-5 py-2 text-lg text-foreground outline-none placeholder:text-foreground/65 focus:border-b-2"
                />
              </label>

              <label className="block text-primary">
                <span className="text-lg">日時</span>
                <div className="relative mt-1 border-b border-primary focus-within:border-b-2">
                  <span className="block py-2 pl-5 pr-12 text-lg text-foreground">
                    {editingDate}
                  </span>
                  <input
                    type="date"
                    required
                    aria-label="日時"
                    value={date}
                    onChange={(changeEvent) => setDate(changeEvent.target.value)}
                    className="absolute inset-0 z-10 cursor-pointer opacity-0"
                  />
                  <CalendarDays
                    aria-hidden="true"
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-foreground"
                    size={20}
                    strokeWidth={2}
                  />
                </div>
              </label>

              <div className="block text-primary">
                <span className="text-lg">場所</span>
                <div className="relative mt-1">
                  <input
                    required
                    value={location}
                    placeholder="ここに入力"
                    onChange={(changeEvent) =>
                      setLocation(changeEvent.target.value)
                    }
                    className="w-full border-b border-primary bg-transparent py-2 pl-5 pr-12 text-lg text-foreground outline-none placeholder:text-foreground/65 focus:border-b-2"
                  />
                  <MapPin
                    aria-hidden="true"
                    className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-foreground"
                    size={20}
                    strokeWidth={2}
                  />
                </div>
              </div>

              <label className="block text-primary">
                <span className="text-lg">詳細</span>
                <input
                  value={details}
                  placeholder="ここに入力"
                  onChange={(changeEvent) => setDetails(changeEvent.target.value)}
                  className="mt-1 w-full border-b border-primary bg-transparent px-5 py-2 text-lg text-foreground outline-none placeholder:text-foreground/65 focus:border-b-2"
                />
              </label>

              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  className="rounded-base bg-primary px-7 py-2 text-2xl text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  変更
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
