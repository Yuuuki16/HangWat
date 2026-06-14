# コメントリアルタイム更新 WebSocket 実装ドキュメント

## 目的

コメント機能に WebSocket を追加し、同じ予定候補のコメント画面を開いている参加者へ、コメント投稿・削除・いいね更新をリアルタイム反映する。

ただし、コメントの作成・削除・いいね更新そのものは既存の REST API で行う。
WebSocket は DB 更新を直接行わず、更新結果を他クライアントへ通知するために使用する。

---

## 採用方針

### 採用する方式

```txt
REST API:
- コメント投稿
- コメント削除
- コメントいいね
- コメントいいね解除

WebSocket:
- コメント作成通知
- コメント削除通知
- コメントいいね数更新通知
```

### 採用する技術

```txt
Backend:
Hono + @hono/node-ws + ws

Frontend:
Next.js + browser標準 WebSocket
```

### 追加パッケージ

backend に追加する。

```bash
pnpm --filter backend add @hono/node-ws ws
pnpm --filter backend add -D @types/ws
```

---

## 実装対象

### 対象画面

コメント画面。

### 対象API

既存REST APIはそのまま使う。

```txt
GET    /api/events/:eventId/candidates/:candidateId/comments
POST   /api/events/:eventId/candidates/:candidateId/comments
DELETE /api/comments/:commentId
PUT    /api/comments/:commentId/like
DELETE /api/comments/:commentId/like
```

新しく WebSocket endpoint を追加する。

```txt
WS /ws/events/:eventId/candidates/:candidateId
```

---

## WebSocket endpoint 仕様

## WS /ws/events/:eventId/candidates/:candidateId

| 項目   | 内容                     |
| ---- | ---------------------- |
| 概要   | 予定候補コメントのリアルタイム更新を購読する |
| 使用画面 | コメント画面                 |
| 認証   | イベント参加者                |
| 接続単位 | candidateId            |
| 主な用途 | コメント投稿・削除・いいね更新の即時反映   |

### Path Params

| Field       | Type   | 説明     |
| ----------- | ------ | ------ |
| eventId     | string | イベントID |
| candidateId | string | 予定候補ID |

### 認証

WebSocket接続時に、対象イベントのイベント参加者であることを確認する。

対象は以下のどちらか。

```txt
- ログインユーザー
- URL参加者
```

URL参加者は `users` には作成せず、`event_members` に作成される。
そのため、WebSocketでも `user_id` ではなく `event_member_id` / `event_members` を基準に認可する。

認証情報の渡し方は、まずは以下のどちらかにする。

```txt
案A: Cookieのログインセッションを使う
案B: query params で memberSessionToken を渡す
```

MVPでは実装しやすさを優先して、以下を許容する。

```txt
/ws/events/:eventId/candidates/:candidateId?memberSessionToken=xxx
```

ただし、ログに token が残る可能性があるため、本番運用では Cookie または Authorization header 相当の方式を検討する。

---

## WebSocketイベント型

## CommentRealtimeEvent

| Field       | Type         | 説明        |
| ----------- | ------------ | --------- |
| type        | string       | イベント種別    |
| eventId     | string       | イベントID    |
| candidateId | string       | 予定候補ID    |
| comment     | Comment/null | 作成されたコメント |
| commentId   | string/null  | 対象コメントID  |
| likeCount   | number/null  | 更新後のいいね数  |

### イベント種別

```ts
type CommentRealtimeEvent =
  | {
      type: 'comment.created'
      eventId: string
      candidateId: string
      comment: Comment
    }
  | {
      type: 'comment.deleted'
      eventId: string
      candidateId: string
      commentId: string
    }
  | {
      type: 'comment.like.updated'
      eventId: string
      candidateId: string
      commentId: string
      likeCount: number
    }
```

### 注意点

`likedByMe` はユーザーごとに値が変わるため、全員向け WebSocket イベントには含めない。

