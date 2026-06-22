# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This project is the **Smart IP Advisor** — an SAP sales/consulting tool that analyzes customer meeting transcripts and recommends the most relevant SAP IP solutions.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **AI**: OpenAI via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/               # Express API server
│   │   ├── data/ip_catalog.json  # SAP IP catalog (5 solutions)
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── analyze.ts    # POST /analyze, POST /analyze/email-pitch, GET /catalog
│   │       │   └── health.ts     # GET /healthz
│   │       └── services/
│   │           ├── aiService.ts      # OpenAI extraction, scoring, recommendation
│   │           └── catalogService.ts # Loads ip_catalog.json
│   └── ai-ip-copilot/            # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── Home.tsx      # Main analyzer UI
│           │   └── Catalog.tsx   # Full IP catalog browser
│           └── components/
│               ├── InsightsPanel.tsx         # Extracted insights display
│               ├── IpRecommendationCard.tsx  # IP recommendation with email pitch
│               ├── EmailPitchDialog.tsx      # Email pitch modal
│               └── TopNavigation.tsx         # Nav header
├── lib/
│   ├── api-spec/                   # OpenAPI spec + Orval codegen config
│   ├── api-client-react/           # Generated React Query hooks
│   ├── api-zod/                    # Generated Zod schemas from OpenAPI
│   ├── db/                         # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/  # Replit OpenAI integration wrapper
├── scripts/                         # Utility scripts
├── tsconfig.base.json
├── tsconfig.json                    # Root TS project references
└── package.json
```

## App Flow

1. User pastes a meeting transcript (or uploads a `.vtt` file)
2. Click "Analyze Conversation"
3. AI Pipeline:
   - **Step 1** — Extract insights: business problems, keywords, SAP modules, industry (GPT-5.2 with JSON output)
   - **Step 2** — Score the IP catalog using weighted matching (keywords 40%, problems 30%, modules 20%, industry 10%)
   - **Step 3** — Generate per-IP reasoning and customer-ready pitches using GPT-5.2
4. Results displayed: InsightsPanel + Top 3 IP Recommendation Cards
5. Optionally generate an email pitch for any recommendation

## API Endpoints

- `GET /api/healthz` — health check
- `GET /api/catalog` — returns all IPs from `data/ip_catalog.json`
- `POST /api/analyze` — main analysis endpoint; body: `{ transcript: string }`
- `POST /api/analyze/email-pitch` — generates email; body: `{ ipName, customerContext, reason }`

## IP Catalog

Located at `artifacts/api-server/data/ip_catalog.json`. Contains 5 IPs:
- IP001: Invoice Automation Accelerator (SAP S/4HANA, Document AI)
- IP002: Predictive Maintenance Engine (SAP IoT, BTP)
- IP003: Intelligent Procurement Assistant (SAP Ariba)
- IP004: Finance Close Automation Suite (SAP S/4HANA Finance)
- IP005: Customer Service Automation Platform (SAP CX, Service Cloud)

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`)
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Key Notes

- The API server builds with esbuild and runs from `dist/index.mjs`. The IP catalog JSON is loaded using `fs.readFileSync` with a path relative to the dist file (resolves to `../data/ip_catalog.json`)
- Frontend proxies `/api` requests to `http://localhost:8080` via Vite's dev server proxy
- OpenAI model: `gpt-5.2` with `max_completion_tokens` and `response_format: { type: "json_object" }`
- AI integration env vars: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
