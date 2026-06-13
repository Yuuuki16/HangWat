# Issue #40 Google Maps URL 解析 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/40

### 実装範囲

- ログインユーザー向け Google Maps URL 解析
- イベント参加者向け Google Maps URL 解析

### 参照する API 設計

- `docs/api-design/01-api-details.md:926` `POST /api/locations/resolve-google-maps-url`
- `docs/api-design/01-api-details.md:968` `POST /api/events/:eventId/locations/resolve-google-maps-url`
- `docs/api-design/03-screen-requirements.md:54` イベント作成画面
- `docs/api-design/03-screen-requirements.md:149` 場所入力コンポーネント
- `docs/api-design/04-data-types.md:52` `Location`
- `docs/api-design/05-authorization-rules.md:39` Google Maps URL 解析

### 完了条件

- [ ] API 実装
- [ ] 認証・イベント参加者認可
- [ ] Google Maps URL の入力検証
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成
