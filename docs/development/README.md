# Development Guide

このディレクトリは HangWat の開発ルールと設計方針を管理します。

## ドキュメント一覧

- [Issue 管理](./issue-management.md)
- [Git / ブランチ / コミットルール](./git-workflow.md)
- [Pull Request ルール](./pull-request.md)
- [バックエンドアーキテクチャ](./backend-architecture.md)
- [コーディングルール](./coding-rules.md)

## 基本方針

- 仕様、実装、レビューの判断基準を Issue と PR に残す。
- 変更は小さく分け、レビューしやすい単位で Pull Request を作る。
- バックエンドは責任分離を優先し、HTTP、ユースケース、ドメイン、DB 実装を混ぜない。
- 迷ったルールはこのディレクトリに追記し、暗黙知にしない。
