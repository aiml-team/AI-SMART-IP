#!/usr/bin/env bash
# =============================================================================
# Azure Web App startup script for AI-IP-Recommender
# Set this as the Web App "Startup Command":
#     bash startup.sh
# =============================================================================
set -euo pipefail

echo "[startup] Node: $(node -v)"
echo "[startup] PWD : $(pwd)"

# Azure deploys the repo to /home/site/wwwroot. Make sure pnpm is available.
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[startup] Installing pnpm globally..."
  npm install -g pnpm@9
fi

# Install dependencies if node_modules is missing (Oryx usually does this,
# but this guard handles zip-deploy / partial-build scenarios).
if [ ! -d "node_modules" ]; then
  echo "[startup] Running pnpm install --prod=false ..."
  pnpm install --frozen-lockfile
fi

# Build api-server and frontend if dist outputs are missing.
if [ ! -f "artifacts/api-server/dist/index.mjs" ]; then
  echo "[startup] Building api-server..."
  pnpm --filter @workspace/api-server run build
fi

if [ ! -d "artifacts/ai-ip-copilot/dist/public" ]; then
  echo "[startup] Building frontend..."
  pnpm --filter @workspace/ai-ip-copilot run build
fi

# Copy the built frontend next to the api-server dist so Express can serve it.
echo "[startup] Staging frontend into api-server/public ..."
rm -rf artifacts/api-server/public
mkdir -p artifacts/api-server/public
cp -R artifacts/ai-ip-copilot/dist/public/. artifacts/api-server/public/

# Azure provides PORT; fall back to 8080 for local runs.
export PORT="${PORT:-8080}"
export NODE_ENV="${NODE_ENV:-production}"

echo "[startup] Launching server on port ${PORT} ..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
