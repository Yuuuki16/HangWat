# Development Guide

このディレクトリは HangWat の開発ルールと設計方針を管理します。

## ドキュメント一覧

- [API 設計ドキュメント](./api-design.md)
- [Git / ブランチ / コミットルール](./git-workflow.md)
- [Pull Request ルール](./pull-request.md)
- [バックエンドアーキテクチャ](./backend-architecture.md)
- [フロントエンドアーキテクチャ](./frontendArchitecture.md)
- [コーディングルール](./coding-rules.md)

## 基本方針

- API の仕様、データ型、認可ルールは API 設計ドキュメントを一次参照にする。
- 仕様、実装、レビューの判断基準を PR と関連ドキュメントに残す。
- 変更は小さく分け、レビューしやすい単位で Pull Request を作る。
- バックエンドは責任分離を優先し、HTTP、ユースケース、ドメイン、DB 実装を混ぜない。
- フロントエンドはルーティング、共通 UI、機能、データ接続の責任を分離する。
- 迷ったルールはこのディレクトリに追記し、暗黙知にしない。
