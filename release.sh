#!/usr/bin/env bash
set -e

echo "🚀 Starting release pipeline..."

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
USER_ID="$(id -u)"
GROUP_ID="$(id -g)"

# ---------- Frontend ----------
echo "📦 Building frontend..."
sudo systemd-run --scope \
  --uid="$USER_ID" \
  --gid="$GROUP_ID" \
  bash -lc "
    cd '$ROOT_DIR/frontend' &&
    rm -rf .next &&
    npm run buildp
  "

# ---------- Cool down memory ----------
echo "🧹 Cooling down memory..."
sleep 5
sync
echo 3 | sudo tee /proc/sys/vm/drop_caches > /dev/null

# ---------- Backend ----------
echo "🔧 Building backend..."
sudo systemd-run --scope \
  --uid="$USER_ID" \
  --gid="$GROUP_ID" \
  bash -lc "
    cd '$ROOT_DIR/backend' &&
    npm run build
  "

# ---------- Restart services ----------
echo "♻️ Restarting PM2..."
pm2 restart all

echo "✅ Release complete!"
