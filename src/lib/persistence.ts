import type { Casefile } from "../types/casefile";
import { parseCasefile } from "./casefile";

export const CASEFILE_STORAGE_KEY = "agent-lost-found.casefile.v1";

export interface CaseStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type CasefileLoadResult =
  | { status: "empty" }
  | { status: "restored"; casefile: Casefile; warnings: string[] }
  | { status: "discarded"; reason: "invalid_json" | "invalid_payload" | "unsupported_version" }
  | { status: "unavailable" };

export function loadActiveCase(storage: CaseStorage, catalogIds: ReadonlySet<string>): CasefileLoadResult {
  let serialized: string | null;
  try {
    serialized = storage.getItem(CASEFILE_STORAGE_KEY);
  } catch {
    return { status: "unavailable" };
  }
  if (serialized === null) return { status: "empty" };
  const result = parseCasefile(serialized, catalogIds);
  if (!result.ok) {
    try { storage.removeItem(CASEFILE_STORAGE_KEY); } catch { /* Continue in memory. */ }
    return { status: "discarded", reason: result.error };
  }
  return { status: "restored", casefile: result.casefile, warnings: result.warnings };
}

export function saveActiveCase(storage: CaseStorage, casefile: Casefile) {
  try {
    storage.setItem(CASEFILE_STORAGE_KEY, JSON.stringify(casefile));
    return { ok: true } as const;
  } catch {
    return { ok: false, error: "storage_unavailable" } as const;
  }
}

export function clearActiveCase(storage: CaseStorage) {
  try {
    storage.removeItem(CASEFILE_STORAGE_KEY);
    return { ok: true } as const;
  } catch {
    return { ok: false, error: "storage_unavailable" } as const;
  }
}
