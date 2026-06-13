# Issue #44 予定候補削除 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/44

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
