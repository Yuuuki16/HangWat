# API 設計ドキュメント

API の仕様、画面との対応、データ型、認可ルールは `docs/api-design/` で管理します。
backend の実装や frontend の API 呼び出しを変更する前に、該当する設計ドキュメントを確認します。

## 参照先

次のディレクトリを API 設計の一次参照にします。

```txt
docs/api-design/
```

主なドキュメント:

- `README.md`: API 設計ドキュメントの一覧
- `01-api-details.md`: 各 API の概要、使用画面、認証、Request、Response、Error
- `02-required-api-list.md`: 必要 API の一覧、MVP 優先度
- `03-screen-requirements.md`: 画面ごとの表示内容、操作、必要 API
- `04-data-types.md`: API で扱う主要データ型
- `05-authorization-rules.md`: 操作ごとの認可ルール

## 運用ルール

- API を追加、変更、削除する場合は、実装前に該当する設計ドキュメントを確認する。
- 設計と実装に差分が出る場合は、実装と同じ PR で関連ドキュメントも更新する。
- API の Request、Response、Error、認可条件を変更する場合は `01-api-details.md` と `05-authorization-rules.md` を確認する。
- 画面都合で API の使い方を変える場合は `03-screen-requirements.md` を確認する。
- README の API Endpoints は概要に留め、詳細仕様は API 設計ドキュメントに寄せる。
