import { describe, expect, it } from "vitest";
import itemsData from "../data/items.json";
import type { Casefile } from "../types/casefile";
import type { LostItem } from "../types/item";
import type { SearchClue } from "../types/investigation";
import { applyClueMutation, applyMutationToCasefile, undoClueMutation, type ClueMutationState } from "./clue-mutations";

const items = itemsData as LostItem[];
const clue = (kind: SearchClue["kind"], value: string, source: SearchClue["source"] = "query"): SearchClue => ({ kind, value, source });
const state = (clues: SearchClue[] = []): ClueMutationState => ({ clues, undoStack: [] });

function walletCase(): Casefile {
  return { version: 1, id: "wallet-case", locale: "zh-TW", originalDescription: "棕色皮夾", clues: [clue("category", "wallet"), clue("color", "brown")], candidateIds: ["LF-013", "LF-014"], steps: [], scoreSnapshots: [], status: "needs_clue", createdAt: 1, updatedAt: 1 };
}

describe("atomic clue mutations", () => {
  it("adds a normalized human clue and records an undo point", () => {
    const result = applyClueMutation(state([clue("category", "wallet")]), { action: "add", clue: clue("feature", " snap tab ", "agent") });
    expect(result).toMatchObject({ ok: true, changed: true, stepType: "clue_added", state: { clues: [{ kind: "category" }, { kind: "feature", value: "snap tab", source: "human" }], undoStack: [[{ kind: "category" }]] } });
  });

  it("ignores exact duplicates without adding history", () => {
    const initial = state([clue("feature", "snap tab", "human")]);
    expect(applyClueMutation(initial, { action: "add", clue: clue("feature", "SNAP-TAB") })).toEqual({ ok: true, changed: false, state: initial, reason: "duplicate" });
  });

  it("resolves positive and negative forms atomically", () => {
    const result = applyClueMutation(state([clue("feature", "card holder")]), { action: "reject", clue: clue("feature", "card holder") });
    expect(result.ok && result.changed && result.state.clues).toEqual([{ kind: "negative", value: "card holder", source: "human" }]);
  });

  it("replaces a conflicting structured clue atomically", () => {
    const result = applyClueMutation(state([clue("color", "black", "query"), clue("category", "wallet")]), { action: "replace", previous: clue("color", "black"), next: clue("color", "brown") });
    expect(result.ok && result.changed && result.state.clues).toEqual([clue("category", "wallet"), clue("color", "brown", "human")]);
  });

  it("leaves state unchanged for invalid or missing replacements", () => {
    const initial = state([clue("color", "black")]);
    expect(applyClueMutation(initial, { action: "add", clue: clue("feature", " ") })).toEqual({ ok: false, state: initial, error: "invalid_clue" });
    expect(applyClueMutation(initial, { action: "replace", previous: clue("color", "red"), next: clue("color", "brown") })).toEqual({ ok: false, state: initial, error: "missing_previous" });
  });

  it("undo restores the exact previous clue state", () => {
    const added = applyClueMutation(state([clue("category", "wallet")]), { action: "add", clue: clue("feature", "snap tab") });
    expect(added.ok && added.changed && undoClueMutation(added.state)).toMatchObject({ changed: true, state: { clues: [{ kind: "category", value: "wallet" }], undoStack: [] } });
  });
});

describe("casefile mutation pipeline", () => {
  it("adds a real step and snapshot and raises the brown snap wallet", () => {
    const result = applyMutationToCasefile(walletCase(), { action: "add", clue: clue("feature", "snap tab", "human") }, items, 10);
    expect(result.casefile.bestMatch).toBe("LF-013");
    expect(result.casefile.steps).toEqual([{ id: "step-10-0", type: "clue_added", labelKey: "timeline.clue_added", candidateIds: expect.any(Array), createdAt: 10 }]);
    expect(result.casefile.scoreSnapshots[0].scores["LF-013"]).toBeGreaterThan(result.casefile.scoreSnapshots[0].scores["LF-014"] ?? 0);
  });

  it("rejecting card holder weakens LF-014 without a special-case item branch", () => {
    const result = applyMutationToCasefile(walletCase(), { action: "reject", clue: clue("feature", "card holder", "human") }, items, 11);
    expect(result.casefile.bestMatch).toBe("LF-013");
    expect(result.casefile.scoreSnapshots[0].breakdowns["LF-014"]).toEqual(expect.arrayContaining([expect.objectContaining({ type: "contradiction", points: -30 })]));
  });

  it("preserves the case with no candidates and never opens claim review", () => {
    const result = applyMutationToCasefile(walletCase(), { action: "replace", previous: clue("category", "wallet"), next: clue("category", "spaceship") }, items, 12);
    expect(result.casefile).toMatchObject({ candidateIds: [], status: "needs_clue", claimCandidateId: undefined });
  });
});
