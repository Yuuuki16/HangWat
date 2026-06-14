"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { EventDetail } from "@/features/events/components/eventDetail";
import { getEventDetail } from "@/features/events/data/eventDetailApi";
import {
  getEventMembers,
  getMyEventMember,
} from "@/features/events/data/eventMemberApi";
import type { Event } from "@/features/events/types/event";
import type { EventMember } from "@/features/events/types/eventMember";
import type { ScheduleCandidate } from "@/features/events/types/scheduleCandidate";
import {
  getStoredEventMemberId,
  saveEventMemberId,
} from "@/features/events/utils/eventMemberStorage";
import { ApiError } from "@/lib/apiClient";

type LoadState =
  | { status: "loading" }
  | { status: "missing-member" }
  | { status: "error"; message: string }
  | {
      status: "success";
      event: Event;
      candidates: ScheduleCandidate[];
      eventMemberId: string;
      members: EventMember[];
      myMember: EventMember;
    };

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "ログイン情報を確認できませんでした。もう一度参加リンクから開いてください。";
    }

    if (error.status === 403) {
      return "このイベントを見る権限がありません。参加情報を確認してください。";
    }

    if (error.status === 404) {
      return "イベントが見つかりませんでした。";
    }
  }

  return "イベント情報を読み込めませんでした。時間をおいて再度お試しください。";
};

export default function EventTimelinePage() {
  const params = useParams<{ eventid: string }>();
  const eventId = params.eventid;
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;

    const loadEventDetail = async () => {
      setLoadState({ status: "loading" });

      const eventMemberId = getStoredEventMemberId(eventId);

      if (!eventMemberId) {
        if (!isMounted) {
          return;
        }

        setLoadState({ status: "missing-member" });
        return;
      }

      try {
        const [{ event, candidates }, members, myMember] = await Promise.all([
          getEventDetail(eventId, eventMemberId),
          getEventMembers(eventId, eventMemberId),
          getMyEventMember(eventId, eventMemberId),
        ]);

        if (!isMounted) {
          return;
        }

        saveEventMemberId(eventId, myMember.id);
        setLoadState({
          status: "success",
          event,
          candidates,
          eventMemberId: myMember.id,
          members,
          myMember,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setLoadState({ status: "error", message: getErrorMessage(error) });
      }
    };

    void loadEventDetail();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  if (loadState.status === "loading") {
    return <MessageScreen message="イベント情報を読み込んでいます..." />;
  }

  if (loadState.status === "missing-member") {
    return (
      <MessageScreen message="イベント参加情報が見つかりません。参加リンクからもう一度開いてください。" />
    );
  }

  if (loadState.status === "error") {
    return <MessageScreen message={loadState.message} />;
  }

  return (
    <EventDetail
      initialEvent={loadState.event}
      initialCandidates={loadState.candidates}
      initialMembers={loadState.members}
      myMember={loadState.myMember}
      eventMemberId={loadState.eventMemberId}
    />
  );
}

function MessageScreen({ message }: { message: string }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 text-center">
      <p className="max-w-sm text-base leading-7">{message}</p>
    </main>
  );
}
