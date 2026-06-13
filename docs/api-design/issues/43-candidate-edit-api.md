# Issue #43 予定候補編集 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/43

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
