"use client";

import {
  CalendarDays,
  ChevronDown,
  MapPin,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  getInviteEvent,
  joinInviteEvent,
  rejoinInviteEvent,
  type InviteEventPreview,
} from "@/features/events/services/inviteApi";
import {
  loadMemberSessionToken,
  removeMemberSessionToken,
  saveMemberSessionToken,
} from "@/features/events/utils/memberSessionStorage";
import { formatEventDate } from "@/features/events/utils/formatEventDate";

type InviteEventViewProps = {
  inviteToken: string;
};

type ViewStatus = "loading" | "ready" | "redirecting" | "error";

const invalidMemberSessionStatuses = new Set([401, 404, 410]);

function isInvalidMemberSessionStatus(status: number | undefined): boolean {
  return status !== undefined && invalidMemberSessionStatuses.has(status);
}

export function InviteEventView({ inviteToken }: InviteEventViewProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [preview, setPreview] = useState<InviteEventPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function initialize() {
      const storedToken = loadMemberSessionToken(inviteToken);

      if (storedToken) {
        const rejoinResult = await rejoinInviteEvent(inviteToken, storedToken);

        if (!isActive) {
          return;
        }

        if (rejoinResult.ok) {
          setStatus("redirecting");
          router.replace(`/events/${rejoinResult.data.eventMember.eventId}`);
          return;
        }

        if (isInvalidMemberSessionStatus(rejoinResult.status)) {
          removeMemberSessionToken(inviteToken);
        }
      }

      const previewResult = await getInviteEvent(inviteToken);

      if (!isActive) {
        return;
      }

      if (previewResult.ok) {
        setPreview(previewResult.data);
        setStatus("ready");
        return;
      }

      setErrorMessage(previewResult.message);
      setStatus("error");
    }

    void initialize();

    return () => {
      isActive = false;
    };
  }, [inviteToken, router]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleClose = () => {
      setDisplayName("");
      setJoinErrorMessage(null);
    };
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

  const handleJoin = async (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      nameInputRef.current?.focus();
      return;
    }

    if (isJoining) {
      return;
    }

    setJoinErrorMessage(null);
    setIsJoining(true);

    try {
      const result = await joinInviteEvent(inviteToken, trimmedName);

      if (!result.ok) {
        setJoinErrorMessage(result.message);
        return;
      }

      saveMemberSessionToken(inviteToken, result.data.memberSession.token);
      closeJoinDialog();
      router.push(`/events/${result.data.eventMember.eventId}`);
    } finally {
      setIsJoining(false);
    }
  };

  if (status === "loading" || status === "redirecting") {
    return (
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <p role="status" aria-live="polite" className="text-foreground">
          読み込み中...
        </p>
      </main>
    );
  }

  if (status === "error" || preview === null) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-16">
        <p role="alert" className="text-center text-foreground">
          {errorMessage ?? "イベント情報を取得できませんでした"}
        </p>
      </main>
    );
  }

  const event = preview.event;
  const formattedDate = event.date ? formatEventDate(event.date) : "日付未定";
  const locationName = event.location?.name ?? "場所未定";

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
            <dd className="truncate whitespace-nowrap">{formattedDate}</dd>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <dt className="shrink-0">
              <MapPin aria-label="開催場所" size={21} strokeWidth={2} />
            </dt>
            <dd title={locationName} className="truncate whitespace-nowrap">
              {locationName}
            </dd>
          </div>
        </dl>

        {event.description && (
          <>
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
                className="mt-2 whitespace-pre-line border-t border-foreground/20 px-2 pt-3 text-sm leading-6"
              >
                {event.description}
              </p>
            )}
          </>
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

          <h2 id="join-dialog-title" className="text-center text-lg text-primary">
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

          {joinErrorMessage && (
            <p
              role="alert"
              className="mt-4 whitespace-pre-line rounded-base border-2 border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {joinErrorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className="mx-auto mt-8 block w-32 rounded-xl bg-primary py-2 text-lg text-white shadow-md transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isJoining ? "参加中..." : "参加"}
          </button>
        </form>
      </dialog>
    </main>
  );
}
