import { describe, expect, it } from "vitest";
import items from "../data/items.json";
import type { Casefile } from "../types/casefile";
import { CASEFILE_STORAGE_KEY, clearActiveCase, loadActiveCase, saveActiveCase, type CaseStorage } from "./persistence";

const catalogIds = new Set(items.map((item) => item.id));

function casefile(): Casefile {
  return { version: 1, id: "case-1", locale: "en", originalDescription: "wallet", clues: [], candidateIds: ["LF-013"], steps: [], scoreSnapshots: [], status: "possible_match", createdAt: 1, updatedAt: 2 };
}

function memoryStorage(seed: Record<string, string> = {}): CaseStorage & { data: Record<string, string> } {
  const data = { ...seed };
  return { data, getItem: (key) => data[key] ?? null, setItem: (key, value) => { data[key] = value; }, removeItem: (key) => { delete data[key]; } };
}

describe("casefile persistence", () => {
  it("saves and restores a valid case", () => {
    const storage = memoryStorage();
    expect(saveActiveCase(storage, casefile())).toEqual({ ok: true });
    expect(loadActiveCase(storage, catalogIds)).toMatchObject({ status: "restored", casefile: { id: "case-1" } });
  });

  it("discards only the owned key for invalid JSON", () => {
    const storage = memoryStorage({ [CASEFILE_STORAGE_KEY]: "{", unrelated: "keep" });
    expect(loadActiveCase(storage, catalogIds)).toEqual({ status: "discarded", reason: "invalid_json" });
    expect(storage.data).toEqual({ unrelated: "keep" });
  });

  it("continues when reading or writing storage fails", () => {
    const storage: CaseStorage = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("full"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(loadActiveCase(storage, catalogIds)).toEqual({ status: "unavailable" });
    expect(saveActiveCase(storage, casefile())).toEqual({ ok: false, error: "storage_unavailable" });
    expect(clearActiveCase(storage)).toEqual({ ok: false, error: "storage_unavailable" });
  });

  it("reset removes the case key and preserves unrelated data", () => {
    const storage = memoryStorage({ [CASEFILE_STORAGE_KEY]: "case", unrelated: "keep" });
    expect(clearActiveCase(storage)).toEqual({ ok: true });
    expect(storage.data).toEqual({ unrelated: "keep" });
  });
});
