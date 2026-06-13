# Issue #45 予定確定 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/45

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
