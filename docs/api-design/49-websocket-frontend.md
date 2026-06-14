# コメントリアルタイム更新 フロントエンド実装要件

## 概要

Backend の WebSocket endpoint（`WS /ws/events/:eventId/candidates/:candidateId`）を使い、コメント画面でコメントの投稿・削除・いいね更新をリアルタイムに反映する。

Backend 実装の詳細は [49-websocket.md](./49-websocket.md) を参照。

---

## 環境変数

`front/.env` に以下を追加する。

```
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:4000
```

デプロイ時は本番 backend の WebSocket URL に変更する。

---

## 接続仕様

### Endpoint

```
WS /ws/events/:eventId/candidates/:candidateId?memberId=<eventMemberId>
```

### Query Params

| Field    | Type   | 説明                            |
| -------- | ------ | ------------------------------- |
| memberId | string | 自分の event_member_id（数値文字列） |

`memberId` は既存 REST API の `x-event-member-id` ヘッダーと同じ値を使う。

---

## 受信イベント型

```ts
export type CommentAuthorMember = {
  id: string;
  displayName: string;
  memberType: "user" | "guest";
};

export type CommentForRealtime = {
  id: string;
  candidateId: string;
  body: string;
  authorMember: CommentAuthorMember;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CommentRealtimeEvent =
  | {
      type: "comment.created";
      eventId: string;
      candidateId: string;
      comment: CommentForRealtime;
    }
  | {
      type: "comment.deleted";
      eventId: string;
      candidateId: string;
      commentId: string;
    }
  | {
      type: "comment.like.updated";
      eventId: string;
      candidateId: string;
      commentId: string;
      likeCount: number;
    };
```

---

## 実装手順

### 1. 型ファイルを作成する

`front/features/events/types/commentRealtimeEvent.ts` に上記の型定義を作成する。

### 2. useCommentRealtime hook を作成する

`front/features/events/hooks/useCommentRealtime.ts` に以下の hook を実装する。

```ts
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
    if (!enabled) return;

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
```

### 3. コメント画面で購読する

コメント画面のコンポーネントで以下を行う。

```ts
function handleRealtimeEvent(event: CommentRealtimeEvent) {
  if (event.type === "comment.created") {
    setComments((current) => {
      if (current.some((c) => c.id === event.comment.id)) return current;
      return [...current, event.comment];
    });
  }

  if (event.type === "comment.deleted") {
    setComments((current) =>
      current.filter((c) => c.id !== event.commentId),
    );
  }

  if (event.type === "comment.like.updated") {
    setComments((current) =>
      current.map((c) =>
        c.id === event.commentId
          ? { ...c, likeCount: event.likeCount }
          : c,
      ),
    );
  }
}

useCommentRealtime({
  eventId,
  candidateId,
  memberId,      // 自分の event_member_id
  enabled: true,
  onEvent: handleRealtimeEvent,
});
```

---

## 注意点

- `likedByMe` はユーザーごとに異なるため、WebSocket イベントには含まれない。いいねを押した本人の `likedByMe` は REST API のレスポンスで反映する。
- WebSocket 接続が切れても画面を壊さない。REST API の再取得で最新状態に戻す。
- 同じ `comment.id` が来ても重複追加しない（上記の `some` チェック参照）。
- `comment.created` で受信した `likedByMe` は常に `false`（自分が投稿した場合も同様）。

---

## テスト観点

```
- コメント画面表示時に WS 接続する
- 画面離脱時に WS 接続を閉じる
- comment.created でコメントが一覧に追加される
- 同じ comment.id が来ても重複追加しない
- comment.deleted でコメントが一覧から削除される
- comment.like.updated で likeCount が更新される
- WS 接続失敗時もコメント一覧は REST API の結果で表示できる
```
