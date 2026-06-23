#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export PORT="${PORT:-8080}"
export NODE_ENV="${NODE_ENV:-production}"

echo "[startup] Node: $(node -v)"
echo "[startup] PWD : $(pwd)"
echo "[startup] PORT: ${PORT}"

if [ ! -f "artifacts/api-server/dist/index.mjs" ]; then
  echo "[startup] ERROR: Missing artifacts/api-server/dist/index.mjs"
  echo "[startup] Build api-server before deployment."
  exit 1
fi

if [ ! -d "artifacts/ai-ip-copilot/dist/public" ]; then
  echo "[startup] ERROR: Missing artifacts/ai-ip-copilot/dist/public"
  echo "[startup] Build frontend before deployment."
  exit 1
fi

echo "[startup] Staging frontend into api-server/public ..."
rm -rf artifacts/api-server/public
mkdir -p artifacts/api-server/public
cp -R artifacts/ai-ip-copilot/dist/public/. artifacts/api-server/public/

echo "[startup] Launching server on port ${PORT} ..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs