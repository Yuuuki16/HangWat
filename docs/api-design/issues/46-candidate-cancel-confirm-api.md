# Issue #46 予定取消 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/46

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
