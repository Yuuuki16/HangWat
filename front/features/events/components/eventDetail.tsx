"use client";

import {
  CalendarClock,
  CalendarDays,
  ChevronDown,
  Clipboard,
  Clock,
  Link2,
  MapPin,
  MessageSquare,
  Pencil,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { Event } from "@/features/events/types/event";
import type { ScheduleCandidate } from "@/features/events/types/scheduleCandidate";
import {
  loadCandidates,
  saveCandidates,
  sortCandidatesByTime,
} from "@/features/events/utils/candidateStorage";
import { formatEventDate } from "@/features/events/utils/formatEventDate";

type EventDetailProps = {
  initialEvent: Event;
};

export function EventDetail({ initialEvent }: EventDetailProps) {
  const [event, setEvent] = useState(initialEvent);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [candidates, setCandidates] = useState<ScheduleCandidate[]>([]);
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const copyStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candidateTimeInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [location, setLocation] = useState(event.location);
  const [details, setDetails] = useState(event.details);
  const [candidateTitle, setCandidateTitle] = useState("");
  const [candidateTime, setCandidateTime] = useState("");
  const [candidateLocation, setCandidateLocation] = useState("");
  const [candidateTimeError, setCandidateTimeError] = useState("");

  const formattedDate = formatEventDate(event.date);
  const editingDate = date ? date.slice(5).replace("-", "/") : "MM/DD";

  useEffect(() => {
    const loadStoredCandidates = () => {
      setCandidates(loadCandidates(event.id));
    };
    const loadTimer = window.setTimeout(loadStoredCandidates, 0);

    const handlePageShow = () => {
      loadStoredCandidates();
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.clearTimeout(loadTimer);
      window.removeEventListener("pageshow", handlePageShow);
      if (copyStatusTimerRef.current) {
        clearTimeout(copyStatusTimerRef.current);
      }
    };
  }, [event.id]);

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

  const handleCandidateSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (candidates.some((candidate) => candidate.time === candidateTime)) {
      setCandidateTimeError("同じ時間の予定がすでにあります");
      return;
    }

    const newCandidate: ScheduleCandidate = {
      id: crypto.randomUUID(),
      title: candidateTitle,
      time: candidateTime,
      location: candidateLocation,
      status: "pending",
      commentCount: 0,
    };
    const nextCandidates = sortCandidatesByTime([...candidates, newCandidate]);

    setCandidates(nextCandidates);
    saveCandidates(event.id, nextCandidates);
    setCandidateTitle("");
    setCandidateTime("");
    setCandidateLocation("");
    setCandidateTimeError("");
    setIsAddingCandidate(false);
  };

  const openTimePicker = () => {
    const timeInput = candidateTimeInputRef.current;

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

        <div className="flex w-full max-w-md flex-1 flex-col justify-center py-9">
          {candidates.length > 0 ? (
            <>
              <ol className="ml-4">
                {candidates.map((candidate, index) => (
                  <li
                    key={candidate.id}
                    className={`relative grid min-h-28 items-start ${
                      candidate.status === "confirmed"
                        ? "grid-cols-[40px_0_0_1fr]"
                        : "grid-cols-[40px_40px_24px_1fr]"
                    }`}
                  >
                    <span
                      aria-label={
                        candidate.status === "confirmed"
                          ? "予定確定済み"
                          : "分岐地点"
                      }
                      className={`z-10 ml-0.5 mt-[14px] h-9 w-9 rounded-full border-[3px] border-graph-green ${
                        candidate.status === "confirmed"
                          ? "bg-graph-green shadow-[inset_0_0_0_5px_var(--background)]"
                          : "border-dotted bg-background"
                      }`}
                    />
                    {candidate.status === "pending" && (
                      <>
                        <span
                          aria-hidden="true"
                          className="mx-2 mt-[31px] h-0 border-t-[3px] border-dashed border-graph-orange"
                        />
                        <span
                          aria-label="決定待ち"
                          className="z-10 mt-5 h-6 w-6 rounded-full border-[3px] border-graph-orange bg-graph-orange"
                        />
                      </>
                    )}
                    <Link
                      href={`/events/${event.id}/slots/${candidate.id}`}
                      className="col-start-4 ml-3 block rounded-[28px] border-2 border-foreground bg-white px-5 py-3 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <p className="truncate text-sm">{candidate.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock aria-hidden="true" size={14} />
                          {candidate.time}
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <MapPin aria-hidden="true" size={14} />
                          <span className="max-w-32 truncate">
                            {candidate.location}
                          </span>
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1">
                          <MessageSquare aria-hidden="true" size={14} />
                          {candidate.commentCount}件
                        </span>
                      </div>
                    </Link>
                    <span
                      aria-hidden="true"
                      className={`absolute left-[19px] top-[54px] border-l-2 ${
                        index === candidates.length - 1
                          ? "border-dashed border-[#a9a9a9]"
                          : "border-solid border-graph-green"
                      } ${
                        index === candidates.length - 1
                          ? "bottom-1"
                          : "bottom-[-10px]"
                      }`}
                    />
                  </li>
                ))}
                <li className="relative h-6">
                  <span
                    aria-label="次の予定候補"
                    className="absolute left-2 top-0 h-6 w-6 rounded-full border-[3px] border-[#a9a9a9] bg-background"
                  />
                </li>
              </ol>
              <p className="mt-7 text-center text-xl tracking-[0.08em] text-foreground">
                他の予定も作成しましょう
              </p>
            </>
          ) : (
            <p className="text-center text-xl tracking-[0.08em] text-foreground">
              集合時間を決めましょう
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setCandidateTimeError("");
            setIsAddingCandidate(true);
          }}
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

      {isAddingCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-7 py-10"
          role="presentation"
          onMouseDown={() => setIsAddingCandidate(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-add-title"
            className="relative w-full max-w-sm rounded-[16px] border-2 border-primary bg-background px-9 py-7 shadow-xl"
            onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
          >
            <button
              type="button"
              aria-label="予定追加モーダルを閉じる"
              onClick={() => setIsAddingCandidate(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-foreground transition-colors hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-foreground"
            >
              <X aria-hidden="true" size={20} />
            </button>

            <h2 id="candidate-add-title" className="sr-only">
              予定候補を追加
            </h2>

            <form className="space-y-7" onSubmit={handleCandidateSubmit}>
              <label className="block text-primary">
                <span>タイトル</span>
                <input
                  required
                  value={candidateTitle}
                  placeholder="ここに入力"
                  onChange={(changeEvent) =>
                    setCandidateTitle(changeEvent.target.value)
                  }
                  className="mt-1 w-full border-b border-primary bg-transparent px-3 py-2 text-foreground outline-none placeholder:text-foreground/55 focus:border-b-2 focus:border-foreground"
                />
              </label>

              <div className="block text-primary">
                <label htmlFor="candidate-time">時間</label>
                <div className="relative mt-1">
                  <input
                    ref={candidateTimeInputRef}
                    id="candidate-time"
                    type="time"
                    required
                    value={candidateTime}
                    aria-describedby={
                      candidateTimeError ? "candidate-time-error" : undefined
                    }
                    aria-invalid={Boolean(candidateTimeError)}
                    onChange={(changeEvent) => {
                      setCandidateTime(changeEvent.target.value);
                      setCandidateTimeError("");
                    }}
                    className={`candidate-time-input w-full border-b bg-transparent px-3 py-2 pr-10 outline-none focus:border-b-2 focus:border-foreground ${
                      candidateTimeError ? "border-danger" : "border-primary"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label="時間を選択"
                    onClick={openTimePicker}
                    className="absolute right-1 top-1/2 flex -translate-y-1/2 rounded-full p-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-foreground"
                  >
                    <Clock aria-hidden="true" size={18} />
                  </button>
                </div>
                {candidateTimeError && (
                  <span
                    id="candidate-time-error"
                    role="alert"
                    className="mt-1 block text-sm text-danger"
                  >
                    {candidateTimeError}
                  </span>
                )}
              </div>

              <label className="block text-primary">
                <span>場所</span>
                <div className="relative mt-1">
                  <input
                    required
                    value={candidateLocation}
                    placeholder="ここに入力"
                    onChange={(changeEvent) =>
                      setCandidateLocation(changeEvent.target.value)
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
                  className="rounded-base bg-primary px-7 py-2 text-xl text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  追加
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
