# Git / ブランチ / コミットルール

Git の履歴は変更理由を追える状態に保ちます。
ブランチ、コミット、PR は変更目的が分かる単位で管理します。

## ブランチ命名

```txt
feature/<short-title>
bugfix/<short-title>
refactor/<short-title>
docs/<short-title>
chore/<short-title>
design/<short-title>
test/<short-title>
build/<short-title>
```

例:

```txt
feature/task-create-api
bugfix/health-check-db-error
docs/development-rules
test/task-service
build/docker-image
```

`short-title` は英小文字、数字、ハイフンで簡潔に書きます。
作業内容が伝わる名前にし、管理番号や内部識別子を前提にしません。

## 作業ブランチ

- 実装やファイル編集を行う前に、作業内容に対応する作業ブランチにいることを確認する。
- `main`、`develop`、または目的が異なるブランチにいる場合は、実装やファイル編集の前に新規ブランチを作成する。
- 既に目的に対応する作業ブランチにいる場合は、現在の差分が同じ目的に沿っていることを確認してから継続してよい。
- 未コミット差分の由来や目的が不明な場合は、ブランチ作成や実装の前に確認する。
- 既存ブランチで別目的の実装を続けず、変更目的ごとにブランチを分ける。
- ドキュメント確認や調査だけでコード変更しない場合は、新規ブランチ作成を必須にしない。
- ブランチ作成前に現在のブランチと未コミット差分を確認する。
- Pull Request はブランチ命名規則に合う作業ブランチから作成する。
- `develop` から `main` への統合 Pull Request だけは例外として許可する。

## コミットメッセージ

Conventional Commits をベースにします。
`type` は英語の規定値を使い、`summary` は日本語で変更内容を簡潔に書きます。

```txt
<type>: <summary>
```

使用する type:

- `feat`: 機能追加
- `fix`: 不具合修正
- `refactor`: 振る舞いを変えない内部改善
- `docs`: ドキュメント
- `test`: テスト追加、修正
- `chore`: 設定、依存関係、生成物更新
- `build`: ビルド、Docker、CI 関連

例:

```txt
feat: タスク作成 API を追加
fix: 空のタスクタイトルを検証
refactor: タスクリポジトリを分割
docs: PR ルールを追加
```

## コミット粒度

- 1 コミットは 1 つの意図にまとめる。
- フォーマット修正とロジック変更は分ける。
- 生成物や lockfile の更新は、必要な変更と同じ PR に含めてよい。
- レビューしづらい巨大コミットは避ける。

## main ブランチ

- `main` へ直接 push しない。
- 変更は Pull Request 経由で取り込む。
- `main` はいつでも起動、ビルドできる状態を保つ。
