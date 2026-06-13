# Issue #47 コメント API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/47

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
