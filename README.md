# HangWat

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Hono, TypeScript, Prisma
- Database: PostgreSQL
- Package manager: pnpm workspace
- Local environment: Docker Compose

## Requirements

- Node.js 22
- pnpm 10
- Docker / Docker Compose

## Development Rules

開発ルール、Issue 管理、Git 運用、PR ルール、バックエンド設計方針は次を参照してください。

- [Development Guide](./docs/development/README.md)

## Environment Variables

環境変数サンプルは用途ごとに分けています。

| Name | Description | Default |
| --- | --- | --- |
| `POSTGRES_USER` | PostgreSQL user | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRES_DB` | PostgreSQL database name | `react_develop` |
| `DATABASE_URL` | Local backend database URL. Docker Compose backend uses `db:5432` internally. | `postgresql://postgres:postgres@localhost:5440/react_develop` |
| `BACKEND_PORT` | Backend port exposed by Docker Compose | `4000` |
| `FRONTEND_ORIGIN` | Origin allowed by backend CORS | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL | `http://localhost:4000` |

- `.env.example`: Docker Compose 用
- `backend/.env.example`: backend 単体起動 / backend デプロイ用
- `front/.env.example`: frontend 単体起動 / frontend デプロイ用

## Docker

Docker Compose で全サービスをまとめて起動する場合は、必要に応じて root の環境変数サンプルをコピーします。

```bash
cp .env.example .env
```

DB、バックエンド、フロントエンドをまとめて起動します。

```bash
docker compose up --build
```

ローカル Docker では backend 起動時に `prisma migrate deploy` を実行します。

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Backend health check: http://localhost:4000/health
- PostgreSQL: localhost:5440

backend と frontend のイメージを個別にビルドする場合も、build context は repository root にします。

```bash
docker build -f backend/Dockerfile -t hangwat-backend .
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000 -f front/Dockerfile -t hangwat-front .
```

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

backend と frontend の環境変数サンプルをコピーします。

```bash
cp backend/.env.example backend/.env
cp front/.env.example front/.env
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

## API Endpoints

- `GET /health`: backend と DB 接続の health check
- `GET /tasks`: task 一覧を取得
- `POST /tasks`: task を作成

## Verification

```bash
pnpm verify
```