いいね更新時は、全員に `likeCount` のみ配信する。
いいねを押した本人の `likedByMe` は、REST API のレスポンス、またはフロント側の状態更新で反映する。

---

## 配信ルール

### 接続ルーム

予定候補単位で接続を管理する。

```txt
candidate:{candidateId}
```

例：

```txt
candidate:candidate_001
```

同じ `candidateId` のコメント画面を開いているクライアントだけに配信する。

### 配信タイミング

| REST API                                                   | DB更新後に配信するイベント       |
| ---------------------------------------------------------- | -------------------- |
| POST /api/events/:eventId/candidates/:candidateId/comments | comment.created      |
| DELETE /api/comments/:commentId                            | comment.deleted      |
| PUT /api/comments/:commentId/like                          | comment.like.updated |
| DELETE /api/comments/:commentId/like                       | comment.like.updated |

### 配信しないケース

以下の場合は WebSocket 配信しない。

```txt
- バリデーションエラー
- 認証エラー
- 認可エラー
- DB保存に失敗した場合
- 対象コメントが存在しない場合
```

DB更新が成功した後にのみ配信する。

---

## Backend 実装方針

## 配置先

既存の backend は以下のレイヤー構成に従う。

```txt
presentation -> application -> domain
                         -> infrastructure
```

WebSocketもこの責務分離に合わせる。

### 追加・変更予定ファイル

```txt
HangWat/backend/src/app.ts
HangWat/backend/src/presentation/routes/commentRealtimeRoutes.ts
HangWat/backend/src/application/services/commentRealtimeService.ts
HangWat/backend/src/domain/repositories/commentRealtimeConnectionRepository.ts
HangWat/backend/src/infrastructure/realtime/inMemoryCommentRealtimeConnectionRepository.ts
HangWat/backend/src/domain/entities/commentRealtimeEvent.ts
```

必要に応じて、既存のコメント系ファイルも変更する。

```txt
HangWat/backend/src/presentation/routes/commentRoutes.ts
HangWat/backend/src/application/services/commentService.ts
HangWat/backend/src/application/dto/commentDto.ts
```

---

## Backend 実装詳細

## 1. WebSocket接続管理Repositoryを作る

### domain/repositories/commentRealtimeConnectionRepository.ts

```ts
import type { CommentRealtimeEvent } from '../entities/commentRealtimeEvent'

export interface CommentRealtimeConnectionRepository {
  addConnection(candidateId: string, connection: WebSocket): void
  removeConnection(candidateId: string, connection: WebSocket): void
  broadcastToCandidate(candidateId: string, event: CommentRealtimeEvent): void
}
```

---

## 2. WebSocketイベント型を作る

### domain/entities/commentRealtimeEvent.ts

```ts
export type CommentRealtimeEvent =
  | {
      type: 'comment.created'
      eventId: string
      candidateId: string
      comment: unknown
    }
  | {
      type: 'comment.deleted'
      eventId: string
      candidateId: string
      commentId: string
    }
  | {
      type: 'comment.like.updated'
      eventId: string
      candidateId: string
      commentId: string
      likeCount: number
    }
```

`comment` は最初 `unknown` でもよいが、Comment DTO が確定している場合は `CommentDto` にする。

---

## 3. in-memory実装を作る

### infrastructure/realtime/inMemoryCommentRealtimeConnectionRepository.ts

