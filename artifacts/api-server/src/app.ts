import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

// ── Serve built frontend (Azure Web App single-service deployment) ───────────
// The frontend is built to artifacts/ai-ip-copilot/dist/public. When deploying
// the api-server to Azure, we copy that folder next to dist/ as ./public so
// the bundled server can find it relative to dist/index.mjs.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const candidatePaths = [
  path.resolve(__dirname, "../public"), // api-server/public (after deploy)
  path.resolve(__dirname, "../../ai-ip-copilot/dist/public"), // local monorepo build
];
const frontendDir = candidatePaths.find((p) => fs.existsSync(p));

if (frontendDir) {
  logger.info({ frontendDir }, "Serving frontend static files");
  app.use(express.static(frontendDir));
  // SPA fallback — send index.html for any non-/api route
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
  });
} else {
  logger.warn({ candidatePaths }, "No frontend build found; serving API only");
}

export default app;
