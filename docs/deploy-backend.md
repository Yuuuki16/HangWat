# Backend Deploy Guide

HangWat backend を Docker image として build し、Artifact Registry 経由で Cloud Run に deploy する手順です。

この手順の主目的は、Cloud SQL / Secret Manager / ngrok を使わずに、Cloud Run 上で backend container が起動し、API docs を表示できるところまで確認することです。DB を使う API の実動作確認は別途、Cloud Run から到達できる PostgreSQL を用意してから行います。

## 前提

- GCP Project ID: `hangwat-dev-1`
- Region: `asia-northeast1`
- Artifact Registry repository: `hangwat-backend`
- Cloud Run service: `hangwat-api`
- Docker image: `asia-northeast1-docker.pkg.dev/hangwat-dev-1/hangwat-backend/api:dev`
- backend Docker build context は repository root を使います。

有効化済み API:

- `artifactregistry.googleapis.com`
- `run.googleapis.com`
- `cloudbuild.googleapis.com`

Cloud Run は `PORT` を自動注入します。backend は `PORT` を優先して読み、container は `0.0.0.0` で listen します。

## Deploy Smoke Mode

DB なしで Cloud Run の起動確認だけを行う場合は、次の環境変数を使います。

- `SKIP_MIGRATE=true`: container 起動時の `prisma migrate deploy` をスキップします。
- `DEPLOY_SMOKE_MODE=true`: DB / Google Maps / auth などの service 初期化を避け、`/`, `/docs`, `/openapi.json` だけを公開します。

この mode では `/health` は使いません。`/health` は DB 接続確認用の endpoint です。

## ローカル Docker 確認

backend image を build します。

```bash
docker build -f backend/Dockerfile -t hangwat-backend:local .
```

smoke mode で backend container を起動します。

```bash
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e SKIP_MIGRATE=true \
  -e DEPLOY_SMOKE_MODE=true \
  -e FRONTEND_ORIGIN=http://localhost:3000 \
  hangwat-backend:local
```

別ターミナルで確認します。

```bash
curl http://localhost:8080/
curl http://localhost:8080/openapi.json
```

Swagger UI:

```text
http://localhost:8080/docs
```

期待値:

- `/` が `mode: "deploy-smoke"` を含む JSON を返す
- `/openapi.json` が JSON を返す
- `/docs` が表示される

## Artifact Registry へ push

Apple Silicon Mac から Cloud Run 用 image を push する場合は、`linux/amd64` を明示します。

```bash
IMAGE=asia-northeast1-docker.pkg.dev/hangwat-dev-1/hangwat-backend/api:dev

docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  -f backend/Dockerfile \
  -t "$IMAGE" \
  --push .
```

image を確認します。

```bash
docker buildx imagetools inspect "$IMAGE"
```

## Cloud Run deploy

smoke mode で deploy します。

```bash
IMAGE=asia-northeast1-docker.pkg.dev/hangwat-dev-1/hangwat-backend/api:dev

gcloud run deploy hangwat-api \
  --image="$IMAGE" \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=production,FRONTEND_ORIGIN=http://localhost:3000,SKIP_MIGRATE=true,DEPLOY_SMOKE_MODE=true \
  --port=8080
```

deploy 後、Cloud Run URL を確認します。

```bash
API_URL=$(gcloud run services describe hangwat-api \
  --region=asia-northeast1 \
  --format='value(status.url)')

echo "$API_URL"
```

## デプロイ後確認

```bash
curl "$API_URL/"
curl "$API_URL/openapi.json"
```

Swagger UI:

```text
<cloud-run-url>/docs
```

## DB ありで動かす場合

通常 mode では次の値が必要です。

- `DATABASE_URL`
- `SESSION_SECRET`
- `GOOGLE_MAPS_API_KEY`
- `FRONTEND_ORIGIN`

また、`SKIP_MIGRATE` と `DEPLOY_SMOKE_MODE` は `false` または未指定にします。

Cloud Run から `localhost:5440` のローカル Docker PostgreSQL へは接続できません。DB を使う API まで確認する場合は、Cloud Run から到達可能な PostgreSQL を別途用意してください。

## トラブルシュート

- `Container failed to start and listen on PORT=8080` の場合は、Cloud Run logs を確認します。
- `Prisma P1001` が出る場合は、DB 接続先に到達できていません。smoke mode では `SKIP_MIGRATE=true` と `DEPLOY_SMOKE_MODE=true` を指定してください。
- `/health` が失敗する場合は DB 接続が必要です。smoke mode の確認では `/`, `/docs`, `/openapi.json` を使ってください。
- CORS で frontend から呼べない場合は、`FRONTEND_ORIGIN` が実際の frontend origin と一致しているか確認します。
