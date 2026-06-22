import { Router, type IRouter } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { AnalyzeTranscriptBody, GenerateEmailPitchBody, CreateIpEntryBody } from "@workspace/api-zod";
import {
  extractInsights,
  scoreIpCatalog,
  getTopIps,
  generateRecommendationReasons,
  generateEmailPitch,
} from "../services/aiService.js";
import {
  getIpCatalog,
  getIpById,
  addIpEntry,
  updateIpEntry,
  deleteIpEntry,
  generateIpId,
  saveIpCatalog,
} from "../services/catalogService.js";
import {
  getDocuments,
  addDocument,
  deleteDocument,
  getDocumentFilePath,
} from "../services/documentService.js";
import type { IpItem } from "../services/aiService.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post("/analyze", async (req, res) => {
  const parseResult = AnalyzeTranscriptBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "validation_error", message: parseResult.error.message });
    return;
  }

  const { transcript } = parseResult.data;

  if (!transcript || transcript.trim().length === 0) {
    res.status(400).json({ error: "invalid_input", message: "Transcript cannot be empty" });
    return;
  }

  try {
    const catalog = getIpCatalog();
    const insights = await extractInsights(transcript);
    const scoredIps = scoreIpCatalog(insights, catalog);
    const topIps = getTopIps(scoredIps, 3);
    const recommendations = await generateRecommendationReasons(insights, topIps);
    res.json({ insights, recommendations });
  } catch (err) {
    req.log.error({ err }, "Error analyzing transcript");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "analysis_failed", message });
  }
});

router.post("/analyze/email-pitch", async (req, res) => {
  const parseResult = GenerateEmailPitchBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "validation_error", message: parseResult.error.message });
    return;
  }

  const { ipName, customerContext, reason } = parseResult.data;

  try {
    const result = await generateEmailPitch(ipName, customerContext, reason);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error generating email pitch");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "pitch_generation_failed", message });
  }
});

// ── Catalog list + create ────────────────────────────────────────────────────

router.get("/catalog", (_req, res) => {
  try {
    const catalog = getIpCatalog();
    res.json({ items: catalog });
  } catch (err) {
    res.status(500).json({ error: "catalog_load_failed", message: "Failed to load IP catalog" });
  }
});

router.post("/catalog", (req, res) => {
  const parseResult = CreateIpEntryBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "validation_error", message: parseResult.error.message });
    return;
  }

  try {
    const catalog = getIpCatalog();
    const id = generateIpId(catalog);
    const newIp: IpItem = { id, ...parseResult.data };
    addIpEntry(newIp);
    res.status(201).json(newIp);
  } catch (err) {
    req.log.error({ err }, "Error creating IP entry");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "create_failed", message });
  }
});

// ── Excel bulk upload ────────────────────────────────────────────────────────