```ts
import type { CommentRealtimeEvent } from '../../domain/entities/commentRealtimeEvent'
import type { CommentRealtimeConnectionRepository } from '../../domain/repositories/commentRealtimeConnectionRepository'

export class InMemoryCommentRealtimeConnectionRepository
  implements CommentRealtimeConnectionRepository
{
  private readonly connectionsByCandidateId = new Map<string, Set<WebSocket>>()

  addConnection(candidateId: string, connection: WebSocket): void {
    const connections = this.connectionsByCandidateId.get(candidateId) ?? new Set<WebSocket>()
    connections.add(connection)
    this.connectionsByCandidateId.set(candidateId, connections)
  }

  removeConnection(candidateId: string, connection: WebSocket): void {
    const connections = this.connectionsByCandidateId.get(candidateId)

    if (!connections) {
      return
    }

    connections.delete(connection)

    if (connections.size === 0) {
      this.connectionsByCandidateId.delete(candidateId)
    }
  }

  broadcastToCandidate(candidateId: string, event: CommentRealtimeEvent): void {
    const connections = this.connectionsByCandidateId.get(candidateId)

    if (!connections) {
      return
    }

    const message = JSON.stringify(event)

    for (const connection of connections) {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(message)
      }
    }
  }
}
```

MVPでは in-memory でよい。
ただし backend を複数台に増やす場合は、Redis Pub/Sub などに置き換える。

---

## 4. CommentRealtimeService を作る

### application/services/commentRealtimeService.ts

```ts
import type { CommentRealtimeEvent } from '../../domain/entities/commentRealtimeEvent'
import type { CommentRealtimeConnectionRepository } from '../../domain/repositories/commentRealtimeConnectionRepository'

export class CommentRealtimeService {
  constructor(
    private readonly connectionRepository: CommentRealtimeConnectionRepository,
  ) {}

  subscribe(candidateId: string, connection: WebSocket): void {
    this.connectionRepository.addConnection(candidateId, connection)
  }

  unsubscribe(candidateId: string, connection: WebSocket): void {
    this.connectionRepository.removeConnection(candidateId, connection)
  }

  publish(candidateId: string, event: CommentRealtimeEvent): void {
    this.connectionRepository.broadcastToCandidate(candidateId, event)
  }
}
```

---

## 5. WebSocket route を作る

### presentation/routes/commentRealtimeRoutes.ts

```ts
import { Hono } from 'hono'
import type { CommentRealtimeService } from '../../application/services/commentRealtimeService'

type Dependencies = {
  commentRealtimeService: CommentRealtimeService
}

export const createCommentRealtimeRoutes = ({
  commentRealtimeService,
}: Dependencies) => {
  const route = new Hono()

  route.get(
    '/ws/events/:eventId/candidates/:candidateId',
    // app.ts 側で upgradeWebSocket を注入する実装に合わせて調整する
  )

  return route
}
```

実際の `upgradeWebSocket` の使い方は、`@hono/node-ws` の導入方式に合わせて実装する。

接続時に行うこと。

```txt
1. eventId / candidateId を path params から取得
2. ログインセッションまたは memberSessionToken を検証
3. event_members に対象イベントの参加者として存在するか確認
4. candidate が eventId に属しているか確認
5. 接続を candidateId に紐づけて保存
6. close 時に接続を削除
```

---

## 6. app.ts に WebSocket route を登録する

### app.ts

既存の Hono app 作成処理に、以下を追加する。

```txt
- CommentRealtimeConnectionRepository のインスタンス作成
- CommentRealtimeService のインスタンス作成
- commentRealtimeRoutes の登録
- @hono/node-ws の injectWebSocket 設定
```

---

## 7. コメント投稿後に配信する

### commentService.ts

コメント投稿処理の流れを以下にする。

```txt
1. 入力値を検証する
2. eventId / candidateId の存在確認
3. eventMember 認可
4. comments に保存
5. Comment DTO に変換
6. comment.created を publish
7. REST API response を返す
```

配信イベント例。

```ts
commentRealtimeService.publish(candidateId, {
  type: 'comment.created',
  eventId,
  candidateId,
  comment,
})
```

---

## 8. コメント削除後に配信する

コメント削除処理の流れを以下にする。

```txt
1. commentId から comment / candidate / event を取得
2. 本人または owner か確認
3. comment を削除
4. comment.deleted を publish
5. REST API response を返す
```

配信イベント例。

