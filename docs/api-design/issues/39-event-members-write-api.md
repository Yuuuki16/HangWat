# Issue #39 イベント参加者更新 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/39

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
