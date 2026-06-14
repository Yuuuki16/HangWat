# Issue #33 イベント詳細 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/33

### 実装範囲

- イベント詳細取得
- 予定候補一覧、参加者、自分のイベント内メンバー情報を含むレスポンス

### 参照する API 設計

- `docs/api-design/01-api-details.md:277` `GET /api/events/:eventId`
- `docs/api-design/03-screen-requirements.md:67` タイムライン画面
- `docs/api-design/04-data-types.md:65` `Event`
- `docs/api-design/04-data-types.md:99` `ScheduleCandidate`
- `docs/api-design/04-data-types.md:18` `EventMember`
- `docs/api-design/05-authorization-rules.md:17` イベント詳細取得

### 関連ブランチ

- `feature/event-detail-api`

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成