```ts
commentRealtimeService.publish(candidateId, {
  type: 'comment.deleted',
  eventId,
  candidateId,
  commentId,
})
```

---

## 9. いいね更新後に配信する

いいね追加・解除処理の流れを以下にする。

```txt
1. commentId から comment / candidate / event を取得
2. eventMember 認可
3. comment_likes を追加または削除
4. 更新後の likeCount を取得
5. comment.like.updated を publish
6. REST API response を返す
```

配信イベント例。

```ts
commentRealtimeService.publish(candidateId, {
  type: 'comment.like.updated',
  eventId,
  candidateId,
  commentId,
  likeCount,
})
```

---

## Frontend 実装方針

## 配置先

```txt
HangWat/front/features/comments/
HangWat/front/hooks/
HangWat/front/lib/
```

候補。

```txt
HangWat/front/features/comments/types/commentRealtimeEvent.ts
HangWat/front/features/comments/hooks/useCommentRealtime.ts
HangWat/front/features/comments/services/commentApi.ts
```

---

## Frontend 実装詳細

## 1. WebSocketイベント型を作る

### features/comments/types/commentRealtimeEvent.ts

```ts
import type { Comment } from './comment'

export type CommentRealtimeEvent =
  | {
      type: 'comment.created'
      eventId: string
      candidateId: string
      comment: Comment
    }
  | {
      type: 'comment.deleted'
      eventId: string
      candidateId: string
      commentId: string
    }
  | {
      type: 'comment.like.updated'
      eventId: string
      candidateId: string
      commentId: string
      likeCount: number
    }
```

---

## 2. useCommentRealtime hook を作る

### features/comments/hooks/useCommentRealtime.ts

```ts
import { useEffect } from 'react'
import type { CommentRealtimeEvent } from '../types/commentRealtimeEvent'

type Params = {
  eventId: string
  candidateId: string
  enabled: boolean
  onEvent: (event: CommentRealtimeEvent) => void
}

export function useCommentRealtime({
  eventId,
  candidateId,
  enabled,
  onEvent,
}: Params) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const wsBaseUrl =
      process.env.NEXT_PUBLIC_WS_BASE_URL ?? 'ws://localhost:4000'

    const socket = new WebSocket(
      `${wsBaseUrl}/ws/events/${eventId}/candidates/${candidateId}`,
    )

    socket.addEventListener('message', (message) => {
      const event = JSON.parse(message.data) as CommentRealtimeEvent
      onEvent(event)
    })

    socket.addEventListener('error', () => {
      // MVPでは画面を壊さず、RESTの再取得で復旧できるようにする
    })

    return () => {
      socket.close()
    }
  }, [eventId, candidateId, enabled, onEvent])
}
```

URL参加者の `memberSessionToken` を query params で渡す場合は、URL生成時に追加する。

```ts
const socketUrl = `${wsBaseUrl}/ws/events/${eventId}/candidates/${candidateId}?memberSessionToken=${encodeURIComponent(token)}`
```

---

## 3. コメント画面で購読する

コメント画面では以下を行う。

```txt
1. 初回表示時に REST API でコメント一覧を取得する
2. WebSocket に接続する
3. comment.created を受け取ったら一覧に追加する
4. comment.deleted を受け取ったら一覧から削除する
5. comment.like.updated を受け取ったら likeCount を更新する
```

状態更新例。

```ts
function handleRealtimeEvent(event: CommentRealtimeEvent) {
  if (event.type === 'comment.created') {
    setComments((current) => {
      if (current.some((comment) => comment.id === event.comment.id)) {
        return current
      }

      return [...current, event.comment]
    })
  }

  if (event.type === 'comment.deleted') {
    setComments((current) =>
      current.filter((comment) => comment.id !== event.commentId),
    )
  }

  if (event.type === 'comment.like.updated') {
    setComments((current) =>
      current.map((comment) =>
        comment.id === event.commentId
          ? { ...comment, likeCount: event.likeCount }
          : comment,
      ),
    )
  }
}
```

