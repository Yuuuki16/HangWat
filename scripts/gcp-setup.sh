#!/bin/bash
set -euo pipefail

# ============================================================
# GCP 初期セットアップ（1回のみ実行）
# 実行前に gcloud auth login && gcloud config set project hangwat
# ============================================================

PROJECT_ID="hangwat"
REGION="asia-northeast1"
DB_INSTANCE="hangwat-db"
DB_NAME="hangwat"
DB_USER="hangwat"
AR_REPO="hangwat"

echo "=== API 有効化 ==="
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID"

echo "=== Artifact Registry 作成 ==="
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID" || echo "既存スキップ"

echo "=== Cloud SQL 作成（数分かかる） ==="
gcloud sql instances create "$DB_INSTANCE" \
  --database-version=POSTGRES_17 \
  --tier=db-f1-micro \
  --region="$REGION" \
  --project="$PROJECT_ID" || echo "既存スキップ"

echo "=== DB + ユーザー作成 ==="
DB_PASSWORD=$(openssl rand -hex 16)
gcloud sql databases create "$DB_NAME" \
  --instance="$DB_INSTANCE" \
  --project="$PROJECT_ID" || echo "既存スキップ"

gcloud sql users create "$DB_USER" \
  --instance="$DB_INSTANCE" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID" || echo "既存スキップ - パスワードは手動確認"

INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe "$DB_INSTANCE" \
  --project="$PROJECT_ID" \
  --format="value(connectionName)")

echo "Cloud SQL connection name: $INSTANCE_CONNECTION_NAME"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost/${DB_NAME}?host=/cloudsql/${INSTANCE_CONNECTION_NAME}"

echo "=== Secret Manager ==="
SESSION_SECRET=$(openssl rand -hex 32)

printf '%s' "$DATABASE_URL" | gcloud secrets create DATABASE_URL \
  --data-file=- \
  --project="$PROJECT_ID" || \
  printf '%s' "$DATABASE_URL" | gcloud secrets versions add DATABASE_URL \
    --data-file=- \
    --project="$PROJECT_ID"

printf '%s' "$SESSION_SECRET" | gcloud secrets create SESSION_SECRET \
  --data-file=- \
  --project="$PROJECT_ID" || \
  printf '%s' "$SESSION_SECRET" | gcloud secrets versions add SESSION_SECRET \
    --data-file=- \
    --project="$PROJECT_ID"

echo ""
echo "=== 完了 ==="
echo "INSTANCE_CONNECTION_NAME: $INSTANCE_CONNECTION_NAME"
echo "DB_PASSWORD: $DB_PASSWORD  ← 保存してください"
echo "SESSION_SECRET: $SESSION_SECRET  ← 保存してください"
echo ""
echo "次のステップ: scripts/deploy.sh を実行"
