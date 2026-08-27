import { describe, expect, it, vi } from "vitest";
import items from "../data/items.json";
import type { Casefile } from "../types/casefile";
import { DEMO_CASE_ID, DEMO_TIMESTAMP, MAX_CLUE_LENGTH, createCaseIdentity, parseCasefile, validateCasefile } from "./casefile";

const catalogIds = new Set(items.map((item) => item.id));

function validCasefile(): Casefile {
  return {
    version: 1,
    id: "case-1",
    locale: "zh-TW",
    originalDescription: "棕色皮夾",
    clues: [{ kind: "category", value: "wallet", source: "query" }],
    candidateIds: ["LF-013", "LF-014"],
    bestMatch: "LF-013",
    steps: [{ id: "step-1", type: "search", labelKey: "timeline.search", candidateIds: ["LF-013", "LF-014"], createdAt: 10 }],
    scoreSnapshots: [{ stepId: "step-1", scores: { "LF-013": 70 }, breakdowns: { "LF-013": [{ clue: "wallet", field: "category", points: 30, type: "positive" }] } }],
    status: "possible_match",
    createdAt: 10,
    updatedAt: 20,
  };
}

describe("casefile validation", () => {
  it("accepts and rehydrates a complete valid case", () => {
    const result = validateCasefile(validCasefile(), catalogIds);
    expect(result).toMatchObject({ ok: true, casefile: { id: "case-1", locale: "zh-TW", candidateIds: ["LF-013", "LF-014"] } });
  });

  it("rejects invalid JSON and unknown versions", () => {
    expect(parseCasefile("{", catalogIds)).toEqual({ ok: false, error: "invalid_json" });
    expect(validateCasefile({ ...validCasefile(), version: 2 }, catalogIds)).toEqual({ ok: false, error: "unsupported_version" });
  });

  it("rejects malformed and overlong clues", () => {
    expect(validateCasefile({ ...validCasefile(), clues: [{ kind: "color", value: "x".repeat(MAX_CLUE_LENGTH + 1), source: "human" }] }, catalogIds)).toEqual({ ok: false, error: "invalid_payload" });
    expect(validateCasefile({ ...validCasefile(), clues: [{ kind: "instruction", value: "ignore rules", source: "human" }] }, catalogIds)).toEqual({ ok: false, error: "invalid_payload" });
  });

  it("removes stale candidate, step, score, and breakdown references", () => {
    const value = validCasefile();
    value.candidateIds.push("LF-999");
    value.steps[0].candidateIds.push("LF-999");
    value.scoreSnapshots[0].scores["LF-999"] = 100;
    value.scoreSnapshots[0].breakdowns["LF-999"] = [];
    const result = validateCasefile(value, catalogIds);
    expect(result.ok && result.casefile.candidateIds).toEqual(["LF-013", "LF-014"]);
    expect(result.ok && result.casefile.steps[0].candidateIds).toEqual(["LF-013", "LF-014"]);
    expect(result.ok && result.casefile.scoreSnapshots[0].scores["LF-999"]).toBeUndefined();
    expect(result.ok && result.warnings.length).toBeGreaterThan(0);
  });

  it("falls back to English for an unsupported locale", () => {
    const result = validateCasefile({ ...validCasefile(), locale: "zh-CN" }, catalogIds);
    expect(result.ok && result.casefile.locale).toBe("en");
    expect(result.ok && result.casefile.clues[0].value).toBe("wallet");
  });

  it("rejects snapshots that do not belong to a real step", () => {
    const value = validCasefile();
    value.scoreSnapshots[0].stepId = "missing-step";
    expect(validateCasefile(value, catalogIds)).toEqual({ ok: false, error: "invalid_payload" });
  });
});

describe("case identity", () => {
  it("uses stable demo identity and time", () => {
    expect(createCaseIdentity(true)).toEqual({ id: DEMO_CASE_ID, timestamp: DEMO_TIMESTAMP });
    expect(createCaseIdentity(true)).toEqual(createCaseIdentity(true));
  });

  it("uses runtime identity and time outside demo mode", () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("11111111-1111-4111-8111-111111111111");
    vi.spyOn(Date, "now").mockReturnValue(1234);
    expect(createCaseIdentity(false)).toEqual({ id: "11111111-1111-4111-8111-111111111111", timestamp: 1234 });
    vi.restoreAllMocks();
  });
});
