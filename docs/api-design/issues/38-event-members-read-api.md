# Issue #38 イベント参加者参照 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/38

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