---

## ドキュメント編集内容

## 1. 02-required-api-list.md に追記

追記場所は、REST API 一覧の後。
`Realtime API` として REST API とは分ける。

```md
## Realtime API

| Method | Path | 説明 | 使用画面 | 認証 |
| --- | --- | --- | --- | --- |
| WS | /ws/events/:eventId/candidates/:candidateId | 予定候補コメントのリアルタイム更新を購読する | コメント画面 | イベント参加者 |
```

API分類にも追加する。

```md
| Realtime API | /ws/events/:eventId/candidates/:candidateId |
```

---

## 2. 03-screen-requirements.md に追記

コメント画面の `必要なAPI` に WebSocket を追加する。

```md
WS /ws/events/:eventId/candidates/:candidateId
```

コメント画面の `操作` に以下を追加する。

```md
他参加者のコメント投稿・削除・いいね更新をリアルタイムに受信する
```

コメント画面の `必要なデータ` に以下を追加する。

```md
リアルタイムイベント種別、更新対象コメントID、更新後のいいね数
```

---

## 3. 04-data-types.md に追記

`Comment` の後、または `ErrorResponse` の前に追加する。

```md
## CommentRealtimeEvent

| Field | Type | 説明 |
| --- | --- | --- |
| type | CommentRealtimeEventType | リアルタイムイベント種別 |
| eventId | string | イベントID |
| candidateId | string | 予定候補ID |
| comment | Comment/null | 作成されたコメント。comment.created の場合のみ |
| commentId | string/null | 対象コメントID。comment.deleted / comment.like.updated の場合に使用 |
| likeCount | number/null | 更新後のいいね数。comment.like.updated の場合のみ |

## CommentRealtimeEventType

| Value | 説明 |
| --- | --- |
| comment.created | コメントが作成された |
| comment.deleted | コメントが削除された |
| comment.like.updated | コメントのいいね数が更新された |
```

補足も追加する。

```md
likedByMe はユーザーごとに異なるため、WebSocketで全員へ配信するイベントには含めない。
いいねを押した本人の likedByMe は REST API のレスポンス、またはフロント側の状態更新で反映する。
```

---

## 4. 01-api-details.md に追記

コメントAPI群の近くに追加する。

````md
### **WS /ws/events/:eventId/candidates/:candidateId**

| 項目 | 内容 |
| --- | --- |
| 概要 | 予定候補コメントのリアルタイム更新を購読する |
| 使用画面 | コメント画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| candidateId | string | 予定候補ID |

Client Receive Event

```json
{
  "type": "comment.created",
  "eventId": "event_001",
  "candidateId": "candidate_001",
  "comment": {
    "id": "comment_003",
    "candidateId": "candidate_001",
    "body": "この店よさそう",
    "authorMember": {
      "id": "member_010",
      "displayName": "たくや",
      "memberType": "guest"
    },
    "likeCount": 0,
    "likedByMe": false,
    "createdAt": "2026-07-31T10:10:00+09:00",
    "updatedAt": "2026-07-31T10:10:00+09:00"
  }
}
````

```json
{
  "type": "comment.deleted",
  "eventId": "event_001",
  "candidateId": "candidate_001",
  "commentId": "comment_003"
}
```

```json
{
  "type": "comment.like.updated",
  "eventId": "event_001",
  "candidateId": "candidate_001",
  "commentId": "comment_001",
  "likeCount": 4
}
```

Error

| Code                  | 説明                   |
| --------------------- | -------------------- |
| UNAUTHORIZED          | 未ログイン、またはローカルトークンが不正 |
| FORBIDDEN             | イベント参加者ではない          |
| NOT_FOUND             | イベントまたは予定候補が存在しない    |
| INTERNAL_SERVER_ERROR | サーバーエラー              |

````

---

## 5. 05-authorization-rules.md に追記

認可ルール一覧に追加する。

```md
| コメントリアルタイム購読 | イベント参加者 |
````

