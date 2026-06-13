# Issue #48 コメントいいね API

GitHub Issue: https://github.com/Yuuuki16/HangWat/issues/48

### 実装範囲

- コメントにいいねする
- コメントのいいねを解除する

### 参照する API 設計

- `docs/api-design/01-api-details.md:1544` `PUT /api/comments/:commentId/like`
- `docs/api-design/01-api-details.md:1584` `DELETE /api/comments/:commentId/like`
- `docs/api-design/03-screen-requirements.md:78` コメント画面
- `docs/api-design/04-data-types.md:119` `Comment.likeCount / likedByMe`
- `docs/api-design/05-authorization-rules.md:37` コメントいいね / コメントいいね解除

### 完了条件

- [ ] API 実装
- [ ] イベント参加者認可
- [ ] 重複いいね・未いいね解除の扱い確認
- [ ] テスト
- [ ] API 設計との差分確認
- [ ] PR 作成
