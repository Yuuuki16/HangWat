"use client";

import { Clock3, Heart, MapPin, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { mockCandidateComments } from "@/features/events/data/mockCandidateComments";
import type { ScheduleCandidate } from "@/features/events/types/scheduleCandidate";
import {
  loadCandidates,
  saveCandidates,
  sortCandidatesByTime,
} from "@/features/events/utils/candidateStorage";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTimeError, setEditTimeError] = useState("");
  const editTimeInputRef = useRef<HTMLInputElement>(null);

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

  const openEditor = () => {
    if (!candidate) {
      return;
    }

    setEditTitle(candidate.title);
    setEditTime(candidate.time);
    setEditLocation(candidate.location);
    setEditTimeError("");
    setIsEditing(true);
  };

  const handleEditSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const candidates = loadCandidates(eventId);
    const hasSameTime = candidates.some(
      (item) => item.id !== candidateId && item.time === editTime,
    );

    if (hasSameTime) {
      setEditTimeError("同じ時間の予定がすでにあります");
      return;
    }

    const updatedCandidates = sortCandidatesByTime(
      candidates.map((item) =>
        item.id === candidateId
          ? {
              ...item,
              title: editTitle,
              time: editTime,
              location: editLocation,
            }
          : item,
      ),
    );
    const updatedCandidate =
      updatedCandidates.find((item) => item.id === candidateId) ?? null;

    saveCandidates(eventId, updatedCandidates);
    setCandidate(updatedCandidate);
    setIsEditing(false);
  };

  const openEditTimePicker = () => {
    const timeInput = editTimeInputRef.current;

    if (!timeInput) {
      return;
    }

    timeInput.focus();

    try {
      timeInput.showPicker();
    } catch {
      timeInput.click();
    }
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
            onClick={openEditor}
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

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-7 py-10"
          role="presentation"
          onMouseDown={() => setIsEditing(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-edit-title"
            className="relative w-full max-w-sm rounded-[16px] border-2 border-primary bg-background px-9 py-7 shadow-xl"
            onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
          >
            <button
              type="button"
              aria-label="予定編集モーダルを閉じる"
              onClick={() => setIsEditing(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-foreground transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-foreground"
            >
              <X aria-hidden="true" size={20} />
            </button>

            <h2 id="candidate-edit-title" className="sr-only">
              予定候補を編集
            </h2>

            <form className="space-y-7" onSubmit={handleEditSubmit}>
              <label className="block text-primary">
                <span>タイトル</span>
                <input
                  required
                  value={editTitle}
                  placeholder="ここに入力"
                  onChange={(changeEvent) =>
                    setEditTitle(changeEvent.target.value)
                  }
                  className="mt-1 w-full border-b border-primary bg-transparent px-3 py-2 text-foreground outline-none placeholder:text-foreground/55 focus:border-b-2 focus:border-foreground"
                />
              </label>

              <div className="block text-primary">
                <label htmlFor="candidate-edit-time">時間</label>
                <div className="relative mt-1">
                  <input
                    ref={editTimeInputRef}
                    id="candidate-edit-time"
                    type="time"
                    required
                    value={editTime}
                    aria-describedby={
                      editTimeError ? "candidate-edit-time-error" : undefined
                    }
                    aria-invalid={Boolean(editTimeError)}
                    onChange={(changeEvent) => {
                      setEditTime(changeEvent.target.value);
                      setEditTimeError("");
                    }}
                    className={`candidate-time-input w-full border-b bg-transparent px-3 py-2 pr-10 text-foreground outline-none focus:border-b-2 focus:border-foreground ${
                      editTimeError ? "border-danger" : "border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label="時間を選択"
                    onClick={openEditTimePicker}
                    className="absolute right-1 top-1/2 flex -translate-y-1/2 rounded-full p-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
                  >
                    <Clock3 aria-hidden="true" size={18} />
                  </button>
                </div>
                {editTimeError && (
                  <span
                    id="candidate-edit-time-error"
                    role="alert"
                    className="mt-1 block text-sm text-danger"
                  >
                    {editTimeError}
                  </span>
                )}
              </div>

              <label className="block text-primary">
                <span>場所</span>
                <div className="relative mt-1">
                  <input
                    required
                    value={editLocation}
                    placeholder="ここに入力"
                    onChange={(changeEvent) =>
                      setEditLocation(changeEvent.target.value)
                    }
                    className="w-full border-b border-primary bg-transparent px-3 py-2 pr-10 text-foreground outline-none placeholder:text-foreground/55 focus:border-b-2 focus:border-foreground"
                  />
                  <MapPin
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground"
                    size={18}
                  />
                </div>
              </label>

              <div className="flex justify-center pt-1">
                <button
                  type="submit"
                  className="rounded-[10px] bg-primary px-7 py-2 text-xl text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  変更
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
