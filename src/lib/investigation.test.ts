import { describe, expect, it } from "vitest";
import { createInvestigationSession, investigationReducer, mergeSearchClues } from "./investigation";

const clue = (kind: "query" | "category" | "color" | "feature" | "location" | "date" | "negative", value: string) => ({ kind, value, source: "human" as const });

describe("investigation session", () => {
  it("creates one session with an initial timeline step", () => {
    const session = createInvestigationSession({ id: "s1", originalQuery: "keys", clues: [clue("query", "keys")], candidateIds: ["LF-015", "LF-017"], createdAt: 10 });
    expect(session.searches).toEqual([{ id: "step-10", label: "keys", candidateCount: 2, candidateIds: ["LF-015", "LF-017"], createdAt: 10 }]);
  });
  it("deduplicates normalized clues", () => expect(mergeSearchClues([clue("feature", "Bear")], [clue("feature", "bear")])).toHaveLength(1));
  it("lets an explicit structured clue replace an older value", () => expect(mergeSearchClues([clue("color", "black")], [clue("color", "brown")])).toEqual([clue("color", "brown")]));
  it("accumulates independent feature clues", () => expect(mergeSearchClues([clue("feature", "bear")], [clue("feature", "silver ring")])).toHaveLength(2));
  it("appends a progressive search step", () => {
    const initial = createInvestigationSession({ id: "s1", originalQuery: "keys", clues: [], candidateIds: ["LF-015", "LF-017"], createdAt: 10 });
    const next = investigationReducer(initial, { type: "search", sessionId: "s1", clues: [clue("feature", "bear")], candidateIds: ["LF-017"], label: "Add bear", createdAt: 20 });
    expect(next?.searches).toHaveLength(2);
    expect(next?.status).toBe("possible_match");
  });
  it("ignores stale session actions", () => {
    const initial = createInvestigationSession({ id: "s1", originalQuery: "keys", clues: [], candidateIds: ["LF-017"], createdAt: 10 });
    expect(investigationReducer(initial, { type: "complete", sessionId: "stale" })).toBe(initial);
  });
  it("tracks best match and human confirmation states", () => {
    const initial = createInvestigationSession({ id: "s1", originalQuery: "keys", clues: [], candidateIds: ["LF-017"], createdAt: 10 });
    const compared = investigationReducer(initial, { type: "best_match", sessionId: "s1", itemId: "LF-017" });
    const confirmation = investigationReducer(compared, { type: "request_confirmation", sessionId: "s1", itemId: "LF-017" });
    expect(confirmation).toMatchObject({ bestMatch: "LF-017", status: "confirmation_required" });
  });
  it("resets all active session state", () => {
    const initial = createInvestigationSession({ id: "s1", originalQuery: "keys", clues: [], candidateIds: [], createdAt: 10 });
    expect(investigationReducer(initial, { type: "reset" })).toBeNull();
  });
});
