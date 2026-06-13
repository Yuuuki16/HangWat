# Issue #37 招待 URL 参加 API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/37

### 実装範囲

- 招待 URL からのイベント概要取得
- URL 参加者の名前登録
- ローカルトークンによる再参加

### 参照する API 設計

- `docs/api-design/01-api-details.md:576` `GET /api/invite-tokens/:inviteToken`
- `docs/api-design/01-api-details.md:627` `POST /api/invite-tokens/:inviteToken/join`
- `docs/api-design/01-api-details.md:683` `POST /api/invite-tokens/:inviteToken/rejoin`
- `docs/api-design/03-screen-requirements.md:136` 招待参加画面
- `docs/api-design/04-data-types.md:18` `EventMember`
- `docs/api-design/04-data-types.md:158` `MemberSession`
- `docs/api-design/05-authorization-rules.md:22` 招待 URL からのイベント概要取得 / URL 参加 / ローカルトークン再参加

### 完了条件

- [ ] API 実装
- [ ] 招待トークン検証
- [ ] EventMember 登録
- [ ] MemberSession 発行・検証
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成
