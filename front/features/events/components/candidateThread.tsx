"use client";

import { Clock3, Heart, MapPin } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { mockCandidateComments } from "@/features/events/data/mockCandidateComments";
import type { ScheduleCandidate } from "@/features/events/types/scheduleCandidate";
import { loadCandidates } from "@/features/events/utils/candidateStorage";

type CandidateThreadProps = {
  eventId: string;
  candidateId: string;
};

export function CandidateThread({
  eventId,
  candidateId,
}: CandidateThreadProps) {
  const [candidate, setCandidate] = useState<ScheduleCandidate | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      setCandidate(
        loadCandidates(eventId).find((item) => item.id === candidateId) ?? null,
      );
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [candidateId, eventId]);

  const handleCommentSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    setComment("");
  };

  if (!isLoaded) {
    return <main className="flex-1" />;
  }

  if (!candidate) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6">
        <p>予定候補が見つかりませんでした。</p>
        <Link
          href={`/events/${eventId}`}
          className="text-primary underline underline-offset-4"
        >
          イベントへ戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-5 pt-6">
      <section aria-labelledby="candidate-title" className="text-center">
        <h1 id="candidate-title" className="text-2xl">
          {candidate.title}
        </h1>
        <div className="mt-3 flex items-center justify-center gap-6 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" size={17} strokeWidth={2} />
            {candidate.time}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin aria-hidden="true" size={17} strokeWidth={2} />
            <span className="max-w-44 truncate">{candidate.location}</span>
          </span>
        </div>

        <div className="mt-5 flex items-center justify-center gap-8">
          <button
            type="button"
            className="rounded-[10px] bg-primary px-4 py-2 text-sm text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            予定確定
          </button>
          <button
            type="button"
            className="rounded-[10px] bg-primary px-5 py-2 text-sm text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            編集
          </button>
          <button
            type="button"
            className="rounded-[10px] bg-danger px-5 py-2 text-sm text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
          >
            削除
          </button>
        </div>
      </section>

      <section aria-label="コメント一覧" className="mt-8 space-y-4">
        {mockCandidateComments.map((item) => (
          <article key={item.id}>
            <p className="mb-1 text-[11px]">{item.displayName}</p>
            <div className="grid grid-cols-[32px_minmax(0,1fr)_34px] items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-1 size-7 rounded-full bg-zinc-200"
              />

              <div className="relative w-fit max-w-full">
                <span
                  aria-hidden="true"
                  className="absolute -left-[9px] top-2 border-y-[6px] border-r-[10px] border-y-transparent border-r-foreground/55"
                />
                <span
                  aria-hidden="true"
                  className="absolute -left-[7px] top-[9px] z-10 border-y-[5px] border-r-[9px] border-y-transparent border-r-white"
                />
                <p className="relative rounded-[14px] border border-foreground/55 bg-white px-4 py-2 text-base leading-6">
                  {item.body}
                </p>
              </div>

              <div className="flex flex-col items-center pt-1 text-xs">
                <Heart aria-hidden="true" size={20} strokeWidth={1.8} />
                <span>{item.likeCount}</span>
              </div>
            </div>
          </article>
        ))}
      </section>

      <form
        onSubmit={handleCommentSubmit}
        className="mb-4 mt-auto pt-8"
      >
        <label htmlFor="candidate-comment" className="sr-only">
          コメント
        </label>
        <input
          id="candidate-comment"
          value={comment}
          placeholder="テキスト入力"
          onChange={(changeEvent) => setComment(changeEvent.target.value)}
          className="w-full rounded-[12px] border-2 border-primary bg-white px-4 py-2 text-center text-sm text-foreground outline-none placeholder:text-foreground/55 focus:border-foreground"
        />
      </form>
    </main>
  );
}