router.post("/catalog/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "no_file", message: "No file uploaded" });
    return;
  }

  const ext = req.file.originalname.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls"].includes(ext ?? "")) {
    res.status(400).json({ error: "invalid_file_type", message: "Only .xlsx or .xls files are supported" });
    return;
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      res.status(400).json({ error: "empty_file", message: "Excel file has no sheets" });
      return;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "" });

    const catalog = getIpCatalog();
    const errors: string[] = [];
    let added = 0;
    let skipped = 0;

    const parseList = (val: string): string[] =>
      val ? val.split(/[,;|]+/).map((s) => s.trim()).filter(Boolean) : [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const name = (row["name"] ?? row["Name"] ?? "").trim();
      const description = (row["description"] ?? row["Description"] ?? "").trim();
      const valueProposition = (row["valueProposition"] ?? row["Value Proposition"] ?? row["value_proposition"] ?? "").trim();
      const pitch = (row["pitch"] ?? row["Pitch"] ?? "").trim();

      if (!name || !description) {
        errors.push(`Row ${rowNum}: missing required fields 'name' or 'description'`);
        skipped++;
        continue;
      }

      const id = generateIpId(catalog);

      const ip: IpItem = {
        id,
        name,
        description,
        businessProblems: parseList(row["businessProblems"] ?? row["Business Problems"] ?? row["business_problems"] ?? ""),
        industries: parseList(row["industries"] ?? row["Industries"] ?? ""),
        sapModules: parseList(row["sapModules"] ?? row["SAP Modules"] ?? row["sap_modules"] ?? ""),
        keywords: parseList(row["keywords"] ?? row["Keywords"] ?? ""),
        triggerSignals: parseList(row["triggerSignals"] ?? row["Trigger Signals"] ?? row["trigger_signals"] ?? ""),
        valueProposition,
        pitch,
        differentiators: (row["differentiators"] ?? row["Differentiators"] ?? "").trim(),
        implementationEffort: (row["implementationEffort"] ?? row["Implementation Effort"] ?? row["implementation_effort"] ?? "Medium").trim(),
        maturityLevel: (row["maturityLevel"] ?? row["Maturity Level"] ?? row["maturity_level"] ?? "MVP").trim(),
      };

      catalog.push(ip);
      added++;
    }

    if (added > 0) {
      saveIpCatalog(catalog);
    }

    res.json({ added, skipped, errors });
  } catch (err) {
    req.log.error({ err }, "Error processing Excel upload");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "upload_failed", message });
  }
});

// ── Single IP CRUD ───────────────────────────────────────────────────────────

router.delete("/catalog/:id", (req, res) => {
  const deleted = deleteIpEntry(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "not_found", message: `IP ${req.params.id} not found` });
    return;
  }
  res.json({ success: true });
});

router.get("/catalog/:id", (req, res) => {
  const ip = getIpById(req.params.id);
  if (!ip) {
    res.status(404).json({ error: "not_found", message: `IP ${req.params.id} not found` });
    return;
  }
  res.json(ip);
});

router.put("/catalog/:id", (req, res) => {
  const parseResult = CreateIpEntryBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "validation_error", message: parseResult.error.message });
    return;
  }

  const updated = updateIpEntry(req.params.id, parseResult.data);
  if (!updated) {
    res.status(404).json({ error: "not_found", message: `IP ${req.params.id} not found` });
    return;
  }
  res.json(updated);
});

// ── Per-IP document management ───────────────────────────────────────────────

router.get("/catalog/:id/documents", (req, res) => {
  const ip = getIpById(req.params.id);
  if (!ip) {
    res.status(404).json({ error: "not_found", message: `IP ${req.params.id} not found` });
    return;
  }
  const documents = getDocuments(req.params.id);
  res.json({ documents });
});

router.post("/catalog/:id/documents", upload.single("file"), (req, res) => {
  const ip = getIpById(req.params.id);
  if (!ip) {
    res.status(404).json({ error: "not_found", message: `IP ${req.params.id} not found` });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "no_file", message: "No file uploaded" });
    return;
  }

  try {
    const doc = addDocument(
      req.params.id,
      req.file.originalname,
      req.file.mimetype,
      req.file.buffer
    );
    res.status(201).json(doc);
  } catch (err) {
    req.log.error({ err }, "Error uploading document");
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: "upload_failed", message });
  }
});

router.delete("/catalog/:id/documents/:docId", (req, res) => {
  const ip = getIpById(req.params.id);
  if (!ip) {
    res.status(404).json({ error: "not_found", message: `IP ${req.params.id} not found` });
    return;
  }

  const deleted = deleteDocument(req.params.id, req.params.docId);
  if (!deleted) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }
  res.json({ success: true });
});

router.get("/catalog/:id/documents/:docId/download", (req, res) => {
  const result = getDocumentFilePath(req.params.id, req.params.docId);
  if (!result) {
    res.status(404).json({ error: "not_found", message: "Document not found" });
    return;
  }
  res.download(result.path, result.doc.originalName);
});

export default router;
