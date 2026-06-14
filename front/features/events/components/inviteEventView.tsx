"use client";

import {
  CalendarDays,
  ChevronDown,
  Link2,
  MapPin,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { Event } from "@/features/events/types/event";
import { formatEventDate } from "@/features/events/utils/formatEventDate";

type InviteEventViewProps = {
  event: Event;
};

export function InviteEventView({ event }: InviteEventViewProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleClose = () => setDisplayName("");
    dialog.addEventListener("close", handleClose);

    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  const openJoinDialog = () => {
    dialogRef.current?.showModal();
    window.setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const closeJoinDialog = () => {
    dialogRef.current?.close();
  };

  const handleJoin = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!displayName.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    closeJoinDialog();
    router.push(`/events/${event.id}`);
  };

  return (
    <main className="flex flex-1 flex-col items-center px-5 pb-14 pt-10">
      <section className="w-full max-w-md rounded-base border-2 border-foreground bg-event px-4 py-3">
        <h1 title={event.title} className="truncate text-xl leading-tight">
          {event.title}
        </h1>

        <dl className="mt-2 space-y-1.5 text-base">
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0">
              <CalendarDays aria-label="開催日" size={21} strokeWidth={2} />
            </dt>
            <dd className="truncate whitespace-nowrap">
              {formatEventDate(event.date)}
            </dd>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0">
              <MapPin aria-label="開催場所" size={21} strokeWidth={2} />
            </dt>
            <dd title={event.location} className="truncate whitespace-nowrap">
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
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0">
              <Link2 aria-label="参加用URL" size={21} strokeWidth={2} />
            </dt>
            <dd
              title={event.participationUrl}
              className="min-w-0 flex-1 truncate whitespace-nowrap"
            >
              {event.participationUrl}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          aria-expanded={isDetailsOpen}
          aria-controls="invite-event-details"
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
            id="invite-event-details"
            className="mt-2 border-t border-foreground/20 px-2 pt-3 text-sm leading-6"
          >
            {event.details}
          </p>
        )}
      </section>

      <div className="flex w-full max-w-md flex-1 items-center justify-center py-9">
        <p className="text-center text-lg">
          イベントに参加して、みんなの予定を確認しましょう
        </p>
      </div>

      <button
        type="button"
        onClick={openJoinDialog}
        className="min-w-32 rounded-base bg-primary px-8 py-2 text-2xl font-light text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-0"
      >
        参加
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="join-dialog-title"
        className="m-auto w-[calc(100%-2.5rem)] max-w-sm rounded-xl border-2 border-primary bg-background p-0 text-foreground shadow-xl backdrop:bg-black/45"
        onClick={(mouseEvent) => {
          if (mouseEvent.target === dialogRef.current) {
            closeJoinDialog();
          }
        }}
      >
        <form onSubmit={handleJoin} className="relative px-6 pb-5 pt-7">
          <button
            type="button"
            onClick={closeJoinDialog}
            aria-label="閉じる"
            className="absolute right-3 top-3 rounded-full p-1 text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X aria-hidden="true" size={20} />
          </button>

          <h2
            id="join-dialog-title"
            className="text-center text-lg text-primary"
          >
            お名前を入力してください
          </h2>

          <label className="mt-5 flex items-center gap-2 border-b-2 border-primary px-1 pb-1">
            <UserRound
              aria-hidden="true"
              size={20}
              className="shrink-0 text-primary"
            />
            <span className="sr-only">お名前</span>
            <input
              ref={nameInputRef}
              value={displayName}
              onChange={(changeEvent) => setDisplayName(changeEvent.target.value)}
              required
              maxLength={30}
              placeholder="ここに入力"
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-foreground/45"
            />
          </label>

          <button
            type="submit"
            className="mx-auto mt-8 block w-32 rounded-xl bg-primary py-2 text-lg text-white shadow-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            参加
          </button>
        </form>
      </dialog>
    </main>
  );
}
