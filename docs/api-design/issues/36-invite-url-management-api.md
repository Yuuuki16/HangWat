# Issue #36 招待 URL 管理 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/36

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
