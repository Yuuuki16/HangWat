# AGENTS.md

Codex はこのファイルを HangWat リポジトリでの作業ルールとして参照します。

## 基本方針

- 回答、説明、PR コメント案は日本語で書く。
- 作業前に現在のブランチと差分を確認する。
- 実装やファイル編集を行う前に、作業内容に対応する作業ブランチにいることを確認する。
- `main`、`develop`、または目的が異なるブランチにいる場合は、実装やファイル編集の前に新規ブランチを作成する。
- 既に目的に対応する作業ブランチにいる場合は、現在の差分が同じ目的に沿っていることを確認してから継続する。
- 未コミット差分の由来や目的が不明な場合は、ブランチ作成や実装の前にユーザーへ確認する。
- 既存コード、`README.md`、`docs/development/` を優先し、無関係なリファクタリングやフォーマット変更を混ぜない。
- ユーザーや他メンバーの未コミット変更を勝手に戻さない。

## 必ず参照するドキュメント

- 開発ルール全般: `docs/development/README.md`
- API 設計: `docs/development/api-design.md`
- コーディング規約: `docs/development/coding-rules.md`
- backend 設計: `docs/development/backend-architecture.md`
- Git / PR: `docs/development/git-workflow.md`, `docs/development/pull-request.md`

PR 作成を依頼された場合は、追加で次を確認してください。

- `.claude/skills/create-pr/SKILL.md`
- `.github/pull_request_template.md`

## よく使うコマンド

```bash
pnpm install
pnpm dev:backend
pnpm dev:front
pnpm build
pnpm lint
pnpm test
pnpm verify
```

## Git / PR

- ブランチ名、コミットメッセージ、PR本文は `docs/development/git-workflow.md` と `docs/development/pull-request.md` に従う。
- `git push` は `git push -u origin <branch>` または `git push origin <branch>` を使う。
- `--force` / `--force-with-lease` / `-f` は使わない。

## 実装時の注意

- backend は `presentation -> application -> domain` と `infrastructure` の責任分離を守る。
- 成果物に、不要なコメントアウトや説明用コメントを残さない。
- 環境変数を追加、変更した場合は該当する `.env.example` も更新する。
- 変更の種類に応じて、関連する `pnpm build`、`pnpm lint`、`pnpm test`、または `pnpm verify` を実行する。
