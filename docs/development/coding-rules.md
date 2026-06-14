# コーディングルール

このドキュメントは HangWat 全体の実装ルールを定義します。
既存コードと矛盾する場合は、段階的にこのルールへ寄せます。

## 命名規則

- ディレクトリ名: lower-case
- ファイル名: camelCase
- 変数名: camelCase
- 関数名: camelCase
- クラス名: PascalCase
- 型名: PascalCase
- interface 名: PascalCase
- 環境変数: UPPER_SNAKE_CASE

例:

```txt
taskService.ts
taskRepository.ts
PrismaTaskRepository
TaskRepository
DATABASE_URL
```

## 責任分離

- route は HTTP の入出力に集中する。
- service はユースケースに集中する。
- repository は永続化の抽象化に集中する。
- Prisma の具体処理は infrastructure に閉じ込める。
- frontend と backend の型共有は、必要になった時点で明示的に設計する。

## Validation

- 外部入力は presentation 層で検証する。
- application 層は検証済みの DTO を受け取る。
- domain 層に守るべき不変条件がある場合は domain 側でも検証する。

## Error Handling

- 想定できる業務エラーは application 層で明示的に扱う。
- HTTP status code への変換は presentation 層で行う。
- 詳細な内部エラーをそのまま response に返さない。

## 環境変数

- 環境変数は起動時に読み込む。
- 必須環境変数が不足している状態で起動しない。
- `.env.example` を更新し、必要な変数を共有する。

## Import

- 相対 import が深くなりすぎる場合は tsconfig の path alias 導入を検討する。
- domain から presentation、application、infrastructure を import しない。
- 循環参照を作らない。

## テスト方針

- domain のロジックは単体テストを優先する。
- application service は repository を差し替えてテストする。
- API は主要な正常系と異常系を確認する。
- 不具合修正では、再発を防ぐテストを追加する。
