# Issue #32 イベント作成 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/32

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
