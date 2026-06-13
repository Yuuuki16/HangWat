# API実装 Issue 要件一覧

このディレクトリは、API 実装を Usecase 単位で分担するために作成した GitHub Issue の要件スナップショットを管理します。

GitHub Issue を進捗管理の正とし、各 Issue の詳細は個別 Markdown に分け、レビュー時に API 設計ドキュメント上の参照箇所と実装範囲を確認できるようにします。

## 運用ルール

- 実装進捗、担当変更、関連 PR は GitHub Issue 側を更新する。
- API 仕様、Request / Response、認可条件に差分が出る場合は、該当する `docs/api-design/` の設計ドキュメントも同じ PR で更新する。
- 各 Issue ファイルは Issue 作成時点の要件を保存する目的で使い、進捗表としては使わない。

## Issue 一覧

| Issue | Usecase | 担当 | 関連ブランチ |
| --- | --- | --- | --- |
| [#30](./30-auth-api.md) | Auth API | `@Yuuuki16` | TBD |
| [#31](./31-event-list-api.md) | イベント一覧 API | TBD | TBD |
| [#32](./32-event-create-api.md) | イベント作成 API | TBD | TBD |
| [#33](./33-event-detail-api.md) | イベント詳細 API | `@hasseeee` | `feature/event-detail-api` |
| [#34](./34-event-edit-api.md) | イベント編集 API | TBD | TBD |
| [#35](./35-event-delete-api.md) | イベント削除 API | TBD | TBD |
| [#36](./36-invite-url-management-api.md) | 招待 URL 管理 API | TBD | TBD |
| [#37](./37-invite-url-join-api.md) | 招待 URL 参加 API | TBD | TBD |
| [#38](./38-event-members-read-api.md) | イベント参加者参照 API | TBD | TBD |
| [#39](./39-event-members-write-api.md) | イベント参加者更新 API | TBD | TBD |
| [#40](./40-google-maps-url-resolve-api.md) | Google Maps URL 解析 API | TBD | TBD |
| [#41](./41-google-places-api.md) | Google Places API | TBD | TBD |
| [#42](./42-candidate-create-api.md) | 予定候補作成 API | TBD | TBD |
| [#43](./43-candidate-edit-api.md) | 予定候補編集 API | TBD | TBD |
| [#44](./44-candidate-delete-api.md) | 予定候補削除 API | TBD | TBD |
| [#45](./45-candidate-confirm-api.md) | 予定確定 API | TBD | TBD |
| [#46](./46-candidate-cancel-confirm-api.md) | 予定取消 API | TBD | TBD |
| [#47](./47-comments-api.md) | コメント API | `@kosuke` | TBD |
| [#48](./48-comment-like-api.md) | コメントいいね API | `@kosuke` | TBD |

