import { describe, expect, it } from "vitest";
import type { ScoreSnapshot } from "../types/casefile";
import { calculateRankDeltas, changedEvidence } from "./rank-delta";

const snapshot = (stepId: string, scores: Record<string, number>, breakdowns: ScoreSnapshot["breakdowns"] = {}): ScoreSnapshot => ({ stepId, scores, breakdowns });

describe("rank delta", () => {
  it("covers up, down, same, entered, and removed movements", () => {
    const previous = snapshot("p", { A: 20, B: 15, C: 10, E: 5 });
    const current = snapshot("c", { A: 25, B: 10, C: 10, D: 18 });
    const deltas = calculateRankDeltas(previous, current, ["A", "B", "C", "E"], ["D", "A", "C", "B"]);
    expect(Object.fromEntries(deltas.map((delta) => [delta.item_id, delta.movement]))).toEqual({ D: "entered", A: "down", C: "same", B: "down", E: "removed" });
    const up = calculateRankDeltas(previous, current, ["B", "A"], ["A", "B"]).find((delta) => delta.item_id === "A");
    expect(up?.movement).toBe("up");
  });

  it("calculates score delta as current minus previous", () => {
    const [delta] = calculateRankDeltas(snapshot("p", { A: .35 }), snapshot("c", { A: .8 }), ["A"], ["A"]);
    expect(delta.score_delta).toBeCloseTo(.45);
  });

  it("reports only added, removed, or point-changed evidence", () => {
    const unchanged = { clue: "wallet", field: "category", points: 30, type: "positive" as const };
    expect(changedEvidence(
      [unchanged, { clue: "black", field: "color", points: 15, type: "positive" }],
      [unchanged, { clue: "black", field: "color", points: -20, type: "contradiction" }, { clue: "snap tab", field: "feature", points: 25, type: "positive" }],
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ clue: "black", points: 15, change: "removed" }),
      expect.objectContaining({ clue: "black", points: -20, change: "added" }),
      expect.objectContaining({ clue: "snap tab", points: 25, change: "added" }),
    ]));
  });

  it("keeps deterministic item ID ordering for absent ranks", () => {
    const deltas = calculateRankDeltas(snapshot("p", { B: 1, A: 1 }), snapshot("c", {}), ["B", "A"], []);
    expect(deltas.map((delta) => delta.item_id)).toEqual(["A", "B"]);
  });
});
