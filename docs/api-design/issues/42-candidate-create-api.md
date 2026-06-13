# Issue #42 予定候補作成 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/42

### 実装範囲

- イベントに予定候補を追加する

### 参照する API 設計

- `docs/api-design/01-api-details.md:1118` `POST /api/events/:eventId/candidates`
- `docs/api-design/03-screen-requirements.md:67` タイムライン画面
- `docs/api-design/04-data-types.md:99` `ScheduleCandidate`
- `docs/api-design/04-data-types.md:134` `CandidateStatus`
- `docs/api-design/05-authorization-rules.md:29` 予定候補作成

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] バリデーション
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成
