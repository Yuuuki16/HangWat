# HangWat

develop作成差分用にコメント

## GCP デプロイ構成

- **Backend**: Cloud Run (`hangwat-backend`) — Hono.js + Prisma
- **Frontend**: Cloud Run (`hangwat-front`) — Next.js
- **Database**: Cloud SQL for PostgreSQL (`hangwat-db`)
- **Secrets**: Secret Manager（DATABASE_URL / SESSION_SECRET / GOOGLE_MAPS_API_KEY）

## 初回セットアップ（インフラ構築）

```bash
gcloud auth login
gcloud config set project hangwat

# Cloud SQL / Artifact Registry / Secret Manager を一括構築
./scripts/gcp-setup.sh
```

Secret Manager に API キーを登録:

```bash
printf 'YOUR_GOOGLE_MAPS_API_KEY' | gcloud secrets create GOOGLE_MAPS_API_KEY \
  --data-file=- --project=hangwat
```

Cloud Run のサービスアカウントに権限を付与:

```bash
SA="898027105416-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding hangwat \
  --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor"
gcloud projects add-iam-policy-binding hangwat \
  --member="serviceAccount:${SA}" --role="roles/cloudsql.client"
```

## デプロイ

```bash
# backend のみ
./scripts/deploy.sh backend

# frontend のみ
./scripts/deploy.sh front

# 両方まとめて
./scripts/deploy.sh all
```

> **注意**: `deploy.sh all` はまず backend をデプロイし、その URL を frontend の `NEXT_PUBLIC_API_URL` に自動的に埋め込んでからビルドします。

## フロントエンドとバックエンドの繋ぎ込み

### 概要

Next.js の frontend は **ビルド時** に `NEXT_PUBLIC_API_URL` を埋め込みます。
そのため、backend の URL が決まってから frontend をビルド・デプロイする必要があります。

### 手順

1. **backend をデプロイして URL を確認する**

   ```bash
   ./scripts/deploy.sh backend
   # 出力例: backend URL: https://hangwat-backend-xxxx-an.a.run.app
   ```

2. **frontend をデプロイする**

   `deploy.sh` が backend URL を自動取得して frontend をビルドします。

   ```bash
   ./scripts/deploy.sh front
   ```

3. **CORS 設定が自動で更新される**

   `deploy.sh front` 完了後、backend の `FRONTEND_ORIGIN` 環境変数が frontend の URL に自動更新されます。

### backend URL の変更が必要になった場合

backend を再デプロイしても URL は変わりません（Cloud Run は同じ URL を維持します）。
ただし、カスタムドメインを設定した場合などは frontend を再ビルド・再デプロイしてください:

```bash
./scripts/deploy.sh all
```

### 環境変数一覧

| 変数名 | 設定場所 | 説明 |
|--------|----------|------|
| `DATABASE_URL` | Secret Manager | Cloud SQL 接続文字列 |
| `SESSION_SECRET` | Secret Manager | セッション署名キー |
| `GOOGLE_MAPS_API_KEY` | Secret Manager | Google Maps API キー |
| `NEXT_PUBLIC_API_URL` | deploy.sh が自動設定 | backend の URL |
| `FRONTEND_ORIGIN` | deploy.sh が自動設定 | frontend の URL（CORS 許可用） |

## ローカル開発

```bash
pnpm install
pnpm dev:backend   # backend: http://localhost:4000
pnpm dev:front     # frontend: http://localhost:3000
```
