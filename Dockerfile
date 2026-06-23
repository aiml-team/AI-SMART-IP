# =============================================================================
# AI-IP-Recommender (Smart IP Advisor) — production Docker image
#
# Multi-stage build:
#   Stage 1 (builder) — installs pnpm + all workspace deps and builds:
#     • artifacts/api-server/dist/index.mjs    (esbuild ESM bundle)
#     • artifacts/ai-ip-copilot/dist/public/   (Vite static SPA)
#   Stage 2 (runtime) — copies only the two outputs into a slim node image.
#
# The api-server bundle is fully self-contained (esbuild bundled everything
# except a list of native externs that are not actually used at runtime),
# so the runtime stage does NOT need node_modules.
# =============================================================================


# -----------------------------------------------------------------------------
# Stage 1: builder
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder

# git is needed by some pnpm install scripts; ca-certificates for TLS during install
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install the pinned pnpm version (matches root package.json packageManager).
RUN npm install -g pnpm@10.18.2

# Tell the root preinstall guard we're a CI/non-interactive build so it does
# not abort npm. The guard already short-circuits when invoked via pnpm.
ENV CI=true
WORKDIR /workspace

# ---- Layer 1: copy ONLY manifests + lockfile for cacheable pnpm install ----
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json tsconfig.json ./

# Copy every workspace package manifest (and its tsconfig where present).
# This list mirrors pnpm-workspace.yaml -> packages.
COPY artifacts/api-server/package.json                  artifacts/api-server/package.json
COPY artifacts/ai-ip-copilot/package.json               artifacts/ai-ip-copilot/package.json
COPY artifacts/mockup-sandbox/package.json              artifacts/mockup-sandbox/package.json
COPY lib/api-spec/package.json                          lib/api-spec/package.json
COPY lib/api-client-react/package.json                  lib/api-client-react/package.json
COPY lib/api-zod/package.json                           lib/api-zod/package.json
COPY lib/db/package.json                                lib/db/package.json
COPY lib/integrations-openai-ai-server/package.json     lib/integrations-openai-ai-server/package.json
COPY lib/integrations-openai-ai-react/package.json      lib/integrations-openai-ai-react/package.json
COPY scripts/package.json                               scripts/package.json

# Install all workspace dependencies (dev + prod) using the lockfile.
RUN pnpm install --frozen-lockfile

# ---- Layer 2: copy the rest of the source and build ----
COPY . .

# Build everything: typecheck libs, then recursively build api-server (esbuild)
# and ai-ip-copilot (vite). Defined in the root package.json "build" script.
RUN pnpm build

# Stage the frontend output into api-server/public — Express serves this dir
# directly in production (see artifacts/api-server/src/app.ts).
RUN rm -rf artifacts/api-server/public \
 && mkdir -p artifacts/api-server/public \
 && cp -R artifacts/ai-ip-copilot/dist/public/. artifacts/api-server/public/

# Sanity check: fail the build NOW if expected outputs are missing.
RUN test -f artifacts/api-server/dist/index.mjs \
 && test -f artifacts/api-server/public/index.html \
 && test -f artifacts/api-server/data/ip_catalog.json \
 && echo "[builder] All required outputs present."


# -----------------------------------------------------------------------------
# Stage 2: runtime
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

# Minimal runtime extras:
#   • dumb-init — proper PID 1 / signal forwarding so SIGTERM gracefully stops Node
#   • ca-certificates — required for HTTPS to Azure OpenAI
RUN apt-get update \
 && apt-get install -y --no-install-recommends dumb-init ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --home /home/nodejs --shell /bin/bash nodejs \
 && mkdir -p /home/nodejs \
 && chown -R nodejs:nodejs /home/nodejs

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

# Copy only the runtime artifacts. The esbuild bundle is fully self-contained,
# so we do NOT copy node_modules or any source files.
COPY --from=builder --chown=nodejs:nodejs /workspace/artifacts/api-server/dist   ./artifacts/api-server/dist
COPY --from=builder --chown=nodejs:nodejs /workspace/artifacts/api-server/public ./artifacts/api-server/public
COPY --from=builder --chown=nodejs:nodejs /workspace/artifacts/api-server/data   ./artifacts/api-server/data

# The catalog service expects to find ip_catalog.json relative to the bundle
# directory (../data from dist/index.mjs). Already correct since we kept the
# artifacts/api-server/ structure intact above.

USER nodejs

EXPOSE 8080

# Healthcheck — App Service does its own HTTP probes, but this is useful for
# local docker run, docker-compose, and ACR/Container Apps deployments.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

# Use dumb-init for clean signal handling (Ctrl-C, App Service stop, etc.)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
