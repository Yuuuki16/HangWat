#!/bin/bash
set -euo pipefail

# ============================================================
# Cloud Run デプロイ
# 使い方: scripts/deploy.sh [backend|front|all]
# 前提: gcloud auth login 済み、gcp-setup.sh 実行済み
# ============================================================

PROJECT_ID="hangwat"
REGION="asia-northeast1"
AR_REPO="hangwat"
DB_INSTANCE="hangwat-db"
IMAGE_BASE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}"

TARGET="${1:-all}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe "$DB_INSTANCE" \
  --project="$PROJECT_ID" \
  --format="value(connectionName)")

deploy_backend() {
  echo "=== backend ビルド & デプロイ ==="
  docker build \
    --platform linux/amd64 \
    -f "$REPO_ROOT/backend/Dockerfile" \
    -t "${IMAGE_BASE}/backend:latest" \
    "$REPO_ROOT"

  docker push "${IMAGE_BASE}/backend:latest"

  gcloud run deploy hangwat-backend \
    --image="${IMAGE_BASE}/backend:latest" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --port=4000 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --add-cloudsql-instances="$INSTANCE_CONNECTION_NAME" \
    --set-secrets="DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest" \
    --set-env-vars="NODE_ENV=production" \
    --project="$PROJECT_ID"

  BACKEND_URL=$(gcloud run services describe hangwat-backend \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)")
  echo "backend URL: $BACKEND_URL"
  echo "$BACKEND_URL" > "$REPO_ROOT/.backend-url"
}

deploy_front() {
  echo "=== front ビルド & デプロイ ==="

  BACKEND_URL=""
  if [ -f "$REPO_ROOT/.backend-url" ]; then
    BACKEND_URL=$(cat "$REPO_ROOT/.backend-url")
  fi
  if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL=$(gcloud run services describe hangwat-backend \
      --region="$REGION" \
      --project="$PROJECT_ID" \
      --format="value(status.url)" 2>/dev/null || echo "")
  fi
  if [ -z "$BACKEND_URL" ]; then
    echo "NEXT_PUBLIC_API_URL を指定: " && read -r BACKEND_URL
  fi

  docker build \
    --platform linux/amd64 \
    -f "$REPO_ROOT/front/Dockerfile" \
    --build-arg "NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
    -t "${IMAGE_BASE}/front:latest" \
    "$REPO_ROOT"

  docker push "${IMAGE_BASE}/front:latest"

  gcloud run deploy hangwat-front \
    --image="${IMAGE_BASE}/front:latest" \
    --region="$REGION" \
    --platform=managed \
    --allow-unauthenticated \
    --port=3000 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --set-env-vars="NEXT_PUBLIC_API_URL=${BACKEND_URL}" \
    --project="$PROJECT_ID"

  FRONT_URL=$(gcloud run services describe hangwat-front \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)")
  echo "front URL: $FRONT_URL"

  echo "=== FRONTEND_ORIGIN を backend に反映 ==="
  gcloud run services update hangwat-backend \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --update-env-vars="FRONTEND_ORIGIN=${FRONT_URL}"
}

case "$TARGET" in
  backend) deploy_backend ;;
  front)   deploy_front ;;
  all)     deploy_backend && deploy_front ;;
  *)
    echo "使い方: $0 [backend|front|all]"
    exit 1
    ;;
esac

echo "=== デプロイ完了 ==="
