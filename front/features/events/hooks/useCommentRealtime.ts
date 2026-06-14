"use client";

import { useEffect } from "react";

import type { CommentRealtimeEvent } from "../types/commentRealtimeEvent";

type Params = {
  eventId: string;
  candidateId: string;
  memberId: string;
  enabled: boolean;
  onEvent: (event: CommentRealtimeEvent) => void;
};

export function useCommentRealtime({
  eventId,
  candidateId,
  memberId,
  enabled,
  onEvent,
}: Params) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const wsBaseUrl =
      process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:4000";

    const url = `${wsBaseUrl}/ws/events/${eventId}/candidates/${candidateId}?memberId=${encodeURIComponent(memberId)}`;
    const socket = new WebSocket(url);

    socket.addEventListener("message", (message) => {
      const event = JSON.parse(message.data as string) as CommentRealtimeEvent;
      onEvent(event);
    });

    socket.addEventListener("error", () => {
      // MVPでは画面を壊さず、RESTの再取得で復旧できるようにする
    });

    return () => {
      socket.close();
    };
  }, [eventId, candidateId, memberId, enabled, onEvent]);
}
