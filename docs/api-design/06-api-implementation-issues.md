# API実装 Issue 要件

このドキュメントは、API 実装を Usecase 単位で分担するために作成した GitHub Issue の要件スナップショットです。

GitHub Issue を進捗管理の正とし、このファイルはレビュー時に API 設計ドキュメント上の参照箇所と実装範囲を一覧できるように管理します。

## 運用ルール

- 実装進捗、担当変更、関連 PR は GitHub Issue 側を更新する。
- API 仕様、Request / Response、認可条件に差分が出る場合は、該当する `docs/api-design/` の設計ドキュメントも同じ PR で更新する。
- このファイルは Issue 作成時点の要件を保存する目的で使い、進捗表としては使わない。

## Issue 一覧

| Issue | Usecase | 担当 | 関連ブランチ |
| --- | --- | --- | --- |
| [#30](https://github.com/Yuuuki16/HangWat/issues/30) | Auth API | `@Yuuuki16` | TBD |
| [#31](https://github.com/Yuuuki16/HangWat/issues/31) | イベント一覧 API | TBD | TBD |
| [#32](https://github.com/Yuuuki16/HangWat/issues/32) | イベント作成 API | TBD | TBD |
| [#33](https://github.com/Yuuuki16/HangWat/issues/33) | イベント詳細 API | `@hasseeee` | `feature/event-detail-api` |
| [#34](https://github.com/Yuuuki16/HangWat/issues/34) | イベント編集 API | TBD | TBD |
| [#35](https://github.com/Yuuuki16/HangWat/issues/35) | イベント削除 API | TBD | TBD |
| [#36](https://github.com/Yuuuki16/HangWat/issues/36) | 招待 URL 管理 API | TBD | TBD |
| [#37](https://github.com/Yuuuki16/HangWat/issues/37) | 招待 URL 参加 API | TBD | TBD |
| [#38](https://github.com/Yuuuki16/HangWat/issues/38) | イベント参加者参照 API | TBD | TBD |
| [#39](https://github.com/Yuuuki16/HangWat/issues/39) | イベント参加者更新 API | TBD | TBD |
| [#40](https://github.com/Yuuuki16/HangWat/issues/40) | Google Maps URL 解析 API | TBD | TBD |
| [#41](https://github.com/Yuuuki16/HangWat/issues/41) | Google Places API | TBD | TBD |
| [#42](https://github.com/Yuuuki16/HangWat/issues/42) | 予定候補作成 API | TBD | TBD |
| [#43](https://github.com/Yuuuki16/HangWat/issues/43) | 予定候補編集 API | TBD | TBD |
| [#44](https://github.com/Yuuuki16/HangWat/issues/44) | 予定候補削除 API | TBD | TBD |
| [#45](https://github.com/Yuuuki16/HangWat/issues/45) | 予定確定 API | TBD | TBD |
| [#46](https://github.com/Yuuuki16/HangWat/issues/46) | 予定取消 API | TBD | TBD |
| [#47](https://github.com/Yuuuki16/HangWat/issues/47) | コメント API | `@kosuke` | TBD |
| [#48](https://github.com/Yuuuki16/HangWat/issues/48) | コメントいいね API | `@kosuke` | TBD |

## #30 Auth API

### 実装範囲

- ユーザー登録
- ログイン
- ログアウト
- ログイン中ユーザー取得

### 参照する API 設計

- `docs/api-design/01-api-details.md:7` 認証・認可の表記
- `docs/api-design/01-api-details.md:19` `POST /api/auth/register`
- `docs/api-design/01-api-details.md:60` `POST /api/auth/login`
- `docs/api-design/01-api-details.md:100` `POST /api/auth/logout`
- `docs/api-design/01-api-details.md:129` `GET /api/me`
- `docs/api-design/03-screen-requirements.md:17` ログイン画面
- `docs/api-design/03-screen-requirements.md:29` 新規登録画面
- `docs/api-design/04-data-types.md:7` `User`
- `docs/api-design/05-authorization-rules.md:11` ユーザー登録 / ログイン / ログアウト / ログイン中ユーザー取得

### 完了条件

- [ ] API 実装
- [ ] バリデーション
- [ ] 認証・セッション処理
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #31 イベント一覧 API

### 実装範囲

- ログイン中ユーザーが参加しているイベント一覧取得

### 参照する API 設計

- `docs/api-design/01-api-details.md:163` `GET /api/events`
- `docs/api-design/03-screen-requirements.md:41` ホーム / イベント一覧画面
- `docs/api-design/04-data-types.md:84` `EventListItem`
- `docs/api-design/05-authorization-rules.md:16` イベント一覧取得

### 完了条件

- [ ] API 実装
- [ ] 認証チェック
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #32 イベント作成 API

### 実装範囲

- イベント作成
- 作成者を owner の EventMember として登録

### 参照する API 設計

- `docs/api-design/01-api-details.md:208` `POST /api/events`
- `docs/api-design/03-screen-requirements.md:54` イベント作成画面
- `docs/api-design/04-data-types.md:65` `Event`
- `docs/api-design/04-data-types.md:18` `EventMember`
- `docs/api-design/04-data-types.md:52` `Location`
- `docs/api-design/05-authorization-rules.md:15` イベント作成

### 完了条件

- [ ] API 実装
- [ ] バリデーション
- [ ] owner メンバー登録
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #33 イベント詳細 API

### 実装範囲

- イベント詳細取得
- 予定候補一覧、参加者、自分のイベント内メンバー情報を含むレスポンス

### 参照する API 設計

- `docs/api-design/01-api-details.md:277` `GET /api/events/:eventId`
- `docs/api-design/03-screen-requirements.md:67` タイムライン画面
- `docs/api-design/04-data-types.md:65` `Event`
- `docs/api-design/04-data-types.md:99` `ScheduleCandidate`
- `docs/api-design/04-data-types.md:18` `EventMember`
- `docs/api-design/05-authorization-rules.md:17` イベント詳細取得

### 関連ブランチ

- `feature/event-detail-api`

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #34 イベント編集 API

### 実装範囲

- イベント基本情報の更新

### 参照する API 設計

- `docs/api-design/01-api-details.md:386` `PATCH /api/events/:eventId`
- `docs/api-design/03-screen-requirements.md:92` 編集画面
- `docs/api-design/04-data-types.md:65` `Event`
- `docs/api-design/04-data-types.md:52` `Location`
- `docs/api-design/05-authorization-rules.md:18` イベント編集

### 完了条件

- [ ] API 実装
- [ ] owner 認可
- [ ] バリデーション
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #35 イベント削除 API

### 実装範囲

- イベント削除

### 参照する API 設計

- `docs/api-design/01-api-details.md:452` `DELETE /api/events/:eventId`
- `docs/api-design/03-screen-requirements.md:103` 削除確認モーダル
- `docs/api-design/05-authorization-rules.md:19` イベント削除

### 完了条件

- [ ] API 実装
- [ ] owner 認可
- [ ] 関連データの扱い確認
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #36 招待 URL 管理 API

### 実装範囲

- 招待 URL 発行
- 招待 URL 無効化

### 参照する API 設計

- `docs/api-design/01-api-details.md:489` `POST /api/events/:eventId/invite-tokens`
- `docs/api-design/01-api-details.md:538` `DELETE /api/events/:eventId/invite-tokens/:tokenId`
- `docs/api-design/03-screen-requirements.md:67` タイムライン画面
- `docs/api-design/04-data-types.md:144` `EventInviteToken`
- `docs/api-design/05-authorization-rules.md:20` 招待 URL 発行 / 無効化

### 完了条件

- [ ] API 実装
- [ ] owner 認可
- [ ] トークン生成・無効化処理
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #37 招待 URL 参加 API

### 実装範囲

- 招待 URL からのイベント概要取得
- URL 参加者の名前登録
- ローカルトークンによる再参加

### 参照する API 設計

- `docs/api-design/01-api-details.md:576` `GET /api/invite-tokens/:inviteToken`
- `docs/api-design/01-api-details.md:627` `POST /api/invite-tokens/:inviteToken/join`
- `docs/api-design/01-api-details.md:683` `POST /api/invite-tokens/:inviteToken/rejoin`
- `docs/api-design/03-screen-requirements.md:136` 招待参加画面
- `docs/api-design/04-data-types.md:18` `EventMember`
- `docs/api-design/04-data-types.md:158` `MemberSession`
- `docs/api-design/05-authorization-rules.md:22` 招待 URL からのイベント概要取得 / URL 参加 / ローカルトークン再参加

### 完了条件

- [ ] API 実装
- [ ] 招待トークン検証
- [ ] EventMember 登録
- [ ] MemberSession 発行・検証
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #38 イベント参加者参照 API

### 実装範囲

- イベント参加者一覧取得
- 自分のイベント内メンバー情報取得

### 参照する API 設計

- `docs/api-design/01-api-details.md:731` `GET /api/events/:eventId/members`
- `docs/api-design/01-api-details.md:791` `GET /api/events/:eventId/me/member`
- `docs/api-design/03-screen-requirements.md:67` タイムライン画面
- `docs/api-design/04-data-types.md:18` `EventMember`
- `docs/api-design/05-authorization-rules.md:25` 参加者一覧取得 / 自分のイベント内メンバー情報取得

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #39 イベント参加者更新 API

### 実装範囲

- イベント参加者の表示名変更
- 参加者削除 / 退出

### 参照する API 設計

- `docs/api-design/01-api-details.md:835` `PATCH /api/events/:eventId/members/:memberId`
- `docs/api-design/01-api-details.md:887` `DELETE /api/events/:eventId/members/:memberId`
- `docs/api-design/04-data-types.md:18` `EventMember`
- `docs/api-design/05-authorization-rules.md:27` 参加者表示名変更 / 参加者削除・退出

### 完了条件

- [ ] API 実装
- [ ] 本人または owner 認可
- [ ] owner 削除可否などの制約確認
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #40 Google Maps URL 解析 API

### 実装範囲

- ログインユーザー向け Google Maps URL 解析
- イベント参加者向け Google Maps URL 解析

### 参照する API 設計

- `docs/api-design/01-api-details.md:926` `POST /api/locations/resolve-google-maps-url`
- `docs/api-design/01-api-details.md:968` `POST /api/events/:eventId/locations/resolve-google-maps-url`
- `docs/api-design/03-screen-requirements.md:54` イベント作成画面
- `docs/api-design/03-screen-requirements.md:149` 場所入力コンポーネント
- `docs/api-design/04-data-types.md:52` `Location`
- `docs/api-design/05-authorization-rules.md:39` Google Maps URL 解析

### 完了条件

- [ ] API 実装
- [ ] 認証・イベント参加者認可
- [ ] Google Maps URL の入力検証
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #41 Google Places API

### 実装範囲

- Google Places 候補取得
- Google Place 詳細取得

### 参照する API 設計

- `docs/api-design/01-api-details.md:1017` `GET /api/events/:eventId/locations/google-place-autocomplete`
- `docs/api-design/01-api-details.md:1067` `GET /api/events/:eventId/locations/google-place-details`
- `docs/api-design/03-screen-requirements.md:149` 場所入力コンポーネント
- `docs/api-design/04-data-types.md:52` `Location`
- `docs/api-design/05-authorization-rules.md:40` Google Places 候補取得 / Google Place 詳細取得

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] Google API エラー処理
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #42 予定候補作成 API

### 実装範囲

- イベントに予定候補を追加する

### 参照する API 設計

- `docs/api-design/01-api-details.md:1118` `POST /api/events/:eventId/candidates`
- `docs/api-design/03-screen-requirements.md:67` タイムライン画面
- `docs/api-design/04-data-types.md:99` `ScheduleCandidate`
- `docs/api-design/04-data-types.md:134` `CandidateStatus`
- `docs/api-design/05-authorization-rules.md:29` 予定候補作成

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] バリデーション
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #43 予定候補編集 API

### 実装範囲

- 予定候補を更新する

### 参照する API 設計

- `docs/api-design/01-api-details.md:1196` `PATCH /api/events/:eventId/candidates/:candidateId`
- `docs/api-design/03-screen-requirements.md:92` 編集画面
- `docs/api-design/04-data-types.md:99` `ScheduleCandidate`
- `docs/api-design/05-authorization-rules.md:30` 予定候補編集

### 完了条件

- [ ] API 実装
- [ ] 本人または owner 認可
- [ ] バリデーション
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #44 予定候補削除 API

### 実装範囲

- 予定候補を削除する

### 参照する API 設計

- `docs/api-design/01-api-details.md:1267` `DELETE /api/events/:eventId/candidates/:candidateId`
- `docs/api-design/03-screen-requirements.md:103` 削除確認モーダル
- `docs/api-design/04-data-types.md:99` `ScheduleCandidate`
- `docs/api-design/05-authorization-rules.md:31` 予定候補削除

### 完了条件

- [ ] API 実装
- [ ] 本人または owner 認可
- [ ] 確定済み候補の削除制約
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #45 予定確定 API

### 実装範囲

- 予定候補を確定する

### 参照する API 設計

- `docs/api-design/01-api-details.md:1306` `POST /api/events/:eventId/candidates/:candidateId/confirm`
- `docs/api-design/03-screen-requirements.md:114` 予定確定確認モーダル
- `docs/api-design/04-data-types.md:99` `ScheduleCandidate`
- `docs/api-design/04-data-types.md:134` `CandidateStatus`
- `docs/api-design/05-authorization-rules.md:32` 予定確定

### 完了条件

- [ ] API 実装
- [ ] owner 認可
- [ ] 他候補との競合制御
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #46 予定取消 API

### 実装範囲

- 確定済みの予定候補を未確定に戻す

### 参照する API 設計

- `docs/api-design/01-api-details.md:1352` `POST /api/events/:eventId/candidates/:candidateId/cancel-confirm`
- `docs/api-design/03-screen-requirements.md:125` 予定取消確認モーダル
- `docs/api-design/04-data-types.md:99` `ScheduleCandidate`
- `docs/api-design/04-data-types.md:134` `CandidateStatus`
- `docs/api-design/05-authorization-rules.md:33` 予定取消

### 完了条件

- [ ] API 実装
- [ ] owner 認可
- [ ] 未確定に戻す状態遷移
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #47 コメント API

### 実装範囲

- コメント一覧取得
- コメント投稿
- コメント削除

### 参照する API 設計

- `docs/api-design/01-api-details.md:1398` `GET /api/events/:eventId/candidates/:candidateId/comments`
- `docs/api-design/01-api-details.md:1451` `POST /api/events/:eventId/candidates/:candidateId/comments`
- `docs/api-design/01-api-details.md:1507` `DELETE /api/comments/:commentId`
- `docs/api-design/03-screen-requirements.md:78` コメント画面
- `docs/api-design/04-data-types.md:119` `Comment`
- `docs/api-design/05-authorization-rules.md:34` コメント一覧取得 / コメント投稿 / コメント削除

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] 削除時の本人または owner 認可
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成

## #48 コメントいいね API

### 実装範囲

- コメントにいいねする
- コメントのいいねを解除する

### 参照する API 設計

- `docs/api-design/01-api-details.md:1544` `PUT /api/comments/:commentId/like`
- `docs/api-design/01-api-details.md:1584` `DELETE /api/comments/:commentId/like`
- `docs/api-design/03-screen-requirements.md:78` コメント画面
- `docs/api-design/04-data-types.md:119` `Comment.likeCount / likedByMe`
- `docs/api-design/05-authorization-rules.md:37` コメントいいね / コメントいいね解除

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] 重複いいね・未いいね解除の扱い確認
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成
