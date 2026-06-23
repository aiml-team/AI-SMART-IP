#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export PORT="${PORT:-8080}"
export NODE_ENV="${NODE_ENV:-production}"

echo "[startup] Node: $(node -v)"
echo "[startup] PWD : $(pwd)"
echo "[startup] PORT: ${PORT}"

echo "[startup] Staging frontend into api-server/public ..."
if [ -d "artifacts/ai-ip-copilot/dist/public" ]; then
  rm -rf artifacts/api-server/public
  mkdir -p artifacts/api-server/public
  cp -R artifacts/ai-ip-copilot/dist/public/. artifacts/api-server/public/
  echo "[startup] Frontend staged from artifacts/ai-ip-copilot/dist/public"
elif [ -d "artifacts/api-server/public" ] && [ -f "artifacts/api-server/public/index.html" ]; then
  echo "[startup] Frontend already present in artifacts/api-server/public (pre-staged in CI)"
else
  echo "[startup] WARNING: No frontend build found; API will still start but SPA routes will 404"
  mkdir -p artifacts/api-server/public
fi

# ✅ ADDED: Install dependencies
echo "[startup] Installing dependencies..."
pnpm install

# ✅ ADDED: Build project
echo "[startup] Building API server..."
pnpm --filter api-server build || pnpm run build

# ✅ EXISTING CHECK (keep as-is)
if [ ! -f "artifacts/api-server/dist/index.mjs" ]; then
  echo "[startup] FATAL: artifacts/api-server/dist/index.mjs is missing."
  echo "[startup] Listing /home/site/wwwroot for debugging:"
  ls -la
  echo "[startup] Listing artifacts/api-server (if any):"
  ls -la artifacts/api-server 2>/dev/null || true
  exit 1
fi

echo "[startup] Launching server on port ${PORT} ..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs