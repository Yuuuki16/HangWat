"use client";

import { Clock3, Heart, MapPin, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getEventDetail } from "@/features/events/data/eventDetailApi";
import {
  cancelScheduleCandidateConfirmation,
  confirmScheduleCandidate,
  deleteScheduleCandidate,
  updateScheduleCandidate,
} from "@/features/events/data/scheduleCandidateApi";
import {
  likeComment,
  listComments,
  postComment,
  unlikeComment,
} from "@/features/events/data/commentsApi";
import type { Comment, ScheduleCandidate } from "@/features/events/types/scheduleCandidate";
import { getStoredEventMemberId } from "@/features/events/utils/eventMemberStorage";
import { buildCandidateStartAt } from "@/features/events/utils/scheduleCandidateDateTime";
import { ApiError } from "@/lib/apiClient";

type CandidateThreadProps = {
  eventId: string;
  candidateId: string;
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
};

export function CandidateThread({
  eventId,
  candidateId,
}: CandidateThreadProps) {
  const router = useRouter();
  const [candidate, setCandidate] = useState<ScheduleCandidate | null>(null);
  const [eventCandidates, setEventCandidates] = useState<ScheduleCandidate[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [eventMemberId, setEventMemberId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isActionPending, setIsActionPending] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTimeError, setEditTimeError] = useState("");
  const editTimeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCandidate = async () => {
      setIsLoaded(false);
      setLoadError("");
      setActionError("");

      const currentMemberId = getStoredEventMemberId(eventId);

      if (!currentMemberId) {
        if (isMounted) {
          setLoadError(
            "イベント参加情報が見つかりません。参加リンクからもう一度開いてください。",
          );
          setIsLoaded(true);
        }
        return;
      }

      try {
        const detail = await getEventDetail(eventId, currentMemberId);
        const targetCandidate =
          detail.candidates.find((item) => item.id === candidateId) ?? null;

        if (!isMounted) {
          return;
        }

        setEventMemberId(currentMemberId);
        setEventDate(detail.event.date);
        setEventCandidates(detail.candidates);
        setCandidate(targetCandidate);

        const loadedComments = await listComments(eventId, candidateId, currentMemberId);
        if (isMounted) {
          setComments(loadedComments);
        }
        setIsLoaded(true);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadError(getApiErrorMessage(error, "予定候補を読み込めませんでした。"));
        setIsLoaded(true);
      }
    };

    void loadCandidate();

    return () => {
      isMounted = false;
    };
  }, [candidateId, eventId]);

  const handleCommentSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!eventMemberId || !comment.trim() || isCommentSubmitting) return;
    setIsCommentSubmitting(true);
    try {
      const newComment = await postComment(eventId, candidateId, eventMemberId, comment.trim());
      setComments((prev) => [...prev, newComment]);
      setComment("");
    } catch (error) {
      setActionError(getApiErrorMessage(error, "コメントの投稿に失敗しました。"));
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!eventMemberId) {
      return;
    }

    setIsActionPending(true);
    setActionError("");

    try {
      await confirmScheduleCandidate({
        eventId,
        candidateId,
        currentMemberId: eventMemberId,
      });
      router.push(`/events/${eventId}`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "予定を確定できませんでした。"));
    } finally {
      setIsActionPending(false);
    }
  };

  const handleCancelConfirmation = async () => {
    if (!eventMemberId) {
      return;
    }

    setIsActionPending(true);
    setActionError("");

    try {
      await cancelScheduleCandidateConfirmation({
        eventId,
        candidateId,
        currentMemberId: eventMemberId,
      });
      router.push(`/events/${eventId}`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "予定を取り消せませんでした。"));
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDelete = async () => {
    if (!eventMemberId) {
      return;
    }

    setIsActionPending(true);
    setActionError("");

    try {
      await deleteScheduleCandidate({
        eventId,
        candidateId,
        currentMemberId: eventMemberId,
      });
      router.push(`/events/${eventId}`);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "予定候補を削除できませんでした。"));
    } finally {
      setIsActionPending(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!eventMemberId || candidate?.status !== "pending") return;
    const target = comments.find((c) => c.id === commentId);
    if (!target) return;
    try {
      const fn = target.likedByMe ? unlikeComment : likeComment;
      const result = await fn(commentId, eventMemberId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likedByMe: result.likedByMe, likeCount: result.likeCount }
            : c,
        ),
      );
    } catch {
      // いいね失敗はサイレント
    }
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

  const handleEditSubmit = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    if (!candidate || !eventMemberId) {
      return;
    }

    const hasSameTime = eventCandidates.some(
      (item) => item.id !== candidateId && item.time === editTime,
    );

    if (hasSameTime) {
      setEditTimeError("同じ時間の予定がすでにあります");
      return;
    }

    const startAt = buildCandidateStartAt(eventDate, editTime);

    if (!startAt) {
      setEditTimeError("イベントの日付または時間が不正です");
      return;
    }

    setIsActionPending(true);
    setActionError("");

    try {
      const updatedCandidate = await updateScheduleCandidate({
        eventId,
        candidateId,
        currentMemberId: eventMemberId,
        candidate: {
          title: editTitle,
          startAt,
          endAt: candidate.endAt ?? null,
          location:
            candidate.locationDetail?.name === editLocation
              ? candidate.locationDetail
              : {
                  name: editLocation,
                  address: null,
                  googlePlaceId: null,
                  latitude: null,
                  longitude: null,
                  googleMapsUrl: null,
                },
          description: candidate.description ?? null,
        },
      });

      setCandidate(updatedCandidate);
      setEventCandidates((currentCandidates) =>
        currentCandidates.map((item) =>
          item.id === candidateId ? updatedCandidate : item,
        ),
      );
      setIsEditing(false);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "予定候補を更新できませんでした。"));
    } finally {
      setIsActionPending(false);
    }
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

  if (loadError) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <p>{loadError}</p>
        <Link
          href={`/events/${eventId}`}
          className="text-primary underline underline-offset-4"
        >
          イベントへ戻る
        </Link>
      </main>
    );
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

        {candidate.status === "pending" && (
          <div className="mt-5 flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isActionPending}
              className="rounded-[10px] bg-primary px-4 py-2 text-sm text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              予定確定
            </button>
            <button
              type="button"
              onClick={openEditor}
              disabled={isActionPending}
              className="rounded-[10px] bg-primary px-5 py-2 text-sm text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              編集
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteConfirmOpen(true)}
              disabled={isActionPending}
              className="rounded-[10px] bg-danger px-5 py-2 text-sm text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-60"
            >
              削除
            </button>
          </div>
        )}
        {actionError && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {actionError}
          </p>
        )}
      </section>

      <section aria-label="コメント一覧" className="mt-8 space-y-4">
        {comments.map((item) => (
          <article key={item.id}>
            <p className="mb-1 text-[11px]">{item.authorMember.displayName}</p>
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

              {candidate.status === "pending" ? (
                <button
                  type="button"
                  aria-label={`${item.authorMember.displayName}のコメントにいいね`}
                  aria-pressed={item.likedByMe}
                  onClick={() => toggleCommentLike(item.id)}
                  className="flex flex-col items-center rounded-md pt-1 text-xs transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                >
                  <Heart
                    aria-hidden="true"
                    size={20}
                    strokeWidth={1.8}
                    className={
                      item.likedByMe
                        ? "like-pop fill-danger text-danger"
                        : "text-foreground transition-colors"
                    }
                  />
                  <span className={item.likedByMe ? "text-danger" : "text-foreground"}>
                    {item.likeCount}
                  </span>
                </button>
              ) : (
                <div className="flex flex-col items-center pt-1 text-xs">
                  <Heart
                    aria-hidden="true"
                    size={20}
                    strokeWidth={1.8}
                    className={item.likedByMe ? "fill-danger text-danger" : "text-foreground"}
                  />
                  <span className={item.likedByMe ? "text-danger" : "text-foreground"}>
                    {item.likeCount}
                  </span>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      {candidate.status === "confirmed" ? (
        <div className="mb-4 mt-auto flex justify-center pt-8">
          <button
            type="button"
            onClick={handleCancelConfirmation}
            disabled={isActionPending}
            className="rounded-[10px] bg-danger px-6 py-2.5 text-lg text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-60"
          >
            予定取消
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleCommentSubmit}
          className="mb-4 mt-auto flex gap-2 pt-8"
        >
          <label htmlFor="candidate-comment" className="sr-only">
            コメント
          </label>
          <input
            id="candidate-comment"
            value={comment}
            placeholder="テキスト入力"
            onChange={(changeEvent) => setComment(changeEvent.target.value)}
            className="min-w-0 flex-1 rounded-[12px] border-2 border-primary bg-white px-4 py-2 text-center text-sm text-foreground outline-none placeholder:text-foreground/55 focus:border-foreground"
          />
          <button
            type="submit"
            disabled={isCommentSubmitting || !comment.trim()}
            className="rounded-[10px] bg-primary px-3 py-2 text-sm text-white shadow-md transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            送信
          </button>
        </form>
      )}

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
                  disabled={isActionPending}
                  className="rounded-[10px] bg-primary px-7 py-2 text-xl text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  変更
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-7 py-10"
          role="presentation"
          onMouseDown={() => setIsDeleteConfirmOpen(false)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="candidate-delete-title"
            className="w-full max-w-sm rounded-[16px] border-2 border-primary bg-background px-5 py-10 shadow-xl"
            onMouseDown={(mouseEvent) => mouseEvent.stopPropagation()}
          >
            <h2
              id="candidate-delete-title"
              className="text-center text-xl text-foreground"
            >
              本当に消しますか？
            </h2>

            <div className="mt-6 flex items-center justify-center gap-7">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isActionPending}
                className="min-w-24 rounded-[10px] bg-danger px-5 py-2 text-lg text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-60"
              >
                消す
              </button>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="min-w-24 rounded-[10px] bg-primary px-4 py-2 text-lg text-white shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                消さない
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
