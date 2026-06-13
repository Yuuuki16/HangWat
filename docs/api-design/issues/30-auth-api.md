# Issue #30 Auth API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/30

### 実装範囲

- ユーザー登録
- ログイン
- ログアウト
- ログイン中ユーザー取得

### 参照する API 設計

- `docs/api-design/01-api-details.md:7` 認証・認可の表記
- `docs/api-design/01-api-details.md:19` `POST /api/auth/register`
- `docs/api-design/01-api-details.md:60` `POST /api/auth/login`
- `docs/api-design/01-api-details.md:100` `POST /api/auth/logout`
- `docs/api-design/01-api-details.md:129` `GET /api/me`
- `docs/api-design/03-screen-requirements.md:17` ログイン画面
- `docs/api-design/03-screen-requirements.md:29` 新規登録画面
- `docs/api-design/04-data-types.md:7` `User`
- `docs/api-design/05-authorization-rules.md:11` ユーザー登録 / ログイン / ログアウト / ログイン中ユーザー取得

### 完了条件

- [ ] API 実装
- [ ] バリデーション
- [ ] 認証・セッション処理
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成