MVP方針に追加する。

```md
| コメントリアルタイム購読 | イベント参加者なら可能 |
```

補足として追加する。

```md
WebSocket 接続時も REST API と同じくイベント参加者であることを確認する。
URL参加者は users ではなく event_members を基準に認可する。
```

---

## 実装順

## Phase 1: ドキュメント更新

```txt
1. 02-required-api-list.md に Realtime API を追加
2. 03-screen-requirements.md のコメント画面に WS を追加
3. 04-data-types.md に CommentRealtimeEvent を追加
4. 01-api-details.md に WS endpoint 詳細を追加
5. 05-authorization-rules.md にコメントリアルタイム購読の認可を追加
```

---

## Phase 2: Backend 最小実装

```txt
1. backend に @hono/node-ws / ws を追加
2. CommentRealtimeEvent 型を作成
3. InMemoryCommentRealtimeConnectionRepository を作成
4. CommentRealtimeService を作成
5. WS /ws/events/:eventId/candidates/:candidateId を追加
6. 接続時に eventId / candidateId の存在確認を行う
7. 接続時にイベント参加者か確認する
8. close 時に接続を削除する
```

最初の動作確認では、接続成功時に以下のような確認用イベントを返してもよい。

```json
{
  "type": "connected",
  "eventId": "event_001",
  "candidateId": "candidate_001"
}
```

ただし、本番仕様の `CommentRealtimeEvent` には含めなくてよい。

---

## Phase 3: Backend REST API との連携

```txt
1. コメント投稿成功後に comment.created を配信
2. コメント削除成功後に comment.deleted を配信
3. いいね追加成功後に comment.like.updated を配信
4. いいね解除成功後に comment.like.updated を配信
```

---

## Phase 4: Frontend 実装

```txt
1. CommentRealtimeEvent 型を作成
2. useCommentRealtime hook を作成
3. コメント画面で WebSocket 接続
4. comment.created 受信時にコメント一覧へ追加
5. comment.deleted 受信時にコメント一覧から削除
6. comment.like.updated 受信時に likeCount を更新
7. WebSocket切断時も画面が壊れないようにする
```

---

## Phase 5: テスト

## Backend テスト観点

```txt
- イベント参加者であれば WS 接続できる
- イベント参加者でなければ WS 接続できない
- 存在しない eventId では接続できない
- 存在しない candidateId では接続できない
- candidateId が eventId に属していない場合は接続できない
- コメント投稿成功後に comment.created が配信される
- コメント削除成功後に comment.deleted が配信される
- いいね追加後に comment.like.updated が配信される
- いいね解除後に comment.like.updated が配信される
```

## Frontend テスト観点

```txt
- コメント画面表示時に WS 接続する
- 画面離脱時に WS 接続を閉じる
- comment.created でコメントが追加される
- 同じ comment.id が来ても重複追加しない
- comment.deleted でコメントが消える
- comment.like.updated で likeCount が更新される
- WS 接続失敗時もコメント一覧は REST API の結果で表示できる
```

---

## MVPでやらないこと

```txt
- WebSocket経由でコメント投稿する
- Redis Pub/Sub 対応
- 複数backendインスタンス間の同期
- typing表示
- オンラインユーザー表示
- 既読管理
- 通知一覧
- 再送保証
```

MVPでは DB を正とし、WebSocket は即時反映用として扱う。
接続が切れていた場合は、画面再表示または REST API 再取得で最新状態に戻す。

---

## 完了条件

```txt
- ドキュメントに Realtime API の仕様が追記されている
- backend に WebSocket endpoint が追加されている
- コメント画面で WebSocket 接続できる
- コメント投稿が他クライアントへ即時反映される
- コメント削除が他クライアントへ即時反映される
- いいね数更新が他クライアントへ即時反映される
- 既存REST APIのレスポンス形式を壊していない
- pnpm verify が通る
```
