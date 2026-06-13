# Notion API設計ドキュメント

Notion から export された API 設計ドキュメントを整理したディレクトリです。
HangWat の API 実装と合わせてレビューできるように、`HangWat/docs/api-design/` で管理します。

## 参照する Markdown

通常はこちらの Markdown を参照してください。ZIP 内の文字化けした export パスは使わず、内容を取り出して読みやすいファイル名に付け直しています。

| ファイル | 内容 |
| --- | --- |
| [01-api-details.md](./01-api-details.md) | 各 API の概要、使用画面、認証、Request、Response、Error |
| [02-required-api-list.md](./02-required-api-list.md) | API 設計全体の目的、対象範囲、共通ルール、必要 API の洗い出し |
| [03-screen-requirements.md](./03-screen-requirements.md) | 画面ごとの表示内容、入力内容、操作、必要 API |
| [04-data-types.md](./04-data-types.md) | API で扱う主要データ型 |
| [05-authorization-rules.md](./05-authorization-rules.md) | MVP の認可ルールと MVP 後の検討事項 |
| [06-api-implementation-progress.md](./06-api-implementation-progress.md) | ユースケース単位の API 実装進捗管理 |

## 注意

Notion export の内側 ZIP には、日本語パスが壊れて macOS 上で通常展開できないものが含まれていました。
そのため、ZIP 内のファイル名は使わず、Markdown 本文だけを取り出して整理しています。
