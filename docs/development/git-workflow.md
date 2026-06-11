# Git / ブランチ / コミットルール

Git の履歴は変更理由を追える状態に保ちます。
ブランチ、コミット、PR は Issue と紐づけて管理します。

## ブランチ命名

```txt
feature/<issue-number>-short-title
bugfix/<issue-number>-short-title
refactor/<issue-number>-short-title
docs/<issue-number>-short-title
chore/<issue-number>-short-title
design/<issue-number>-short-title
```

例:

```txt
feature/12-task-create-api
bugfix/24-health-check-db-error
docs/31-development-rules
```

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
