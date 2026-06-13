# Issue #41 Google Places API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/41

### 実装範囲

- Google Places 候補取得
- Google Place 詳細取得

### 参照する API 設計

- `docs/api-design/01-api-details.md:1017` `GET /api/events/:eventId/locations/google-place-autocomplete`
- `docs/api-design/01-api-details.md:1067` `GET /api/events/:eventId/locations/google-place-details`
- `docs/api-design/03-screen-requirements.md:149` 場所入力コンポーネント
- `docs/api-design/04-data-types.md:52` `Location`
- `docs/api-design/05-authorization-rules.md:40` Google Places 候補取得 / Google Place 詳細取得

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] Google API エラー処理
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成
