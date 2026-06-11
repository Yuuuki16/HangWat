# バックエンドアーキテクチャ

バックエンドは Hono、TypeScript、Prisma を使います。
HTTP 処理、ユースケース、ドメイン、DB 実装を分離し、変更の影響範囲を小さくします。

## レイヤー

```txt
presentation -> application -> domain
                         -> infrastructure
```

## ディレクトリ構成

```txt
backend/src/
  index.ts
  app.ts
  presentation/
    routes/
    schemas/
  application/
    services/
    dto/
  domain/
    entities/
    repositories/
  infrastructure/
    prisma/
```

## presentation

HTTP の入口です。

責任:

- routing
- request body、query、path parameter の受け取り
- 入力 validation
- HTTP response への変換
- Hono 固有の処理

禁止:

- Prisma Client を直接呼ぶ
- 複雑な業務ロジックを書く
- DB schema に依存した処理を増やす

## application

ユースケースを表現します。

責任:

- 画面や API の操作単位に対応する処理
- repository の呼び出し
- トランザクション境界の管理
- DTO と domain object の変換

禁止:

- Hono の `Context` に依存する
- Prisma の具体実装に依存する

## domain

業務ルールを表現します。

責任:

- entity
- value object
- repository interface
- ドメインルール

禁止:

- Hono、Prisma、環境変数、外部 API に依存する
- HTTP status code を扱う

## infrastructure

外部システムとの接続を担当します。

責任:

- Prisma Client の生成
- repository interface の実装
- DB access
- 外部 API client

禁止:

- HTTP request / response を扱う
- presentation 層に依存する

## 依存ルール

- `presentation` は `application` を呼ぶ。
- `application` は `domain` の型と interface を使う。
- `infrastructure` は `domain` の repository interface を実装する。
- `domain` は他レイヤーに依存しない。

## Task API の分割例

```txt
presentation/routes/taskRoutes.ts
  -> application/services/taskService.ts
    -> domain/repositories/taskRepository.ts
      <- infrastructure/prisma/prismaTaskRepository.ts
```
