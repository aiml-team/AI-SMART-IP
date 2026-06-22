import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { randomUUID } from "crypto";

export interface IpDocument {
  id: string;
  originalName: string;
  storedName: string;
  size: number;
  uploadedAt: string;
  mimeType: string;
}

function getDocsDir(ipId: string): string {
  const base = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../data/documents",
    ipId
  );
  return base;
}

function getMetaPath(ipId: string): string {
  return path.join(getDocsDir(ipId), "metadata.json");
}

export function getDocuments(ipId: string): IpDocument[] {
  const metaPath = getMetaPath(ipId);
  if (!existsSync(metaPath)) return [];
  try {
    return JSON.parse(readFileSync(metaPath, "utf-8")) as IpDocument[];
  } catch {
    return [];
  }
}

function saveDocuments(ipId: string, docs: IpDocument[]): void {
  const dir = getDocsDir(ipId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(getMetaPath(ipId), JSON.stringify(docs, null, 2), "utf-8");
}

export function addDocument(ipId: string, originalName: string, mimeType: string, buffer: Buffer): IpDocument {
  const id = randomUUID();
  const ext = path.extname(originalName);
  const storedName = `${id}${ext}`;
  const dir = getDocsDir(ipId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(path.join(dir, storedName), buffer);

  const doc: IpDocument = {
    id,
    originalName,
    storedName,
    size: buffer.length,
    uploadedAt: new Date().toISOString(),
    mimeType,
  };

  const docs = getDocuments(ipId);
  docs.push(doc);
  saveDocuments(ipId, docs);
  return doc;
}

export function deleteDocument(ipId: string, docId: string): boolean {
  const docs = getDocuments(ipId);
  const idx = docs.findIndex((d) => d.id === docId);
  if (idx === -1) return false;

  const doc = docs[idx];
  const filePath = path.join(getDocsDir(ipId), doc.storedName);
  if (existsSync(filePath)) {
    try { unlinkSync(filePath); } catch { }
  }

  docs.splice(idx, 1);
  saveDocuments(ipId, docs);
  return true;
}

export function getDocumentFilePath(ipId: string, docId: string): { path: string; doc: IpDocument } | null {
  const docs = getDocuments(ipId);
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return null;
  return { path: path.join(getDocsDir(ipId), doc.storedName), doc };
}
