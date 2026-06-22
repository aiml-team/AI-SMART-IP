import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import type { IpItem } from "./aiService.js";

let catalogCache: IpItem[] | null = null;

function getCatalogPath(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../data/ip_catalog.json"
  );
}

export function getIpCatalog(): IpItem[] {
  if (catalogCache) return catalogCache;
  const raw = readFileSync(getCatalogPath(), "utf-8");
  catalogCache = JSON.parse(raw) as IpItem[];
  return catalogCache;
}

export function saveIpCatalog(catalog: IpItem[]): void {
  writeFileSync(getCatalogPath(), JSON.stringify(catalog, null, 2), "utf-8");
  catalogCache = catalog;
}

export function getIpById(id: string): IpItem | null {
  const catalog = getIpCatalog();
  return catalog.find((item) => item.id === id) ?? null;
}

export function addIpEntry(ip: IpItem): IpItem {
  const catalog = getIpCatalog();
  catalog.push(ip);
  saveIpCatalog(catalog);
  return ip;
}

export function deleteIpEntry(id: string): boolean {
  const catalog = getIpCatalog();
  const idx = catalog.findIndex((item) => item.id === id);
  if (idx === -1) return false;
  catalog.splice(idx, 1);
  saveIpCatalog(catalog);
  return true;
}

export function updateIpEntry(id: string, fields: Omit<IpItem, "id">): IpItem | null {
  const catalog = getIpCatalog();
  const idx = catalog.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  const updated: IpItem = { id, ...fields };
  catalog[idx] = updated;
  saveIpCatalog(catalog);
  return updated;
}

export function generateIpId(catalog: IpItem[]): string {
  const existingNums = catalog
    .map((item) => {
      const m = item.id.match(/^IP(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
  return `IP${String(next).padStart(3, "0")}`;
}
