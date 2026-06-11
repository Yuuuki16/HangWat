# HangWat

develop作成差分用にコメント

## Development Rules

開発ルール、Issue 管理、Git 運用、PR ルール、バックエンド設計方針は次を参照してください。

- [Development Guide](./docs/development/README.md)

## Docker

初回は必要に応じて環境変数サンプルをコピーします。

```bash
cp .env.example .env
```

DB、バックエンド、フロントエンドをまとめて起動します。

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Backend health check: http://localhost:4000/health
- PostgreSQL: localhost:5440

停止します。

```bash
docker compose down
```

DB ボリュームも消す場合のみ次を実行します。

```bash
docker compose down -v
```

## Local Development

依存関係を入れます。

```bash
pnpm install
```

DB だけ Docker で起動します。

```bash
docker compose up -d db
```

Prisma Client を生成し、migration を適用します。

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

バックエンドを起動します。

```bash
pnpm dev:backend
```

別ターミナルでフロントエンドを起動します。

```bash
pnpm dev:front
```
