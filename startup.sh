#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

export PORT="${PORT:-8080}"
export NODE_ENV="${NODE_ENV:-production}"

echo "[startup] Node: $(node -v)"
echo "[startup] NPM : $(npm -v)"
echo "[startup] PWD : $(pwd)"
echo "[startup] PORT: ${PORT}"

echo "[startup] Staging frontend into api-server/public ..."
if [ -d "artifacts/ai-ip-copilot/dist/public" ]; then
  rm -rf artifacts/api-server/public
  mkdir -p artifacts/api-server/public
  cp -R artifacts/ai-ip-copilot/dist/public/. artifacts/api-server/public/
  echo "[startup] Frontend staged from artifacts/ai-ip-copilot/dist/public"
elif [ -d "artifacts/api-server/public" ] && [ -f "artifacts/api-server/public/index.html" ]; then
  echo "[startup] Frontend already present in artifacts/api-server/public"
else
  echo "[startup] WARNING: No frontend build found; API will still start but SPA routes will 404"
  mkdir -p artifacts/api-server/public
fi

echo "[startup] Checking pnpm..."
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[startup] pnpm not found. Installing pnpm..."
  npm install -g pnpm
else
  echo "[startup] pnpm already installed: $(pnpm -v)"
fi

echo "[startup] Installing dependencies..."
pnpm install --frozen-lockfile

echo "[startup] Building API server..."

if pnpm --filter api-server build; then
  echo "[startup] Built using pnpm --filter api-server build"
elif [ -f "artifacts/api-server/package.json" ]; then
  echo "[startup] Trying build from artifacts/api-server package..."
  cd artifacts/api-server
  pnpm run build || node build.mjs
  cd ../..
elif [ -f "artifacts/api-server/build.mjs" ]; then
  echo "[startup] Trying direct build.mjs..."
  node artifacts/api-server/build.mjs
else
  echo "[startup] ERROR: No valid build command found."
  exit 1
fi

if [ ! -f "artifacts/api-server/dist/index.mjs" ]; then
  echo "[startup] FATAL: artifacts/api-server/dist/index.mjs is missing after build."
  echo "[startup] Listing /home/site/wwwroot:"
  ls -la
  echo "[startup] Listing artifacts/api-server:"
  ls -la artifacts/api-server 2>/dev/null || true
  echo "[startup] Listing artifacts/api-server/dist:"
  ls -la artifacts/api-server/dist 2>/dev/null || true
  exit 1
fi

echo "[startup] Launching server on port ${PORT} ..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs